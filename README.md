# SentinelBaaS

SentinelBaaS is a modern **Backend-as-a-Service platform** that lets you instantly generate backend APIs, define custom data models, analyze real API traffic for security vulnerabilities, and produce live API documentation — all from a single platform.

---

## Core Features

| Feature                 | Description                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **Developer Auth**      | Register, login, JWT-protected dashboard routes                                            |
| **Project Management**  | Create isolated backend projects, each with a unique API key                               |
| **Dynamic CRUD Engine** | Define your own schema at project creation; get dynamic Mongoose models and CRUD endpoints |
| **Request Logging**     | All project API requests are logged for security analysis and auditing                     |
| **Security Analyzer**   | Finds vulnerabilities using real request logs and AI-powered analysis                      |
| **API Docs Generator**  | Auto-generated JSON documentation per project endpoint                                     |
| **Frontend Dashboard**  | UI for managing projects, viewing reports, copying API keys                                |

---

## API Key Format

Each project gets a unique API key in the format:

```
sk_proj_xxxxxxxxxxxx
```

Include it in requests to generated APIs:

```
x-api-key: sk_proj_xxxxxxxxxxxx
```

---

## Generated CRUD Endpoints (per project)

Endpoints are generated dynamically based on the schema you define at project creation. Example:

```
POST   /api/v1/records
GET    /api/v1/records
GET    /api/v1/records/:id
PUT    /api/v1/records/:id
DELETE /api/v1/records/:id
```

---

## Security Analysis Output (per project)

Security analysis is performed on real request logs, not just static route descriptions. Example output:

```json
{
  "route": "/records",
  "issue": "Unexpected field in request body detected in 3/20 requests",
  "severity": "Medium",
  "explanation": "Some requests included fields not defined in the schema, which may indicate injection attempts.",
  "recommendation": "Add stricter validation and reject unknown fields."
}
```

Severity levels: `Low` / `Medium` / `High`

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT (dashboard) + API Key (generated APIs)
- **AI**: OpenAI (security analysis enrichment)
- **Architecture**: Modular monolith, feature-first folders

---

## Project Structure

```
backend/
├── config/               # DB connection
├── features/
│   ├── auth/             # Register, login, JWT middleware
│   ├── projects/         # Project management + API key generation
│   ├── records/          # Auto-generated CRUD engine
│   ├── security/         # Security analyzer
│   ├── docs/             # API docs generator
│   └── health/           # Health check
├── utils/                # AppError, catchAsync
├── app.js                # Express setup, middleware, routes
└── server.js             # Entry point, DB connect, graceful shutdown
```

---

## Getting Started

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=7001
DATABASE=your_mongodb_atlas_connection_string
DATABASE_PASSWORD=your_password
```

```bash
npm run dev
```

Server starts at `http://localhost:7001`

Health check: `GET /api/v1/health` → `{ "success": true, "message": "Server running" }`

---

## Target Users

- Backend developers who want rapid API generation
- Students learning backend development
- Startup teams prototyping MVPs quickly

---

## Development Phases

| Phase | Name                                  | Status   |
| ----- | ------------------------------------- | -------- |
| -1    | Standards & Contracts                 | Done     |
| 0     | Initial Setup & Environment           | Done     |
| 1     | User Authentication                   | Done     |
| 2     | Project Management                    | Done     |
| 3     | API Key Middleware & Request Logging  | Upcoming |
| 4     | Dynamic CRUD API Engine               | Upcoming |
| 5     | Security Analyzer (Real Log Analysis) | Upcoming |
| 6     | API Docs Generator                    | Upcoming |
| 7     | Frontend Dashboard                    | Upcoming |
