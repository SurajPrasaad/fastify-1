
# Enterprise Real-Time Presence & Typing System Design
**Principal Engineer Design Doc**

## 1. High-Level Architecture
The system uses a **State-Lease** pattern where presence is treated as a temporary lease in a global Redis cluster.

- **Gateway Layer**: Distributed Socket.io nodes using a Redis Adapter for cross-node communication. Each user is joined to a virtual room `u:{userId}`.
- **State Store**: Redis Hash objects preserve multi-attribute state (status, last heartbeat, devices).
- **Cleanup Worker**: A TTL + ZSET based reaper that identifies zombie connections from crashes.

## 2. Redis Key Schema
| Key Pattern | Type | Purpose | TTL |
|:---|:---|:---|:---|
| `presence:u:{userId}` | Hash | Core presence state (status, lastSeen, hb) | 90s |
| `presence:u:{userId}:devices` | Set | Active socket/device IDs for multi-tab | 90s |
| `presence:v_heartbeat` | ZSet | Global index of online user scores (timestamp) | N/A |
| `typing:r:{roomId}` | Hash | Current typers in a room | 10s |

## 3. Data Flows

### A. Heartbeat Flow
1. Client sends `HEARTBEAT` every 30s.
2. Server executes `HSET presence:u:{userId}`, `SADD devices`, and `ZADD v_heartbeat`.
3. If user was previously `OFFLINE`, trigger `USER_ONLINE` fan-out.

### B. Graceful Disconnect
1. Socket triggers `disconnect`.
2. Server runs `SREM devices`.
3. If `SCARD devices == 0`, mark `OFFLINE` in Redis, remove from `v_heartbeat`, and broadcast `USER_OFFLINE`.

### C. Network Drop Recovery
1. Cleanup worker runs every 60s.
2. `ZRANGEBYSCORE v_heartbeat -inf <threshold>` finds stale leases.
3. For each stale user, execute transition to `OFFLINE`.

## 4. Performance & Scalability
- **O(1) Lookup**: Standard presence checks are direct HGETALL.
- **Batched Fan-out**: Room-based presence is retrieved in a single multi-get or hash scan.
- **Horizontal Scaling**: Adding more Socket.io nodes requires zero coordination beyond the Redis Adapter.
- **Memory Footprint**: Hash-based storage is optimized via `ziplist` for millions of keys.

## 5. Security
- **RS256 JWT**: Connections are authenticated at the handshake level.
- **Rate Limiting**: Typing events are throttled on the server to prevent CPU/Network exhaustion.
- **Spoof Protection**: Presence updates only affect the `userId` bound to the socket's JWT.

## 6. Failure Handling
- **Redis Partitioning**: If Redis is partitioned, presence might lag, but the system favors Availability (AP).
- **Node Reboots**: New nodes automatically pick up heartbeats; old leases expire naturally via TTL.
