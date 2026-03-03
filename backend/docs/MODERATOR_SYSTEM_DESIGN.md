# Moderator System — Production-Grade Backend Design

**Tech stack:** Node.js, TypeScript (strict), Fastify, JWT (Bearer + optional HttpOnly cookies), **Drizzle ORM** (PostgreSQL), Redis, Kafka, Pino, Docker.

> **Note:** This codebase uses **Drizzle** (not Prisma). Schema and migrations are in `src/db/schema.ts` and `drizzle.config.ts`.

---

## 1. Folder Structure

```
backend/
├── src/
│   ├── app.ts                    # Fastify app, route registration, tRPC at /trpc
│   ├── server.ts                 # Entry: DB, Redis, Kafka, Fastify
│   ├── config/                   # Drizzle, Redis, Kafka, JWT keys
│   ├── db/
│   │   ├── schema.ts             # All tables: users, posts, moderation_*, appeals, archive_*, legal_holds, audit
│   │   └── migrations/           # Drizzle migrations
│   ├── middleware/
│   │   ├── auth.ts               # requireAuth (JWT)
│   │   ├── rbac.ts               # requireRole, requirePermission, role hierarchy
│   │   └── admin.ts              # (optional) admin-only helpers
│   ├── modules/
│   │   ├── moderation/           # Pre-moderation queue, decisions, lock, queue, events
│   │   │   ├── moderation.routes.ts
│   │   │   ├── moderation.controller.ts
│   │   │   ├── moderation.service.ts
│   │   │   ├── moderation.repository.ts
│   │   │   ├── moderation.schema.ts       # Zod validation
│   │   │   ├── moderation.queue.ts        # Redis sorted set
│   │   │   ├── moderation.lock.ts         # Redis distributed lock
│   │   │   ├── moderation.events.ts       # Kafka producer
│   │   │   ├── moderation.sla.ts          # SLA timers (Redis)
│   │   │   └── moderation.rate-limit.ts   # Redis rate limit for mod actions
│   │   ├── appeals/              # User appeals against enforcement
│   │   │   ├── appeals.routes.ts
│   │   │   ├── appeals.controller.ts
│   │   │   ├── appeals.service.ts
│   │   │   ├── appeals.repository.ts
│   │   │   └── appeals.schema.ts
│   │   ├── audit/                # Central audit (admin_audit_logs)
│   │   ├── admin/
│   │   └── post/                 # Post state machine, submit for review
│   ├── trpc/
│   │   ├── router.ts             # Root router (moderation, admin, post, appeals)
│   │   ├── context.ts
│   │   ├── trpc.ts               # moderatorProcedure, adminProcedure
│   │   └── routers/
│   │       ├── moderation.router.ts
│   │       ├── admin.router.ts
│   │       ├── post.router.ts
│   │       └── appeals.router.ts
│   └── utils/
│       ├── AppError.ts
│       └── audit.ts
├── drizzle.config.ts
├── Dockerfile
└── docs/
    └── MODERATOR_SYSTEM_DESIGN.md (this file)
```

---

## 2. Database Schema (Drizzle)

### 2.1 Existing (summary)

- **users** — id, role (USER | MODERATOR | ADMIN | SUPER_ADMIN | …), status, …
- **posts** — id, userId, status (DRAFT | PENDING_REVIEW | APPROVED | PUBLISHED | REJECTED | REMOVED | …), riskScore, reviewedBy, reviewedAt, moderationMetadata (JSONB)
- **moderation_logs** — postId, moderatorId, action, previousStatus, newStatus, reason, internalNote, metadata
- **moderation_reports** — reporterId, postId/commentId/targetUserId, reason, category, status, priorityScore, resolution, resolvedById
- **moderation_queue** — reportId, assignedToId, priority, lockedUntil (report-based queue)
- **admin_audit_logs** — adminId, actionType, resourceType, resourceId, previousState, newState, ipAddress, userAgent, reason

### 2.2 New / Extended

- **posts.moderationMetadata** — extend with `riskBreakdown?: { category: string; score: number }[]` (JSONB) for AI risk breakdown.
- **appeals** — id, userId, resourceType (POST | USER | COMMENT), resourceId, enforcementType (CONTENT_REMOVAL | SUSPENSION | BAN | RESTRICTION | OVERRIDE), originalModerationLogId, status (PENDING | APPROVED | REJECTED | MODIFIED), reviewerId, reviewedAt, justification, policyReference, createdAt, updatedAt. Indexes: (userId, status), (resourceType, resourceId), (status, createdAt).
- **archive_records** — id, resourceType, resourceId, archivedAt, archivedById, retentionUntil, legalHoldId (nullable), reason. Indexes: (resourceType, resourceId), (retentionUntil), (legalHoldId).
- **legal_holds** — id, resourceType, resourceId, reason, heldBy, heldAt, releasedAt. Indexes: (resourceType, resourceId).

All moderation and appeal decisions are **immutable** in audit: append-only logs, no deletes.

---

## 3. API Route Structure

| Area        | REST prefix   | tRPC router     | Auth / Role              |
|------------|---------------|-----------------|---------------------------|
| Public     | /auth, /posts | (public procs)  | Optional / none          |
| User       | /posts, /users| post.*, user.*  | requireAuth               |
| Moderator  | /moderation   | moderation.*    | requireAuth + moderator   |
| Admin      | /admin        | admin.*         | requireAuth + admin       |
| Appeals    | /appeals      | appeals.*       | User submit; Mod/Admin review |

- **Versioning:** Optional `/v1` prefix (e.g. `/v1/moderation`). Current code uses `/moderation`, `/admin` without version.
- **Pagination:** Cursor or offset; filter by status, date, severity, moderator.

---

## 4. Middleware Design

1. **Rate limit** (global) — Redis, per-IP.
2. **Auth** — JWT in `Authorization: Bearer <token>` (and optional cookie). Sets `request.user` / `request.session.userId`.
3. **RBAC** — `requireRole("MODERATOR" | "ADMIN" | "SUPER_ADMIN")` or `requirePermission(PERMISSIONS.MOD_APPROVE)`.
4. **Moderation action rate limit** — Redis key `mod:ratelimit:{moderatorId}:{window}` to cap approvals/rejects per minute (abuse prevention).
5. **Scoped access (optional)** — Category or region in JWT or DB; filter queue by scope in repository.

Audit: every moderator/admin action logged via `AuditService.logFromRequest` (actor, action, resource, IP, userAgent, reason).

---

## 5. Moderation State Machine

```
                    ┌─────────────┐
                    │   DRAFT     │
                    └──────┬──────┘
                           │ SUBMIT (owner)
                           ▼
                    ┌─────────────┐     APPROVE (mod)      ┌─────────────┐
                    │PENDING_REVIEW│──────────────────────►│  APPROVED   │
                    └──────┬──────┘                        └──────┬──────┘
                           │ REJECT / REQUEST_REVISION / ESCALATE  │ PUBLISH (system)
                           ▼                                       ▼
                    ┌─────────────┐                        ┌─────────────┐
                    │ REJECTED /  │                        │  PUBLISHED  │
                    │NEEDS_REVISION│                        └──────┬──────┘
                    └──────┬──────┘                               │ REMOVE (mod)
                           │ RESUBMIT (owner)                     ▼
                           └─────────────────────────────►┌─────────────┐
                                                           │  REMOVED    │
                                                           └──────┬──────┘
                                                                  │ RESTORE (admin only)
                                                                  ▼
                                                           ┌─────────────┐
                                                           │  PUBLISHED  │
                                                           └─────────────┘
```

- **Re-open decision:** Admin/Super Admin can move REMOVED/REJECTED back to PUBLISHED (RESTORE) or PENDING_REVIEW (re-open); each step logged.
- **Hard delete:** Super Admin only; separate endpoint with typed confirmation; record in audit only (row delete or soft-delete flag in schema).

---

## 6. Queue Architecture (Text Diagram)

```
  ┌──────────────┐     submit for review      ┌─────────────────────┐
  │   Post API   │───────────────────────────►│  posts.status =     │
  │  (User)      │                             │  PENDING_REVIEW      │
  └──────────────┘                             └──────────┬──────────┘
                                                          │
                                                          │ enqueue
                                                          ▼
  ┌──────────────┐     ZREVRANGE (priority)   ┌─────────────────────┐
  │  Moderator   │◄──────────────────────────│  Redis ZSET         │
  │  Dashboard   │     mod:queue:pending       │  score = priority   │
  └──────┬───────┘     + metadata keys        │  (risk, reports,    │
         │             mod:queue:meta:{id}    │   recency)          │
         │ moderate    mod:sla:{postId}        └─────────────────────┘
         │ (lock)      mod:lock:{postId}
         ▼
  ┌──────────────┐     acquire lock           ┌─────────────────────┐
  │ Moderation   │───────────────────────────►│  Redis SET NX EX    │
  │ Service      │     release on done        │  mod:lock:{postId}  │
  └──────┬───────┘                            └─────────────────────┘
         │
         │ update post + insert moderation_logs + dequeue + event
         ▼
  ┌──────────────┐     produce                ┌─────────────────────┐
  │  Kafka       │◄──────────────────────────│  post.approved /     │
  │  (events)    │                            │  post.rejected /     │
  └──────────────┘                            │  post.removed / …    │
                                              └─────────────────────┘
```

- **Assignment:** `moderation_queue.assignedToId` for report-based items; for content queue, optional auto-assign on lock (assign to moderator who acquired lock) or manual assign via API.
- **SLA:** Redis key `mod:sla:{postId}` with TTL or timestamp; background job or on-read checks for breach; alert on breach.

---

## 7. Security Best Practices

- **CSRF:** Use SameSite cookies and/or double-submit cookie if using cookie-based auth.
- **JWT:** RS256; short-lived access token; refresh token in DB/session; optional rotation.
- **Cookies:** HttpOnly, Secure, SameSite=Strict when used.
- **Input validation:** Zod on all request bodies (moderation.schema.ts, appeals.schema.ts).
- **SQL:** Drizzle parameterized queries only (no raw concatenation).
- **Secrets:** Env-based (e.g. JWT keys, DB URL, Redis URL); no secrets in code.
- **Anti–privilege-escalation:** `requireHigherRole(targetRole)` when assigning roles; prevent moderator from granting admin.

---

## 8. Scaling Strategy

- **Horizontal scaling:** Stateless Fastify instances behind load balancer; Redis and Kafka shared.
- **Idempotency:** Moderation decision endpoints accept optional idempotency key (e.g. `Idempotency-Key: uuid`); store in Redis with TTL and return cached response on replay.
- **Distributed locking:** Redis `SET NX EX` for per-post lock; single moderator per post at a time.
- **Background jobs:** Kafka consumers for post publish, notifications, analytics; optional BullMQ for deferred tasks (e.g. archive retention sweep).
- **Read replicas:** Use replica for analytics and audit log reads where acceptable latency is higher.
- **Multi-region:** Prefer single primary write region; queue and lock in same region as DB to avoid cross-region latency.

---

## 9. Observability

- **Logging:** Pino structured logs; include requestId, userId, action, resourceId in moderation paths.
- **Metrics (Prometheus):** e.g. `moderation_actions_total{action, role}`, `moderation_queue_depth`, `moderation_sla_breaches_total`, `moderation_review_duration_seconds`.
- **Alerts:** Queue depth above threshold; SLA breach rate; high reversal rate per moderator.
- **Health:** `/health` checks DB, Redis, (optional) Kafka.

---

## 10. DevOps

- **Docker:** Multi-stage build; node image; run `node dist/server.js`.
- **Migrations:** Drizzle Kit push or migrate; run before app start in CI/CD.
- **Blue-green:** Deploy new version; switch traffic; keep previous for rollback.
- **Backups:** Automated DB backups; point-in-time recovery; audit log retention per policy.

This design aligns with the existing codebase (Drizzle, Fastify, tRPC, Redis queue/lock, Kafka, RBAC) and adds appeals, archive/legal hold, SLA, rate limiting, and full audit traceability.
