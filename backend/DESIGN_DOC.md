# Enterprise User Service Platform - Principal Design Document

## 1. Executive Summary
This document outlines the architecture for a globally distributed, FAANG-level User Service Platform. The system is designed to handle 100M+ users with extreme availability (99.99%), low latency (<100ms P99), and strict privacy compliance (GDPR/CCPA).

---

## 2. Architecture Overview

### Global Multi-Region Strategy
- **Deployment**: Active-Active multi-region (e.g., us-east-1, eu-central-1, ap-southeast-1).
- **Routing**: Latency-based routing via Amazon Route53.
- **Data Locality**: Users are pinned to a "Home Region" based on signup location to minimize cross-region writes.
- **Cross-Region Replication (CRR)**: 
    - PostgreSQL uses Aurora Global Database for 1-second replication.
    - Kafka uses MirrorMaker 2.0 for event distribution.
    - Redis uses Global Datastore.

### Scalability & Data Partitioning
- **Sharding Strategy**: Sharded by `userId` (Hash-based). 
- **DB Layer**: PostgreSQL with Citus extension or Vitess for horizontal scaling.
- **Caching**: 
    - **L1**: Local In-memory (limited).
    - **L2**: Distributed Redis (Cluster mode).
    - **Policy**: Cache-aside with TTL.

---

## 3. Domain Models & Service Boundaries

### Core Models
1. **User**: Core identity and profile.
2. **Social Graph (Follows)**: Edge list representing relationships.
3. **Blocks**: Binary state of exclusion.
4. **Privacy Settings**: Policy-based access control.

### Service Boundaries
- **Auth Service (Owner of Identity)**: Credentials, JWT issuance, MFA.
- **User Service (Owner of State)**: Profiles, Relationships, Settings.
- **Interaction**: User Service validates JWTs issued by Auth Service but manages its own domain data.

---

## 4. System Components Deep Dive

### 4.1 Follow System (Social Graph)
**Tradeoff: Strong vs. Eventual Consistency**
We use **Strong Consistency** for the edge creation (the `follows` table) but **Eventual Consistency** for the counter updates (`followersCount`).

**Counter Aggregation Strategy**:
- Real-time updates for most users.
- **Celebrity Handling**: For users with >100K followers, we use "Counter Sharding" or write-heavy buffering in Redis. Instead of updating the `users` table row, we write to a distributed counter and aggregate via a background job every N seconds.

### 4.2 Block System
- **O(1) Lookup**: Block status is cached in Redis Sets: `block:<userId> -> {blockedIds}`.
- **Enforcement**: Middleware checks block status before returning profile data.
- **Cross-Service**: `user.blocked` event emitted via Kafka. Feed/Search services listen and filter results.

### 4.3 Privacy Evaluation Engine
- **Granular Policies**: JSON-based configuration.
- **Middlewares**: Unified `PrivacyMiddleware` evaluates if `Requestor` can see `Target` profile based on:
    - Relationship (Friend/Follower)
    - Block status
    - Explicit setting (Public/Private)

---

## 5. Caching Strategy & Resilience

### Cache Invalidation
- **Versioned Profiles**: Profiles are immutable with versions. Invalidation via Kafka broadcast.
- **Cache-Aside**: Service reads from Redis; on miss, reads from DB and populates Redis.

### Resilience (Circuit Breakers)
- **Redis Outage**: If Redis is down, service fails-over to DB with request shedding (to protect the DB from a "thundering herd").
- **Kafka Outage**: Outbox pattern used in DB. Events are retryable.

---

## 6. Compliance & Security (Zero-Trust)
- **GDPR**: `Soft Delete` followed by a 30-day "Right to Forget" background worker that purges PII.
- **Encryption**: AES-256 at rest, TLS 1.3 in transit.
- **Audit Logging**: Every profile/privacy change is logged to an immutable `audit_logs` table.

---

## 7. API Design (Gist)
- `GET /v1/users/:username`: Public profile.
- `GET /v1/users/me`: Authenticated private view.
- `POST /v1/social/follow/:id`: Follow (Idempotent).
- `DELETE /v1/social/follow/:id`: Unfollow.
- `POST /v1/social/block/:id`: Block.

---

## 8. Scaling Roadmap
- **1M Users**: Single RDS instance, simple Redis.
- **10M Users**: Read replicas, Redis Cluster, Kafka for async side-effects.
- **100M+ Users**: Sharded DB (Citus), Multi-region Active-Active, Cell-based architecture.

---

## 9. Principal Risk Analysis
- **Hot Partitions**: Celebrities like @elonmusk can break the counter system. Mitigation: Sharded counter increments.
- **Network Partition**: Brain split in multi-region. Mitigation: Quorum-based consistency or LWW (Last Write Wins).
- **Username Squatting**: Rate limiting and minimum account requirements.
