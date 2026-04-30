# SentinelBaaS

SentinelBaaS is a modular **Backend-as-a-Service platform** for generating project-scoped APIs, defining custom data models, analyzing real API traffic for security risks, and producing live API documentation from a single backend.

At a glance, it gives you:

- JWT-based auth for developers
- Project-scoped API keys for generated APIs
- Schema-driven CRUD routes
- Real request-log security analysis
- Auto-generated API docs per project

---

## Quickstart

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create `backend/.env` with the required variables used by the app:

```env
PORT=7001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
```

3. Start the backend:

```bash
npm run dev
```

4. Register or log in, then create a project, then use the returned `apiKey` with generated project APIs.

---

## Why It Stands Out

This is not a toy CRUD demo. It combines authentication, project isolation, request logging, security analysis, and schema-driven API generation in one backend.

- Developers create a project once and immediately get project-scoped APIs.
- The platform logs real traffic so security analysis is based on actual requests.
- API docs are generated from the schema so the docs match the implementation.

---

## Core API Flow

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/projects
POST /api/v1/projects/:projectId/records
GET  /api/v1/projects/:projectId/docs
```

Use `Authorization: Bearer <your_jwt>` for project management and docs, and `x-api-key: sk_proj_xxxxxxxxxxxx` for generated project APIs.

---

## Auto-Generated API Example

If a project is created with this schema:

```json
{
  "name": { "type": "String", "required": true },
  "age": { "type": "Number", "required": false },
  "isActive": { "type": "Boolean", "required": false }
}
```

SentinelBaaS automatically generates matching CRUD APIs for that schema. For example, creating a record uses this request:

```http
POST /api/v1/projects/:projectId/records
```

```json
{
  "name": "sample text",
  "age": 0,
  "isActive": false
}
```

The response follows the same structured format across endpoints:

```json
{
  "success": true,
  "data": {
    "_id": "6634a2f1c3b2a10012e4d9f7",
    "createdAt": "2025-01-01T00:00:00Z",
    "name": "sample text",
    "age": 0,
    "isActive": false
  }
}
```

---

## API Docs Generator: How It Works

SentinelBaaS generates API documentation for each project from the project record schema using a two-mode approach:

1. **Full Docs Generation:**
   - Reads the project's `recordSchema` and builds documentation for all CRUD endpoints.
   - Includes method, path, auth requirements, headers, request schema, response schema, examples, and status codes.
   - Returns the complete endpoint list for the project.

2. **Filtered Docs View:**
   - Accepts an optional `operationId` query parameter.
   - Returns only the matching endpoint doc when a specific operation is requested.
   - Returns an empty `endpoints` array if no matching operation is found.

**Example Docs Output:**

```json
{
  "success": true,
  "data": {
    "projectId": "69d2687831cb9c053b979546",
    "projectName": "My test Project",
    "basePath": "/api/v1/projects/:projectId/records",
    "endpoints": [
      {
        "operationId": "listRecords",
        "method": "GET",
        "path": "/api/v1/projects/:projectId/records"
      }
    ],
    "generatedAt": "2026-04-30T15:24:30.670Z"
  }
}
```

---

## Security Analyzer: How It Works

SentinelBaaS analyzes real API request logs for each project using a two-layer approach:

1. **Deterministic Rule Engine:**
   - Checks for missing API keys, malformed fields, high error rates, suspicious traffic, injection patterns, and more.
   - Always runs, always returns actionable findings.

2. **AI Enrichment (Groq, NVIDIA fallback):**
   - Summarizes deterministic findings and log patterns.
   - Calls Groq AI (primary) or NVIDIA Mistral (fallback) for risk analysis, severity, and recommendations.
   - Strict 10s timeout, robust error handling, and per-project rate limiting.
   - If all AI fails, deterministic findings are still returned.

**Example Security Report Output:**

```json
{
  "deterministicFindings": [
    {
      "rule": "missing-api-key",
      "issue": "16 requests were made without an API key",
      "severity": "High",
      "affectedCount": 16
    },
    {
      "rule": "injection-probe",
      "issue": "2 requests contained suspicious injection patterns",
      "severity": "High",
      "affectedCount": 2
    }
  ],
  "aiFindings": {
    "summary": "Missing API key in 16 requests, suspicious injection patterns in 2 requests.",
    "recommendations": [
      "Implement API key validation for all requests.",
      "Monitor and block suspicious injection patterns."
    ],
    "severity": "High"
  },
  "status": "full",
  "inputSummary": {
    "totalRequests": 16,
    "failedRequests": 3,
    "uniqueRoutes": ["/records"]
  }
}
```

Severity levels: `Low` / `Medium` / `High`

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT (dashboard) + project API key (`x-api-key`) for generated APIs and docs
- **AI**: Groq (primary), NVIDIA Mistral (fallback) for security analysis enrichment
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

## Target Users

- Backend developers seeking rapid, secure API generation
- Students learning modern backend and security practices
- Startup teams prototyping MVPs with built-in security analysis

---

## Progress Snapshot

### Completed

- Phase -1: Standards & Contracts
- Phase 0: Initial Setup & Environment
- Phase 1: User Authentication
- Phase 2: Project Management
- Phase 3: API Key Middleware & Request Logging
- Phase 4: Dynamic CRUD API Engine
- Phase 5: Security Analyzer
- Phase 6: API Documentation Generator

### Upcoming

- Phase 7: Frontend Dashboard
- Phase 8: Testing & Cleanup
- Phase 9: Deployment

### Future Enhancements

- Optional project webhooks for record and security events
- Docs caching for high-traffic projects
