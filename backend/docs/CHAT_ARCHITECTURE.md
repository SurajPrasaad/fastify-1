# Enterprise Real-Time Chat System Architecture

## 1. High-Level Architecture
This system is designed for massive scale (1M+ concurrent users) using a distributed, event-driven architecture.

### Tech Stack
- **API Runtime**: Fastify (Node.js) - High performance, low overhead.
- **Persistence**: MongoDB - Flexible schema for messages and rooms, optimized for write-heavy chat workloads.
- **Real-Time Layer**: `@fastify/websocket` - Native WebSocket support with low memory footprint.
- **Scaling Layer**: Redis Pub/Sub - Synchronizes events across multiple backend instances.
- **Frontend**: Next.js (App Router) + React Query - Efficient data fetching and state synchronization.

---

## 2. Core Modules Implementation

### A. WebSocket Handshake & Auth
Authentication occurs during the initial WS handshake. We extract the JWT from the `token` query parameter or `Authorization` header.
- **Security**: Connections without valid tokens are rejected immediately (`socket.close(1008)`).
- **Binding**: The `userId` is bound to the connection state, ensuring all subsequent actions are authenticated.

### B. Room Logic & Validation
- **Explicit Joining**: Clients must send a `JOIN_ROOM` event.
- **Auth Checks**: The server verifies the user's membership in the MongoDB `ChatRoom` collection before allowing them to receive or send events for that room.
- **Fanning Out**: Events are published to a Redis channel specific to each user (`chat:u:{userId}`). This ensures that if a user has multiple devices, they all receive the message.

### C. Presence System
- **Distributed State**: Presence is stored in Redis with a TTL (Time-To-Live).
- **Heartbeat**: Online status is maintained as long as the WS connection is active.
- **Real-Time Broadcasts**: When a user connects/disconnects, a `USER_ONLINE`/`USER_OFFLINE` event is broadcast to all members of the rooms that user belongs to.

### D. Message Persistence & History
- **Database Schema**: Messages are indexed on `roomId` and `createdAt` for fast chronological retrieval.
- **Pagination**: REST APIs use cursor-based pagination (using the `createdAt` timestamp) to prevent "message jumping" during high-velocity chats.

---

## 3. High-Scale Production Strategy

### Horizontal Scaling
- **Problem**: WebSocket connections are stateful; a user on Server A can't easily talk to a user on Server B.
- **Solution**: We use **Redis Pub/Sub**. When Server A receives a message for Room X, it performs a lookup for participants. For each participant, it publishes to `chat:u:{pId}`. All servers subscribe to the channels of their locally connected users. If Server B has that user, it receives the event and pushes it to the socket.

### Database Optimization
- **MongoDB Sharding**: Shard the `messages` collection by `roomId`. This keeps all messages for a single room on the same shard, making history fetches extremely fast.
- **Capped Collections (Optional)**: For very high-volume public rooms, capped collections or TTL indexes can be used to manage data growth.

### Performance & Reliability
- **Backpressure**: Use the `socket.readyState` check before sending to prevent memory leaks on slow clients.
- **Reconnection Logic**: Frontend implements exponential backoff for reconnections to avoid "thundering herd" issues when a server restarts.
- **Optimistic UI**: Use React Query `setQueryData` to append messages to the local UI immediately before the server round-trip completes.

### Security
- **Strict Zod Validation**: Every incoming WS message is validated against a schema.
- **Rate Limiting**: Implement per-user rate limits on `SEND_MESSAGE` events in the gateway.
- **Content Sanitization**: Use standard escaping on the frontend and optionally a profanity filter on the backend.
