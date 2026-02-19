# FAANG-Level User Service Design - Principal Review

## 1. High-Level Architecture Diagram
```mermaid
graph TD
    User((User)) -->|HTTPS/TLS 1.3| R53[Route53 Latency Routing]
    R53 -->|Regional| ALB[AWS Application Load Balancer]
    ALB -->|mTLS| K8S[EKS Cluster - User Service]
    
    subgraph User_Service_Nodes
        FS[Fastify TS App]
        LC[Local LRU Cache]
    end
    
    FS -->|O(1) Check| RC[Redis Cluster - Privacy/Blocks/Limiters]
    FS -->|Write-Ahead| DB[(PostgreSQL Citus Sharded)]
    FS -->|Events| KFK[Kafka Multi-Region Cluster]
    
    KFK -->|Async| SN[Search Service]
    KFK -->|Async| FD[Feed Service]
    KFK -->|Async| CT[Counter Aggregator]
    
    CT -->|Batch Update| DB
    RC <-->|MirrorMaker| RC_Global[Global Redis Sync]
```

---

## 2. Tradeoff Justifications

### Monolith vs. Dedicated Social-Graph Service
- **Decision**: Dedicated *Module* within User Service initially, migrating to a **dedicated Microservice** (using a Graph DB like Neo4j or AWS Neptune) once edges exceed 10B.
- **Reasoning**: At 100M users, PostgreSQL can handle the metadata, but the *relationship depth* (mutuals of mutuals) becomes an O(N^x) problem. By separating it, we can scale the Social Graph independently from Profile management.

### Strong vs. Eventual Consistency
- **Decision**: **Strong consistency** for edges (Follow/Unfollow) to prevent "UI Flickering" where a user follows and then sees "Follow" button again on refresh.
- **Decision**: **Eventual consistency** for counters.
- **Reasoning**: Updating a `followersCount` for a celebrity with 50M followers causes a lock on a single row that handles 10K+ updates/sec. This is a classic "hot partition" problem. We decouple the count to a sharded counter system.

---

## 3. Scaling Roadmap (1M -> 100M)

| Stage | Milestone | Primary Strategy |
| :--- | :--- | :--- |
| **Startup** | 1M Users | Single RDS, Redis cache-aside, monolith codebase. |
| **Growth** | 10M Users | Read replicas, horizontal pod autoscaling (HPA), Kafka integration. |
| **Scale** | 50M Users | Database sharding (Citus/Vitess), Cell-based architecture. |
| **FAANG** | 100M+ Users | Multi-region active-active, Custom Graph Engine, Edge computing for Privacy. |

---

## 4. Resilience & Failure Strategy

- **Redis Outage**: The system falls back to "DB-Only Mode" with aggressive **Request Shedding**. We prioritize `Profile View` over `Follow Operations`.
- **Database Failover**: Aurora Global Database provides <1 minute RTO. During failover, the service enters "Read-Only Mode" allowing users to browse profiles while disabling updates.
- **Viral Spike**: Circuit breakers (e.g., `opossum`) trigger to stop cascading failures if the Feed service or Counter service lags.

---

## 5. Security & Compliance Checklist

- [x] **Zero-Trust**: Every internal RPC call requires a service-to-service JWT/mTLS.
- [x] **GDPR**: Implementation of `Hard Delete` worker that purges S3 avatars and PII from logs.
- [x] **PII Masking**: Logs pass through a filter that masks `email` and `phone` before hitting ELK/Datadog.
- [x] **Rate Limiting**: Sliding-window rate limiting per IP and per UserID for social actions.

---

## 6. Principal Risk Analysis

1. **Celebrity Hot Partitions**: When a celebrity tweets, millions of people view their profile simultaneously. 
   - **Mitigation**: **Multi-layered Caching**. (CDN -> L2 Redis -> L1 Local Mem).
2. **Data Residency**: German users' data staying in `eu-central-1`.
   - **Mitigation**: Sharding key includes `region_id` to ensure data affinity.
3. **Username Squatting**:
   - **Mitigation**: Reservation system for verified brands + Rate-limited username changes (1 per 30 days).

---

## 7. Migration Strategy (Production Realism)

1. **Shadow Writes**: Start writing to the new Sharded DB while reading from the Old DB.
2. **Replication**: Use AWS DMS to keep them in sync.
3. **Canary Deployment**: Move 1% of traffic (internal employees) to the new User Service.
4. **Kill Switch**: Quick rollback via Feature Toggles (LaunchDarkly).
