# Fastify + TypeScript API

A production-ready Fastify application built with TypeScript, featuring a robust architecture using PostgreSQL (Drizzle ORM), MongoDB, Redis, and RabbitMQ. This project implements advanced authentication (2FA, OAuth), real-time chat, social features, and a scalable notification system.

## 🚀 Features

- **Core Framework**: Fastify v5 with TypeScript for high-performance, type-safe API development.
- **Database Architecture**:
  - **Primary**: PostgreSQL with Drizzle ORM for structured, relational data (Users, Posts, Comments).
  - **Secondary**: MongoDB (via Mongoose) for flexible data storage.
- **Authentication & Security**:
  - Secure Session & JWT-based authentication.
  - **2FA**: Two-Factor Authentication (TOTP/QR Code).
  - **OAuth**: Support for Google and GitHub login.
  - Rate Limiting & Helmet security headers.
- **Real-Time Capabilities**:
  - **WebSocket Chat**: Live messaging system.
  - **Notifications**: Real-time system/push notifications (FCM) and email alerts (Nodemailer).
- **Social Platform**:
  - **Posts & Interaction**: Create posts, reposts, threaded comments, and polymorphic likes.
  - **User Graph**: Follow/Unfollow system with follower counts.
  - **Feeds**: Personalized activity feeds.
- **Infrastructure**:
  - **Redis**: For session management, caching, and Pub/Sub.
  - **RabbitMQ**: Message queuing for asynchronous background processing.
  - **Docker**: Full containerization with Docker Compose.
- **Validation**: Strict runtime validation using `zod`.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [npm](https://www.npmjs.com/)

---

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd fastify
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
   *Note: Using `--legacy-peer-deps` is recommended due to ESLint 9 peer dependency strictness with certain plugins.*

3. **Environment variables:**
   Copy the example environment file and update the values:
   ```bash
   cp .env.example .env
   ```
   Key variables to configure:
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgres://user:pass@localhost:5432/db`)
   - `MONGO_URL`: Your MongoDB connection string
   - `REDIS_HOST`/`REDIS_PORT`: Your Redis connection details
   - `RABBITMQ_URL`: Your RabbitMQ connection string
   - `SESSION_SECRET`: A long, random string for session encryption
   - `SMTP_*`: Credentials for your email provider (e.g., Mailtrap)

---

## 🏃 Running the Application

### Using Docker (Recommended)
This is the easiest way to spin up the app along with PostgreSQL, MongoDB, Redis, and RabbitMQ:
```bash
docker-compose up --build
```
The app will be available at `http://localhost:8000`.

### Local Development
Ensure you have PostgreSQL, MongoDB, Redis, and RabbitMQ services running on your machine (or use Docker for dependencies), then:
```bash
# Start in watch mode
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production build
npm run start
```

---

## 📁 Project Structure

```text
├── src
│   ├── config        # Database and Redis configurations
│   ├── modules       # Domain-driven modules (auth, user, health)
│   │   ├── auth      # Authentication logic, routes, and controllers
│   │   └── user      # User management
│   ├── plugin        # Fastify plugins (session, rate-limit)
│   ├── utils         # Shared utilities (email, etc.)
│   ├── app.ts        # Fastify application setup
│   └── server.ts     # Main entry point holding the listener
├── .env              # Local environment secrets
├── .env.example      # Template for environment variables
├── Dockerfile        # Production Docker image configuration
└── docker-compose.yml # Orchestration for app and databases
```

---

## 🧪 API Endpoints (Quick Reference)

- `GET /` - Root status
- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /users/me` - Get current user profile (requires session)

---

## 📄 License
This project is licensed under the ISC License.
