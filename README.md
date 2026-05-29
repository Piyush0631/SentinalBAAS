# SentinelBaaS

SentinelBaaS is an AI security analyzer wrapped around a modular backend platform. It turns a developer-authenticated dashboard into project-scoped APIs, then watches the resulting traffic for suspicious behavior, rule violations, and security risks. The differentiator is not just CRUD generation — it is the combination of generated APIs, request logging, and two-layer security analysis that produces actionable findings from real traffic.

## Table of Contents

- [How It Works](#how-it-works)
- [Why It Is Built This Way](#why-it-is-built-this-way)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Overview](#api-overview)
- [Known Limitations](#known-limitations)
- [What I Would Do At Scale](#what-i-would-do-at-scale)

---

## How It Works

1. A developer registers and logs in via JWT-authenticated dashboard routes.
2. They create a project and define a record schema (field names, types, required flags).
3. SentinelBaaS generates a fully working CRUD API for that schema, scoped to the project API key.
4. Every inbound request to the generated API is logged against the project.
5. The developer triggers a security analysis — the system runs deterministic rule checks on the logs, then enriches findings with an AI model.
6. Auto-generated API documentation is available per project at any time.

---

## Why It Is Built This Way

**Two-layer security analysis** — a deterministic rule engine runs first so findings are never dependent on AI availability. Groq is used for enrichment and NVIDIA Mistral is the fallback when Groq is unavailable. If both fail, deterministic findings are still returned. The system never returns an empty result due to an AI outage.

**JWT for the dashboard, API keys for the data plane** — dashboard actions need user identity and session-style auth. Generated project APIs need a simple project-scoped credential that works from any backend client or service-to-service call without managing user sessions.

**HMAC-SHA256 for API key storage** — API keys are shown once at creation and never stored in plaintext. Only the keyed hash is persisted. Using HMAC with a server-side secret means the hashes cannot be brute-forced even if the database is fully compromised, unlike plain SHA-256 which offers no resistance to GPU-accelerated dictionary attacks.

**Feature-first folder layout** — auth, projects, records, security, docs, and health are isolated modules. Each feature owns its routes, controllers, services, middleware, and validators. This keeps coupling low and makes each module independently testable.

**Request logging as a first-class concern** — logs are captured per project on every inbound request so the security analyzer inspects real traffic patterns rather than synthetic assumptions.

---

## Tech Stack

| Layer         | Technology                                         |
| ------------- | -------------------------------------------------- |
| Runtime       | Node.js (ES Modules)                               |
| Framework     | Express.js                                         |
| Database      | MongoDB + Mongoose                                 |
| Cache         | Redis (ioredis)                                    |
| Auth          | JWT + HMAC-SHA256 API keys                         |
| AI (primary)  | Groq                                               |
| AI (fallback) | NVIDIA Mistral                                     |
| Validation    | Zod                                                |
| Security      | helmet, express-mongo-sanitize, express-rate-limit |
| Logging       | Morgan (Apache Combined in production)             |

---

## Architecture

```text
Client / Dashboard / API Consumer
              │
              ▼
        Express App
        (helmet, cors, rate limit,
         request ID tracing, morgan)
              │
              ├─────────────────────────► MongoDB
              │                           users, projects,
              │                           records, request logs,
              │                           security reports
              │
              ├─────────────────────────► Redis
              │                           geo-lookup cache
              │
              ▼
       Security Analyzer
       (deterministic rule engine)
              │
              ▼
        Groq AI ──► NVIDIA Mistral (fallback)
```

**Auth split:**

```text
Dashboard routes  →  JWT middleware  →  project management, docs, security reports
Data plane routes →  API key middleware  →  record CRUD, request logging
```

---

## Project Structure

```
backend/
├── config/
│   ├── db.js                  # MongoDB connection with graceful exit on failure
│   └── envValidator.js        # Startup env validation
├── features/
│   ├── auth/                  # Register, login, JWT middleware, current user
│   ├── projects/              # Project management, API key generation
│   ├── records/               # Schema-driven CRUD engine
│   ├── security/              # Two-layer security analyzer, geo enrichment
│   ├── docs/                  # Auto-generated API docs per project
│   └── health/                # Liveness and readiness checks
├── middleware/
│   └── validationErrorHandler.js  # Zod, Mongoose, JWT error mapping
├── models/                    # Mongoose schemas with indexes
├── utils/
│   ├── apperror.js            # Operational error class
│   ├── catchasync.js          # Async error wrapper
│   ├── generateApiKey.js      # Prefixed API key generator
│   ├── redisClient.js         # ioredis client with graceful degradation
│   ├── sanitization.js        # Input sanitization helpers
│   └── setTokenCookie.js      # HTTP-only cookie helper
├── app.js                     # Express setup, middleware stack, routes
└── server.js                  # Entry point, startup, graceful shutdown
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or managed)
- Groq API key ([console.groq.com](https://console.groq.com))
- NVIDIA API key ([build.nvidia.com](https://build.nvidia.com)) — optional, used as fallback

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Copy the template below into `backend/.env` and fill in your values.

```env
PORT=7001

DATABASE=mongodb+srv://<user>:<password>@<cluster>/sentinalbaas_dev?retryWrites=true&w=majority
DATABASE_PASSWORD=<your_database_password>

JWT_SECRET=<random_64_char_hex>
JWT_EXPIRES_IN=7d

API_KEY_SECRET=<random_64_char_hex>

GROQ_API_KEY=<your_groq_api_key>
NVIDIA_API_KEY=<your_nvidia_api_key>

REDIS_URL=redis://<your_redis_connection_string>

ALLOWED_ORIGINS=http://localhost:3000
```

Generate secure secret values with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Running

```bash
# production
npm start

# development with auto-reload
npm run dev
```

---

## API Overview

All routes are prefixed with `/api/v1`.

| Group                               | Auth    | Description                                      |
| ----------------------------------- | ------- | ------------------------------------------------ |
| `POST /auth/register`               | none    | Register a new developer account                 |
| `POST /auth/login`                  | none    | Login and receive JWT cookie                     |
| `GET /auth/me`                      | JWT     | Get current authenticated user                   |
| `POST /auth/logout`                 | JWT     | Clear session cookie                             |
| `GET /projects`                     | JWT     | List all projects for current user               |
| `POST /projects`                    | JWT     | Create a project and receive API key             |
| `GET /projects/:id`                 | JWT     | Get project details and schema                   |
| `PATCH /projects/:id`               | JWT     | Update project name, description, or schema      |
| `GET /projects/:id/records`         | API key | List records for project                         |
| `POST /projects/:id/records`        | API key | Create a record validated against project schema |
| `GET /projects/:id/records/:rid`    | API key | Get a single record                              |
| `PATCH /projects/:id/records/:rid`  | API key | Update a record                                  |
| `DELETE /projects/:id/records/:rid` | API key | Delete a record                                  |
| `GET /projects/:id/security-report` | JWT     | Run security analysis on project request logs    |
| `GET /projects/:id/docs`            | JWT     | Get auto-generated API documentation             |
| `GET /health`                       | none    | Liveness check                                   |

**Dashboard routes** use `Authorization: Bearer <jwt>`.  
**Data plane routes** use `x-api-key: sk_proj_<key>`.

---

## Known Limitations

- Security analysis runs synchronously inside the HTTP request. At scale this would move to a background job queue (BullMQ) with a polling or webhook response pattern.
- Geo-lookup uses the ip-api.com free tier, which is rate-limited at 45 requests per minute. A production deployment would use a paid provider or a locally hosted GeoIP database.
- No frontend yet. The dashboard and deployment phases are upcoming.

---

## What I Would Do At Scale

- Move security analysis into a background worker (BullMQ + Redis) so AI calls do not block request latency and provider outages do not affect API availability.
- Add API key rotation and revocation per project so compromised keys can be invalidated without deleting the project.
- Split the security analyzer into a dedicated microservice once traffic grows to the point where analysis load affects the main API.
- Add structured logging with trace IDs propagated across services, metrics collection, and alerting dashboards.
- Cache generated docs and security summaries per project with invalidation on schema or log changes.
- Add provider-aware AI routing with quota tracking, retry budgets, and cost controls.
- Enforce per-project rate limits, record storage caps, and log retention policies by subscription tier.
