# 🔔 Real-Time Notification System Architecture

## Principal Engineer Design — FAANG-grade Production System

---

## 1. System Architecture Overview

```
┌──────────────┐     ┌───────────────┐     ┌─────────────────────┐
│  User Action  │ ──→ │ Service Layer │ ──→ │ NotificationService │
│  (Like/Follow │     │ (fire & forget│     │ (dedupe, create,    │
│   /Comment)   │     │  triggers)    │     │  emit, enqueue)     │
└──────────────┘     └───────────────┘     └─────────┬───────────┘
                                                      │
                                          ┌───────────┴───────────┐
                                          ▼                       ▼
                                 ┌────────────────┐     ┌──────────────────┐
                                 │  Redis Pub/Sub  │     │  RabbitMQ Queue   │
                                 │  (real-time)    │     │  (push delivery)  │
                                 └────────┬───────┘     └────────┬─────────┘
                                          │                       │
                                          ▼                       ▼
                                 ┌────────────────┐     ┌──────────────────┐
                                 │  WS Gateway     │     │  FCM Worker       │
                                 │  (per server    │     │  (multi-device    │
                                 │   node)         │     │   delivery)       │
                                 └────────┬───────┘     └──────────────────┘
                                          │
                                          ▼
                                 ┌────────────────┐
                                 │  Client WS      │
                                 │  (browser/app)  │
                                 └────────────────┘
```

---

## 2. Notification Types & Triggers

| Type    | Trigger                  | Receiver            | EntityType | EntityId     |
|---------|--------------------------|---------------------|------------|--------------|
| LIKE    | User likes a post        | Post owner          | POST       | postId       |
| COMMENT | User comments on a post  | Post owner          | COMMENT    | commentId    |
| REPLY   | User replies to comment  | Parent comment owner| COMMENT    | replyId      |
| MENTION | @username in text        | Mentioned user      | COMMENT    | commentId    |
| FOLLOW  | User follows another     | Followed user       | FOLLOW     | followerId   |

### Self-Notification Prevention
All triggers check `senderId !== receiverId` before creating a notification.

### Deduplication Strategy
- **LIKE**: 5-minute window (prevent rapid like/unlike spam)
- **FOLLOW**: 60-minute window (prevent follow/unfollow spam)
- **MENTION**: Per entity deduplication within 5 minutes
- Redis-based deduplication key: `notif:dedupe:{recipientId}:{templateId}:{entityId}`

---

## 3. Database Schema

### `notifications` table
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id      UUID REFERENCES users(id),
  template_id   UUID REFERENCES notification_templates(id),
  type          TEXT, -- 'LIKE' | 'COMMENT' | 'REPLY' | 'MENTION' | 'FOLLOW'
  entity_type   TEXT NOT NULL, -- 'POST' | 'COMMENT' | 'FOLLOW' | 'CHAT' | 'SYSTEM'
  entity_id     UUID NOT NULL,
  post_id       UUID REFERENCES posts(id) ON DELETE SET NULL,
  comment_id    UUID REFERENCES comments(id) ON DELETE SET NULL,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  meta_data     JSONB DEFAULT '{}',
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX recipient_idx ON notifications(recipient_id);
CREATE INDEX unread_idx ON notifications(recipient_id, is_read);
CREATE INDEX aggregation_idx ON notifications(recipient_id, entity_id, entity_type);
CREATE INDEX notification_created_idx ON notifications(recipient_id, created_at DESC);
CREATE INDEX notification_type_idx ON notifications(recipient_id, type);
```

### `device_tokens` table (FCM)
```sql
CREATE TABLE device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL, -- 'IOS' | 'ANDROID' | 'WEB'
  device_id   TEXT,
  is_active   BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP DEFAULT now(),
  created_at  TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, token)
);
```

---

## 4. Backend Service Structure

```
backend/src/modules/notification/
├── notification.dto.ts          # Zod schemas & TypeScript types
├── notification.repository.ts   # Database queries (Drizzle ORM)
├── notification.service.ts      # Business logic + trigger methods
├── notification.controller.ts   # HTTP handlers
├── notification.routes.ts       # Fastify route definitions + WS
├── notification.gateway.ts      # WebSocket connection manager
├── notification.triggers.ts     # Fire-and-forget trigger helpers
├── notification.worker.ts       # Background delivery workers
├── notification.kafka.ts        # Kafka consumer (if enabled)
├── notification.producer.ts     # Event producer
├── fcm.service.ts              # Firebase Cloud Messaging
├── mention.service.ts          # @username parsing & validation
├── notification.schema.ts      # Fastify route schemas
└── NotificationDesign.md       # This document
```

---

## 5. WebSocket Architecture

### Authentication
1. **Primary**: JWT verified in Fastify `preHandler` (via HttpOnly cookie)
2. **Fallback**: `?token=<JWT>` query parameter (for WebSocket-only clients)

### Connection Lifecycle
```
Client → WSS://api/notifications/ws?token=<JWT>
  → Server verifies JWT
  → Registers connection: Map<userId, Set<WebSocket>>
  → Sends { type: "connection:established" }
  → Starts heartbeat every 30s
  → Listens to Redis Pub/Sub channel "events:notifications"
  → Forwards matching events as { type: "notification:new", payload: {...} }
```

### Horizontal Scaling
```
        ┌─── Server Node A ──→ Redis Pub/Sub ←── Server Node B ───┐
        │    (100 users)                         (100 users)       │
        │                                                          │
        │    Notification published for userX                      │
        │    → ALL nodes receive the message                       │
        │    → Only the node with userX's active WS sends it       │
        └──────────────────────────────────────────────────────────┘
```

### Events
| Direction | Event                  | Payload                                    |
|-----------|------------------------|--------------------------------------------|
| Server→   | `connection:established`| `{ userId, connectedAt }`                 |
| Server→   | `notification:new`     | `{ id, type, sender, message, createdAt }` |
| Server→   | `heartbeat`            | `{}`                                       |
| Server→   | `pong`                 | `{}`                                       |
| →Client   | `ping`                 | `{}`                                       |
| →Client   | `notification:ack`     | `{ id }`                                   |

---

## 6. Firebase Push Notification Architecture

### Token Registration Flow
```
Client → Notification.requestPermission()
  → getFcmToken() via Firebase SDK
  → POST /notifications/register-device { token, platform: "WEB" }
  → Server stores in device_tokens table (upsert on conflict)
```

### Push Delivery Flow
```
NotificationService.enqueuePushNotification()
  → RabbitMQ: "notification_delivery_push" queue
  → Worker picks up job
  → FcmService.sendToAllDevices(userId, title, body, data)
  → For each active device token:
    → firebase-admin.messaging().send(message)
    → On "registration-token-not-registered" → deactivate token
```

### Platform-Specific Config
- **Android**: High priority, default sound, click action
- **iOS (APNs)**: Sound, badge count
- **Web**: Custom icon, badge, deep link via `fcmOptions.link`

---

## 7. Frontend Architecture

### Hook Hierarchy
```
┌─ useNotificationSocket() ──────────────────────────────────────┐
│  Manages: WebSocket connection, auto-reconnect, push permission │
│  Updates: React Query cache on WS events                        │
└─────────────────────────────────────────────────────────────────┘

┌─ useNotifications(type?) ──────────────────────────────────────┐
│  Infinite query with cursor-based pagination                    │
│  Supports type filtering (LIKE, COMMENT, REPLY, MENTION, FOLLOW)│
└─────────────────────────────────────────────────────────────────┘

┌─ useUnreadCount() ─────────────────────────────────────────────┐
│  Polling every 60s as fallback (WebSocket updates in real-time) │
│  Used by sidebar badge + notification page header               │
└─────────────────────────────────────────────────────────────────┘

┌─ useMarkRead() / useMarkAllRead() ─────────────────────────────┐
│  Optimistic updates with rollback on failure                    │
│  Updates both notification list AND unread count cache           │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side Deduplication
- `seenIds` Set<string> keeps track of recently seen notification IDs
- Prevents duplicate display when both WebSocket and API return the same notification
- Set is capped at 200 entries (pruned to last 100 when full)

### Auto-Reconnect
- Exponential backoff: 1s → 2s → 4s → 8s → ... → max 30s
- No reconnect on code 1000 (normal close) or 1008 (unauthorized)

---

## 8. Security Measures

| Layer      | Measure                                          |
|------------|--------------------------------------------------|
| WS Auth    | JWT verified on handshake (preHandler + query param) |
| Self-notif | `senderId !== receiverId` check in ALL triggers  |
| Rate limit | Fastify rate limiting on notification creation   |
| Mention    | Max 10 mentions per message                      |
| XSS        | HTML entity sanitization in mention.service.ts   |
| Input      | Zod validation on ALL request bodies             |
| FCM Token  | Automatic deactivation of invalid tokens         |
| DB Access  | All queries scoped to `recipientId = currentUser`|

---

## 9. Scaling Strategy

### Tier 1: Single Server (0-10K users)
- In-process WebSocket + Redis Pub/Sub
- RabbitMQ for push delivery
- Single PostgreSQL with proper indexes

### Tier 2: Multi-Server (10K-1M users)
- Redis Pub/Sub for cross-node WS fanout
- Connection-aware load balancing (sticky sessions)
- Read replicas for notification queries
- Background workers on separate nodes

### Tier 3: Global Scale (1M+ users)
- Kafka for event ingestion (replace direct service calls)
- Redis Cluster for Pub/Sub + caching
- Partitioned notification tables (by recipient_id hash)
- CDN-cached notification templates
- Regional WebSocket edge nodes

---

## 10. API Endpoints

| Method | Path                          | Auth | Description                  |
|--------|-------------------------------|------|------------------------------|
| GET    | /notifications                | ✅   | Paginated list (cursor+type) |
| GET    | /notifications/unread-count   | ✅   | Unread count for badge       |
| POST   | /notifications/register-device| ✅   | Register FCM token           |
| PATCH  | /notifications/:id/read       | ✅   | Mark single as read          |
| POST   | /notifications/read-all       | ✅   | Mark all as read             |
| GET    | /notifications/ws             | ✅   | WebSocket connection         |
