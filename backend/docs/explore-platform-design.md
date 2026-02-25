# Explore & Discovery Platform — Principal Engineer System Design

> **Target**: 100M+ users, 10M DAU, <150ms P95, 99.99% availability  
> **Stack**: Node.js/TypeScript, Fastify, PostgreSQL, Redis, Kafka, OpenSearch, K8s, AWS  
> **Author**: Principal Engineer Design Review  
> **Status**: Architecture Blueprint — Ready for Implementation

---

## Table of Contents

1. [Domain Model & Data Flow](#1-domain-model--data-flow)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Candidate Generation Strategy](#3-candidate-generation-strategy)
4. [Ranking Engine Design](#4-ranking-engine-design)
5. [Real-Time Updates (Event-Driven)](#5-real-time-updates-event-driven)
6. [Personalization Engine](#6-personalization-engine)
7. [Scalability Strategy](#7-scalability-strategy)
8. [Multi-Region Architecture](#8-multi-region-architecture)
9. [Content Safety & Moderation](#9-content-safety--moderation)
10. [API Design](#10-api-design)
11. [Caching Strategy](#11-caching-strategy)
12. [Observability & SRE](#12-observability--sre)
13. [Experimentation & A/B Testing](#13-experimentation--ab-testing)
14. [Security & Zero Trust](#14-security--zero-trust)
15. [Failure Modes & Resilience](#15-failure-modes--resilience)

---

## 1. Domain Model & Data Flow

### 1.1 Core Entities

Building on the existing schema (`posts`, `users`, `follows`, `likes`, `hashtags`, `rankingFeatures`, etc.), the Explore domain adds:

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXPLORE DOMAIN MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐     │
│  │  Post     │───▶│ Engagement   │    │ ExploreCandidate  │     │
│  │ (existing)│    │  Counters    │    │  postId           │     │
│  └──────────┘    │  (existing)  │    │  trendingScore    │     │
│       │          └──────────────┘    │  categoryId       │     │
│       │                              │  qualityScore     │     │
│       ▼                              │  moderationFlags  │     │
│  ┌──────────┐    ┌──────────────┐    │  region           │     │
│  │ Hashtag  │───▶│ TrendingScore│    │  computedAt       │     │
│  │(existing)│    │  hashtagId   │    └───────────────────┘     │
│  └──────────┘    │  score       │                               │
│                  │  windowStart │    ┌───────────────────┐     │
│  ┌──────────┐    │  region      │    │ UserInterestGraph │     │
│  │  User    │    └──────────────┘    │  userId           │     │
│  │(existing)│                        │  topicWeights{}   │     │
│  └──────────┘    ┌──────────────┐    │  authorAffinities │     │
│       │          │ContentFlags  │    │  behaviorSignals  │     │
│       ▼          │  postId      │    │  updatedAt        │     │
│  ┌──────────┐    │  spamScore   │    └───────────────────┘     │
│  │  Follow  │    │  nsfwScore   │                               │
│  │  Graph   │    │  toxicScore  │    ┌───────────────────┐     │
│  │(existing)│    │  botScore    │    │ ExploreCategory   │     │
│  └──────────┘    │  reviewStatus│    │  id, name, slug   │     │
│                  └──────────────┘    │  displayOrder     │     │
│                                      │  isActive         │     │
│                                      └───────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 New Schema Additions

```sql
-- Explore categories for category-based discovery
explore_categories (
  id UUID PK,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Post-to-category mapping (auto-classified)
post_categories (
  post_id UUID FK -> posts.id,
  category_id UUID FK -> explore_categories.id,
  confidence FLOAT NOT NULL, -- ML classification confidence
  PRIMARY KEY (post_id, category_id)
);

-- Content moderation flags
content_flags (
  post_id UUID PK FK -> posts.id,
  spam_score FLOAT DEFAULT 0,
  nsfw_score FLOAT DEFAULT 0,
  toxicity_score FLOAT DEFAULT 0,
  bot_score FLOAT DEFAULT 0,
  quality_score FLOAT DEFAULT 0.5, -- 0=low, 1=high
  review_status TEXT DEFAULT 'AUTO_APPROVED', -- PENDING_REVIEW | APPROVED | REJECTED | SHADOW_BANNED
  reviewer_id UUID FK -> users.id,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User interest graph (persist from Redis periodically)
user_interest_profiles (
  user_id UUID PK FK -> users.id,
  topic_weights JSONB DEFAULT '{}',       -- {topic: weight}
  author_affinities JSONB DEFAULT '{}',   -- {authorId: score}
  hashtag_affinities JSONB DEFAULT '{}',  -- {hashtag: score}
  embedding VECTOR(128),                  -- For ANN similarity (pgvector)
  last_active_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trending snapshots (materialized every N minutes)
trending_snapshots (
  id UUID PK,
  scope TEXT NOT NULL,         -- 'GLOBAL' | 'REGIONAL' | 'CATEGORY'
  scope_key VARCHAR(100),      -- region code or category slug
  post_ids JSONB NOT NULL,     -- ordered list of post IDs
  computed_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```

### 1.3 Data Ownership Boundaries

| Domain Service | Owns (Write) | Reads From |
|---|---|---|
| **Post Service** | `posts`, `postVersions`, `media` | — |
| **Engagement Service** | `likes`, `comments`, `reposts`, `engagementCounters` | `posts` |
| **User Service** | `users`, `follows`, `userCounters` | — |
| **Explore Service** | `explore_categories`, `post_categories`, `trending_snapshots`, `content_flags`, `user_interest_profiles` | All above (read replicas) |
| **Feed Service** (existing) | `userFeedMetadata`, `rankingFeatures`, `feedRebalanceJobs` | `posts`, `follows` |

**Key principle**: Explore Service **never writes** to `posts`/`likes`/`follows`. It consumes events from upstream services and maintains its own read-optimized projections.

### 1.4 Read vs Write Optimization

```
WRITE PATH (Event-Driven):
  Post Service ──[Kafka: post.created]──▶ Explore Consumer
  Engagement   ──[Kafka: engagement.*]──▶ Score Updater
  User Service ──[Kafka: user.followed]──▶ Interest Updater

READ PATH (Optimized):
  Client ──▶ API Gateway ──▶ Explore Service
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              Redis Cache    PG Read Replica   OpenSearch
              (trending,     (fallback,        (full-text
               scores)       cold start)        search)
```

### 1.5 Event-Driven Consistency Model

- **Eventual consistency** (50-500ms lag acceptable for explore)
- Kafka consumers update Redis sorted sets in near-real-time
- PostgreSQL read replicas for fallback queries (replication lag < 100ms)
- Trending snapshots materialized every 5 minutes as safety net
- No strong consistency required — explore is inherently approximate

### 1.6 Multi-Region Data Replication

- PostgreSQL: Aurora Global Database (primary in us-east-1, read replicas in eu-west-1, ap-southeast-1)
- Redis: ElastiCache Global Datastore with regional clusters
- Kafka: MirrorMaker 2 for cross-region topic replication
- OpenSearch: Cross-cluster replication for search indices

---

## 2. High-Level Architecture

### 2.1 Service Topology

```
                    ┌─────────────────────────────────┐
                    │          CLIENT (Web/Mobile)     │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │     API Gateway (Route53 +      │
                    │     ALB + WAF + Shield)          │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │       EXPLORE SERVICE           │
                    │   (Fastify + TypeScript)         │
                    │                                  │
                    │  ┌───────────────────────────┐  │
                    │  │ Request Orchestrator       │  │
                    │  │ - Auth + Rate Limit        │  │
                    │  │ - A/B Test Assignment      │  │
                    │  │ - Feature Flags            │  │
                    │  └─────────┬─────────────────┘  │
                    │            │                      │
                    │  ┌─────────▼─────────────────┐  │
                    │  │ Candidate Generator        │  │
                    │  │ - Trending Pool            │  │
                    │  │ - Personalized Pool        │  │
                    │  │ - Category Pool            │  │
                    │  │ - Search Pool              │  │
                    │  └─────────┬─────────────────┘  │
                    │            │                      │
                    │  ┌─────────▼─────────────────┐  │
                    │  │ Ranking Engine             │  │
                    │  │ - Score Computation        │  │
                    │  │ - Diversity Control        │  │
                    │  │ - Safety Filtering         │  │
                    │  └─────────┬─────────────────┘  │
                    │            │                      │
                    │  ┌─────────▼─────────────────┐  │
                    │  │ Response Builder           │  │
                    │  │ - Hydration                │  │
                    │  │ - Cursor Encoding          │  │
                    │  │ - Dedup Tracking           │  │
                    │  └───────────────────────────┘  │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌────────────┐      ┌────────────┐      ┌──────────────┐
     │ Redis      │      │ PostgreSQL │      │  OpenSearch   │
     │ Cluster    │      │ Read       │      │  Cluster      │
     │            │      │ Replicas   │      │               │
     │ - Trending │      │ - Fallback │      │ - Full-text   │
     │ - Scores   │      │ - Cold     │      │ - Semantic    │
     │ - Seen     │      │   start    │      │ - Hashtag     │
     │ - Dedup    │      │ - Interest │      │   discovery   │
     └────────────┘      │   profiles │      └──────────────┘
                         └────────────┘
```

### 2.2 Background Workers (Kafka Consumers)

```
     ┌──────────────────────────────────────────────┐
     │              KAFKA CLUSTER                    │
     │                                               │
     │  Topics:                                      │
     │  - explore.post.created                       │
     │  - explore.engagement.updated                 │
     │  - explore.user.interaction                   │
     │  - explore.moderation.result                  │
     └─────────────┬───────────────────┬────────────┘
                   │                   │
        ┌──────────▼────────┐ ┌───────▼──────────┐
        │ Score Worker       │ │ Interest Worker   │
        │ - Engagement score │ │ - User embedding  │
        │ - Trending calc    │ │ - Topic weights   │
        │ - Redis ZADD       │ │ - Affinity update │
        └───────────────────┘ └──────────────────┘
                   │
        ┌──────────▼────────┐
        │ Index Worker       │
        │ - OpenSearch sync  │
        │ - Category classify│
        │ - Content flagging │
        └───────────────────┘
```

### 2.3 Why Explore Must Be Read-Optimized

1. **Read:Write ratio is ~1000:1** — millions read explore per minute, few thousand posts created
2. **Latency budget is tight** (<150ms P95) — no room for write-path queries
3. **Ranking is CPU-intensive** — precomputed scores in Redis avoid runtime computation
4. Decoupled from Post Service write path → post creation latency unaffected

### 2.4 Decoupling Strategy

- Post Service emits `post.created` to Kafka → Explore consumes asynchronously
- Engagement Service emits `engagement.*` → Score Worker updates Redis sorted sets
- Explore Service **never calls** Post/Engagement APIs synchronously on the read path
- All data is pre-materialized into Redis sorted sets and OpenSearch indices

---

## 3. Candidate Generation Strategy

### 3.1 Multi-Pool Architecture

```typescript
// explore.candidate-generator.ts
interface CandidatePool {
  source: 'TRENDING' | 'PERSONALIZED' | 'CATEGORY' | 'SEARCH' | 'SERENDIPITY';
  postIds: string[];
  scores: Map<string, number>;
}

class CandidateGenerator {
  async generate(userId: string, request: ExploreRequest): Promise<CandidatePool[]> {
    // Fan-in: Parallel fetch from all pools
    const [trending, personalized, category, serendipity] = await Promise.all([
      this.getTrendingCandidates(request.limit * 3, request.region),
      this.getPersonalizedCandidates(userId, request.limit * 3),
      this.getCategoryCandidates(request.category, request.limit * 2),
      this.getSerendipityCandidates(userId, request.limit), // diversity injection
    ]);

    return [trending, personalized, category, serendipity];
  }
}
```

### 3.2 Trending Candidates (Redis Sorted Sets)

```
Redis Key Structure:
  explore:trending:global         → ZSET {postId: trendingScore}
  explore:trending:region:{code}  → ZSET {postId: trendingScore}
  explore:trending:cat:{slug}     → ZSET {postId: trendingScore}
  explore:trending:tag:{name}     → ZSET {postId: trendingScore}

Retrieval: ZREVRANGE explore:trending:global 0 59  → Top 60 post IDs
```

### 3.3 Personalized Candidates

```
1. Fetch user's top 10 interest topics from Redis:
   ZREVRANGE user:affinity:{userId} 0 9

2. For each topic, fetch top posts:
   ZREVRANGE explore:trending:cat:{topic} 0 19

3. Fetch posts from high-affinity authors:
   ZREVRANGE user:author_affinity:{userId} 0 4
   → For each author: ZREVRANGE explore:author:{authorId} 0 9

4. Merge all candidates into a single pool
```

### 3.4 Deduplication & Diversity

```typescript
class DiversityEnforcer {
  enforce(candidates: ScoredPost[], constraints: DiversityConfig): ScoredPost[] {
    const result: ScoredPost[] = [];
    const authorCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const seenIds = new Set<string>(); // pulled from Redis user:seen:{userId}

    for (const post of candidates) {
      // Skip already-seen posts
      if (seenIds.has(post.id)) continue;

      // Author diversity: max 2 posts per author in a page
      const authorCount = authorCounts.get(post.authorId) || 0;
      if (authorCount >= constraints.maxPerAuthor) continue;

      // Category diversity: max 40% from any single category
      const catCount = categoryCounts.get(post.category) || 0;
      const catRatio = catCount / (result.length + 1);
      if (catRatio > constraints.maxCategoryRatio) continue;

      result.push(post);
      authorCounts.set(post.authorId, authorCount + 1);
      categoryCounts.set(post.category, catCount + 1);

      if (result.length >= constraints.pageSize) break;
    }
    return result;
  }
}
```

### 3.5 Fan-Out vs Fan-In Tradeoffs

| Strategy | When to Use | Current Approach |
|---|---|---|
| **Fan-out on Write** | Home feed (existing) | Push post IDs to follower ZSETs |
| **Fan-in on Read** | Explore/Trending | Query pre-scored pools at request time |
| **Hybrid** | "For You" | Fan-out for followed, Fan-in for discovery |

**Explore uses Fan-in** because:
- No fixed follower graph to fan-out to
- Content must be ranked per-user at request time
- Candidate pools are shared across users (cacheable)

### 3.6 Cold Start Strategy

```
New User (no interaction history):
  1. Use registration interests (onboarding topics)   → 40% weight
  2. Regional trending content                         → 30% weight
  3. Global viral content (high engagement velocity)   → 20% weight
  4. Random serendipity (explore diversity)             → 10% weight

After 5+ interactions:
  → Begin blending personalized candidates
  
After 50+ interactions:
  → Full personalization model active
```

---

## 4. Ranking Engine Design

### 4.1 Scoring Formula

```typescript
interface RankingWeights {
  engagement: number;    // default 0.30
  freshness: number;     // default 0.25
  personalization: number; // default 0.25
  quality: number;       // default 0.10
  diversity: number;     // default 0.10 (penalty factor)
}

class RankingEngine {
  computeScore(post: ExploreCandidate, user: UserProfile, weights: RankingWeights): number {
    const engagement = this.engagementScore(post);
    const freshness = this.freshnessScore(post);
    const personalization = this.personalizationScore(post, user);
    const quality = post.qualityScore;  // from content_flags table
    const diversityPenalty = this.diversityPenalty(post, user.recentlySeen);

    const finalScore =
      (weights.engagement * engagement) +
      (weights.freshness * freshness) +
      (weights.personalization * personalization) +
      (weights.quality * quality) -
      (weights.diversity * diversityPenalty);

    return Math.max(0, finalScore);
  }

  private engagementScore(post: ExploreCandidate): number {
    const ageHours = (Date.now() - post.createdAt.getTime()) / 3_600_000;
    // Engagement velocity: interactions per hour, normalized
    const velocity = (post.likesCount + post.commentsCount * 2 + post.repostsCount * 3)
                     / (ageHours + 2); // +2 prevents division-by-zero spike
    return Math.min(velocity / 100, 1.0); // Normalize to [0, 1]
  }

  private freshnessScore(post: ExploreCandidate): number {
    const ageHours = (Date.now() - post.createdAt.getTime()) / 3_600_000;
    return Math.exp(-ageHours / 48); // 48-hour half-life for explore (longer than home feed)
  }

  private personalizationScore(post: ExploreCandidate, user: UserProfile): number {
    let score = 0;
    // Topic overlap
    for (const tag of post.tags) {
      score += (user.topicWeights[tag] || 0) * 0.6;
    }
    // Author affinity
    score += (user.authorAffinities[post.authorId] || 0) * 0.4;
    return Math.min(score, 1.0);
  }

  private diversityPenalty(post: ExploreCandidate, recentlySeen: string[]): number {
    // Penalize if user saw similar content recently
    // Implemented via category/author repetition checks
    return 0; // Computed in DiversityEnforcer post-ranking
  }
}
```

### 4.2 ML Integration Strategy

```
Phase 1 (Current): Rule-based scoring (formula above)
Phase 2: Gradient-boosted trees (XGBoost) for engagement prediction
Phase 3: Deep learning model (two-tower) for user-post relevance

Feature Store (Redis):
  feature:post:{id}   → {engagementVelocity, ageHours, authorFollowers, mediaType, ...}
  feature:user:{id}   → {topInterests[], avgDwellTime, clickRate, ...}

Online Inference:
  Client → Explore Service → Feature Fetch (Redis <5ms) → Model Server (gRPC <20ms) → Re-rank

Offline Pipeline:
  Kafka → Spark Streaming → Feature Computation → Redis Feature Store
  Training Data → SageMaker → Model Registry → Canary → Production
```

---

## 5. Real-Time Updates (Event-Driven)

### 5.1 Kafka Topic Design

```
Topics (partitioned by relevant entity ID):

explore.post.ingested        — Partition by postId (32 partitions)
  Key: postId
  Value: {postId, authorId, content, tags[], mediaUrls[], createdAt}

explore.engagement.updated   — Partition by postId (64 partitions)
  Key: postId
  Value: {postId, type: LIKE|COMMENT|REPOST|VIEW, delta: +1|-1, userId, timestamp}

explore.user.interaction     — Partition by userId (32 partitions)
  Key: userId
  Value: {userId, postId, action: VIEW|LIKE|SHARE|SAVE|NOT_INTERESTED, duration?, timestamp}

explore.moderation.result    — Partition by postId (16 partitions)
  Key: postId
  Value: {postId, spamScore, nsfwScore, toxicityScore, decision: APPROVE|REJECT|SHADOW_BAN}

explore.hashtag.trending     — Partition by hashtagId (16 partitions)
  Key: hashtagName
  Value: {hashtag, postCount, velocity, windowStart, windowEnd}
```

### 5.2 Stream Processing Flow

```
explore.engagement.updated consumer:

  1. Read message: {postId, type: LIKE, delta: +1}
  2. Increment Redis counter: HINCRBY explore:counters:{postId} likes 1
  3. Recompute trending score:
     score = (likes + comments*2 + reposts*3) / (ageHours + 2)^0.8
  4. Update Redis sorted sets:
     ZADD explore:trending:global score postId
     ZADD explore:trending:region:{region} score postId
     ZADD explore:trending:cat:{category} score postId
  5. If score crosses viral threshold → emit to explore.post.viral topic
```

### 5.3 Backpressure & Delivery Guarantees

- **At-least-once delivery** (acceptable for score updates — idempotent operations)
- Consumer group: `explore-score-workers` with auto-commit disabled
- Manual offset commit after Redis ZADD succeeds
- Backpressure: If Redis latency > 50ms, pause consumer, apply exponential backoff
- Dead-letter topic `explore.dlq` for messages failing 3+ times

---

## 6. Personalization Engine

### 6.1 Interest Graph Construction

```
Signals (weighted):
  ┌─────────────────────┬──────────┬───────────────────────┐
  │ Signal              │ Weight   │ Decay                 │
  ├─────────────────────┼──────────┼───────────────────────┤
  │ Like                │ 5        │ 7-day half-life       │
  │ Comment             │ 8        │ 7-day half-life       │
  │ Share/Repost        │ 10       │ 14-day half-life      │
  │ Bookmark/Save       │ 8        │ 30-day half-life      │
  │ Dwell (>5s)         │ 1        │ 3-day half-life       │
  │ Profile Visit       │ 3        │ 7-day half-life       │
  │ Not Interested      │ -10      │ 30-day half-life      │
  │ Follow Author       │ 15       │ No decay              │
  │ Hashtag Follow      │ 12       │ No decay              │
  └─────────────────────┴──────────┴───────────────────────┘

Storage:
  Redis ZSET: user:affinity:{userId}         → {topic: decayedScore}
  Redis ZSET: user:author_affinity:{userId}  → {authorId: decayedScore}
  Redis HASH: user:behavior:{userId}         → {avgDwell, clickRate, ...}
```

### 6.2 Cold Start Strategies

**New User**: Onboarding topic selection → seed `user:affinity` with selected topics at score 10. Blend with popularity-based candidates.

**New Content**: No engagement data yet → boost score by 1.2x for first 2 hours ("new content boost"). Randomly inject into 5% of explore feeds for exposure sampling.

### 6.3 Privacy-Safe Personalization

- All personalization data stored with userId key (no PII in feature stores)
- Interest profiles deletable via GDPR endpoint (`DELETE /api/users/me/data`)
- No cross-user data leakage — personalization is per-user Redis keys
- Differential privacy noise injection for aggregated trending data

---

## 7. Scalability Strategy

### 7.1 Capacity Planning

```
┌──────────────────────────────────────────────────────┐
│ CAPACITY MODEL                                        │
├──────────────────────────┬───────────────────────────┤
│ Total Users              │ 100M                      │
│ DAU                      │ 10M                       │
│ Explore Views / Day      │ 50M (5 views/active user) │
│ Sustained RPS            │ 5,000                     │
│ Peak RPS (2x burst)      │ 50,000                    │
│ P95 Latency Target       │ < 150ms                   │
│ P99 Latency Target       │ < 300ms                   │
│                          │                           │
│ Redis Memory (trending)  │ ~2 GB (100K scored posts) │
│ Redis Memory (user aff.) │ ~20 GB (10M users × 2KB)  │
│ OpenSearch Index          │ ~50 GB (100M posts)       │
│ PG Read Replica Load     │ < 5K QPS (fallback only)  │
└──────────────────────────┴───────────────────────────┘
```

### 7.2 Horizontal Scaling

```
Explore Service (Stateless):
  - Kubernetes HPA: min 10, max 200 pods
  - Scale trigger: CPU > 60% OR P95 > 100ms
  - Pod spec: 2 vCPU, 4 GB RAM
  - Graceful shutdown: drain in-flight requests (30s)

Redis Cluster:
  - 6-node cluster (3 primary + 3 replica)
  - Hash-slot sharding across primaries
  - Hot key mitigation: local in-process LRU cache (TTL 5s)

PostgreSQL:
  - Aurora Global: 1 writer + 3 read replicas per region
  - Connection pooling: PgBouncer (max 500 connections per replica)

OpenSearch:
  - 3 data nodes, 2 replicas per shard
  - Shard strategy: 1 shard per 25GB → 2 shards for posts index
```

---

## 8. Multi-Region Architecture

### 8.1 Deployment Topology

```
                    Route53 (Latency-Based Routing)
                    ┌─────────┬──────────┬──────────┐
                    ▼         ▼          ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │us-east-1 │ │eu-west-1 │ │ap-south-1│
              │(Primary) │ │(Active)  │ │(Active)  │
              ├──────────┤ ├──────────┤ ├──────────┤
              │Explore   │ │Explore   │ │Explore   │
              │Service   │ │Service   │ │Service   │
              │          │ │          │ │          │
              │Redis     │ │Redis     │ │Redis     │
              │(Primary) │ │(Replica) │ │(Replica) │
              │          │ │          │ │          │
              │Aurora    │ │Aurora    │ │Aurora    │
              │(Writer)  │ │(Reader)  │ │(Reader)  │
              │          │ │          │ │          │
              │OpenSearch│ │OpenSearch│ │OpenSearch│
              │(Primary) │ │(Replica) │ │(Replica) │
              └──────────┘ └──────────┘ └──────────┘

RTO: 30 seconds (Route53 health check + failover)
RPO: < 1 second (Aurora Global w/ < 1s replication lag)
```

### 8.2 Regional vs Global Trending

- **Global trending**: Computed in us-east-1, replicated to all regions via Redis Global Datastore
- **Regional trending**: Computed per-region using region-local engagement data
- API response blends: 60% regional trending + 40% global trending
- Hashtag trending: Region-scoped with global fallback

---

## 9. Content Safety & Moderation

### 9.1 Multi-Stage Pipeline

```
PRE-RANKING FILTER (< 5ms):
  ┌─────────────────────────────────────────┐
  │ 1. Check content_flags.review_status    │
  │    → REJECTED or SHADOW_BANNED? Remove  │
  │ 2. Check spam_score > 0.8? Remove       │
  │ 3. Check nsfw_score > 0.7? Remove       │
  │    (unless user opted in)               │
  │ 4. Check bot_score > 0.9? Remove        │
  │ 5. Check author blocked? Remove         │
  └─────────────────────────────────────────┘

POST-RANKING SAFEGUARD:
  - Review top 20 results for toxicity diversity
  - If >30% flagged content in a page → inject safe content
  - Shadow banned posts: visible only to author

ASYNC PIPELINE (Kafka consumer):
  post.created → ML Classifier → content_flags upsert → OpenSearch update
  Classification models: spam (logistic regression), nsfw (CNN), toxicity (BERT)
  
HUMAN REVIEW:
  Posts with moderation_score ∈ [0.5, 0.8] → queued for human review
  Admin dashboard at /admin/moderation with approve/reject/escalate actions
```

---

## 10. API Design

### 10.1 Endpoints

```typescript
// explore.routes.ts - Fastify route registration

// Main explore feed (personalized "For You")
GET /api/explore
  Query: { limit: 20, cursor?: string, region?: string }
  Response: { posts: ExplorePost[], nextCursor: string | null, meta: { source: string } }

// Trending feed (global or regional)
GET /api/explore/trending
  Query: { limit: 20, cursor?: string, region?: string, timeWindow?: '1h'|'24h'|'7d' }

// Category-based discovery
GET /api/explore/category/:slug
  Query: { limit: 20, cursor?: string }

// Search-integrated discovery
GET /api/explore/search
  Query: { q: string, limit: 20, cursor?: string, type?: 'posts'|'users'|'hashtags' }

// Creator recommendations
GET /api/explore/creators
  Query: { limit: 10, category?: string }

// Hashtag discovery
GET /api/explore/hashtags/trending
  Query: { limit: 20, region?: string }

// Track interaction (for personalization)
POST /api/explore/interaction
  Body: { postId: string, action: 'VIEW'|'LIKE'|'SHARE'|'SAVE'|'NOT_INTERESTED', duration?: number }
```

### 10.2 Cursor Encoding

```typescript
// Cursor = Base64(JSON({ score, timestamp, lastId }))
// This enables stable pagination even as scores change

interface ExploreCursor {
  s: number;    // last score seen
  t: number;    // timestamp (epoch ms)
  id: string;   // last post ID (tiebreaker)
}

function encodeCursor(cursor: ExploreCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(encoded: string): ExploreCursor {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString());
}
```

### 10.3 Rate Limiting

```
Redis-based sliding window:
  Key: ratelimit:explore:{userId}:{windowMinute}
  INCR + EXPIRE 60s
  Limits:
    - Authenticated: 120 req/min
    - Unauthenticated: 30 req/min
    - Search: 60 req/min
```

---

## 11. Caching Strategy

### 11.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: CDN (CloudFront)                                   │
│ - Static explore page shell (HTML/JS/CSS)                   │
│ - TTL: 5 min for trending, no-cache for personalized        │
├─────────────────────────────────────────────────────────────┤
│ LAYER 2: In-Process LRU (per pod)                           │
│ - Global trending results: TTL 30s, max 100 entries         │
│ - Category metadata: TTL 5 min                              │
│ - Hot key protection: popular post hydration results        │
├─────────────────────────────────────────────────────────────┤
│ LAYER 3: Redis                                              │
│ - explore:trending:global           TTL 5min (rebuilt every) │
│ - explore:trending:region:{code}    TTL 5min                │
│ - explore:trending:cat:{slug}       TTL 5min                │
│ - explore:post:hydrated:{id}        TTL 10min               │
│ - user:seen:{userId}                TTL 7 days (SET)        │
│ - user:affinity:{userId}            TTL 30 days (ZSET)      │
│ - ratelimit:explore:{userId}:*      TTL 60s                 │
├─────────────────────────────────────────────────────────────┤
│ LAYER 4: PostgreSQL Read Replica                            │
│ - Fallback for cache misses                                 │
│ - trending_snapshots materialized view (rebuilt every 5min) │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Stampede Prevention

```typescript
// Probabilistic early expiration (XFetch algorithm)
async function getWithStampedeProtection<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    const { value, expiresAt, delta } = JSON.parse(cached);
    const now = Date.now();
    // Probabilistic early recompute: earlier as expiry approaches
    const earlyExpiry = expiresAt - (delta * Math.log(Math.random()) * -1);
    if (now < earlyExpiry) return value as T;
  }

  const start = Date.now();
  const value = await fetchFn();
  const delta = Date.now() - start;

  await redis.set(key, JSON.stringify({
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
    delta
  }), 'EX', ttlSeconds);

  return value;
}
```

---

## 12. Observability & SRE

### 12.1 SLOs

| SLI | Target | Alert Threshold |
|---|---|---|
| Explore P95 latency | < 150ms | > 120ms (warning), > 150ms (critical) |
| Explore P99 latency | < 300ms | > 250ms (critical) |
| Availability | 99.99% | > 0.01% error rate in 5min window |
| Cache hit ratio | > 95% | < 90% (warning) |
| Ranking computation | < 30ms | > 25ms (warning) |
| Kafka consumer lag | < 1000 msgs | > 5000 (critical) |

### 12.2 Metrics (Prometheus)

```
explore_request_duration_seconds{endpoint, region, status}   — Histogram
explore_candidate_pool_size{source}                          — Gauge
explore_ranking_duration_ms                                  — Histogram
explore_cache_hit_total{layer, key_pattern}                  — Counter
explore_cache_miss_total{layer, key_pattern}                 — Counter
explore_kafka_consumer_lag{topic, partition}                 — Gauge
explore_diversity_penalty_applied_total                      — Counter
explore_content_filtered_total{reason}                       — Counter
explore_ab_test_assignment_total{experiment, variant}        — Counter
```

### 12.3 Distributed Tracing

```
Every explore request gets a traceId propagated through:
  API Gateway → Explore Service → Redis/PG/OpenSearch calls
  
Spans:
  explore.request (root)
    ├── explore.auth_check
    ├── explore.ab_assignment
    ├── explore.candidate.trending    (Redis ZREVRANGE)
    ├── explore.candidate.personalized (Redis ZREVRANGE × N)
    ├── explore.candidate.merge
    ├── explore.ranking.compute
    ├── explore.safety.filter
    ├── explore.hydration              (Redis MGET or PG fallback)
    └── explore.response.build
```

---

## 13. Experimentation & A/B Testing

### 13.1 Experiment Framework

```typescript
interface Experiment {
  id: string;
  name: string;                    // e.g. "ranking_weights_v2"
  variants: ExperimentVariant[];
  trafficAllocation: number;       // 0.0 - 1.0 (percentage of users)
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED';
  startDate: Date;
  endDate: Date;
}

interface ExperimentVariant {
  id: string;
  name: string;          // "control" | "treatment_a" | "treatment_b"
  weight: number;        // 0.5 = 50% of experiment traffic
  config: Record<string, any>; // e.g. { engagementWeight: 0.35, freshnessWeight: 0.30 }
}

// Assignment: deterministic hash of (userId + experimentId) % 100
function assignVariant(userId: string, experiment: Experiment): ExperimentVariant {
  const hash = murmurhash3(userId + experiment.id) % 100;
  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight * 100;
    if (hash < cumulative) return variant;
  }
  return experiment.variants[0]; // fallback to control
}
```

### 13.2 Rollout Strategy

```
1. Shadow mode: New model scores logged but not used (1 week)
2. Canary: 1% traffic with auto-rollback on SLO violation
3. Gradual: 1% → 5% → 25% → 50% → 100% over 2 weeks
4. Holdback: 5% control group maintained for 30 days post-rollout
```

---

## 14. Security & Zero Trust

### 14.1 Request Authentication Flow

```
Client → [JWT in Authorization header]
  → API Gateway: JWT signature validation (RS256)
  → Explore Service: Extract userId from verified token
  → Internal calls: mTLS between services (Istio sidecar)
  → Redis/PG: Network-level isolation (VPC + Security Groups)
```

### 14.2 Security Controls

| Control | Implementation |
|---|---|
| **JWT Validation** | RS256, 15-min expiry, refresh token rotation |
| **mTLS** | Istio service mesh, automatic cert rotation |
| **RBAC** | Middleware checks: `requireAuth()`, `requireRole('admin')` |
| **Rate Limiting** | Redis sliding window (per-user + per-IP) |
| **Abuse Detection** | Anomaly detection on request patterns (> 10x normal rate) |
| **Encryption at Rest** | AES-256 (RDS, ElastiCache, S3) |
| **Encryption in Transit** | TLS 1.3 everywhere |
| **Input Validation** | Zod schemas on all API inputs (existing pattern) |
| **SQL Injection** | Drizzle ORM parameterized queries (existing) |

---

## 15. Failure Modes & Resilience

### 15.1 Failure → Fallback Matrix

```
┌─────────────────────┬──────────────────────────────────────────┐
│ FAILURE             │ FALLBACK STRATEGY                        │
├─────────────────────┼──────────────────────────────────────────┤
│ Redis outage        │ → PostgreSQL trending_snapshots table    │
│                     │   (last materialized snapshot, <5min old)│
│                     │ → In-process LRU cache (stale trending)  │
│                     │ → Circuit breaker after 3 failures       │
├─────────────────────┼──────────────────────────────────────────┤
│ Kafka lag (>10K)    │ → Scores slightly stale (acceptable)     │
│                     │ → Alert SRE, no user impact              │
│                     │ → Consumer auto-scales via KEDA          │
├─────────────────────┼──────────────────────────────────────────┤
│ Ranking engine OOM  │ → Return candidates without re-ranking   │
│                     │   (pre-scored from Redis sorted sets)    │
│                     │ → Fallback to chronological order        │
├─────────────────────┼──────────────────────────────────────────┤
│ OpenSearch down     │ → Search returns empty with error flag   │
│                     │ → Hashtag discovery falls back to PG     │
│                     │   query on posts.tags JSONB              │
├─────────────────────┼──────────────────────────────────────────┤
│ Regional outage     │ → Route53 health check fails             │
│                     │ → Traffic routes to next-closest region  │
│                     │ → RTO < 30s, RPO < 1s                   │
├─────────────────────┼──────────────────────────────────────────┤
│ PG read replica lag │ → Serve from Redis (primary data source) │
│                     │ → PG is fallback only                    │
└─────────────────────┴──────────────────────────────────────────┘
```

### 15.2 Circuit Breaker Configuration

```typescript
// Using opossum circuit breaker
const circuitBreakerOptions = {
  timeout: 3000,           // 3s timeout per call
  errorThresholdPercentage: 50, // Open after 50% failure rate
  resetTimeout: 10000,     // Try again after 10s
  volumeThreshold: 10,     // Min 10 requests before tripping
};

// Redis circuit breaker
const redisBreaker = new CircuitBreaker(redisCall, circuitBreakerOptions);
redisBreaker.fallback(() => pgFallbackCall()); // Fallback to PG snapshot

// OpenSearch circuit breaker
const searchBreaker = new CircuitBreaker(searchCall, circuitBreakerOptions);
searchBreaker.fallback(() => pgHashtagSearch()); // Fallback to PG JSONB query
```

### 15.3 Static Fallback Explore

```
If ALL dynamic sources fail simultaneously:
  1. Serve pre-baked static explore JSON from S3/CloudFront
  2. Updated every 15 minutes by a cron job
  3. Contains top 100 globally trending posts
  4. Not personalized, but prevents blank screen
  5. Header: X-Explore-Degraded: true (for client-side messaging)
```

---

## Implementation Priority

| Phase | Scope | Timeline |
|---|---|---|
| **P0** | Trending feed (Redis ZSET), basic ranking, API endpoints | 2-3 weeks |
| **P1** | Personalized "For You" (interest graph), Kafka consumers | 3-4 weeks |
| **P2** | Category discovery, OpenSearch integration, creator recommendations | 2-3 weeks |
| **P3** | Content safety pipeline, diversity enforcement | 2-3 weeks |
| **P4** | A/B testing framework, ML ranking integration | 3-4 weeks |
| **P5** | Multi-region deployment, chaos testing, full observability | 4-6 weeks |

---

## Integration with Existing Codebase

This design builds on your existing:
- **`FeedService`** — Home feed remains separate; Explore is a new service alongside it
- **`RecommendationService`** — Existing `trackInteraction` and `getForYouFeed` evolve into the Personalization Engine
- **`FeedRepository`** — Existing `getExploreFeed`, `getHashtagFeed` become fallback paths
- **Schema** — `rankingFeatures`, `userFeedMetadata`, `celebrityAccounts` are reused
- **Redis config** — Same `ioredis` instance, new key namespaces
- **Kafka config** — Existing Kafka setup extended with new consumer groups

The Explore module would live at `backend/src/modules/explore/` following the existing pattern:
```
modules/explore/
  ├── explore.routes.ts
  ├── explore.controller.ts
  ├── explore.service.ts
  ├── explore.repository.ts
  ├── explore.schema.ts
  ├── explore.dto.ts
  ├── ranking/
  │   ├── ranking.engine.ts
  │   └── ranking.weights.ts
  ├── candidates/
  │   ├── candidate.generator.ts
  │   ├── trending.pool.ts
  │   ├── personalized.pool.ts
  │   └── diversity.enforcer.ts
  ├── workers/
  │   ├── score.worker.ts
  │   ├── interest.worker.ts
  │   └── index.worker.ts
  └── safety/
      ├── content.filter.ts
      └── moderation.pipeline.ts
```
