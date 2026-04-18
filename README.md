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

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT (dashboard) + API Key (generated APIs)
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

---

## Getting Started

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see `.env.example` for all variables):

```env
PORT=7001
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
NVIDIA_API_KEY=your_nvidia_api_key
JWT_SECRET=your_jwt_secret_key
```

```bash
npm run dev
```

Server starts at `http://localhost:7001`

Health check: `GET /api/v1/health` → `{ "success": true, "message": "Server running" }`

---

## Target Users

- Backend developers seeking rapid, secure API generation
- Students learning modern backend and security practices
- Startup teams prototyping MVPs with built-in security analysis

---

## Development Phases & Status

| Phase | Name                                 | Status   |
| ----- | ------------------------------------ | -------- |
| -1    | Standards & Contracts                | Done     |
| 0     | Initial Setup & Environment          | Done     |
| 1     | User Authentication                  | Done     |
| 2     | Project Management                   | Done     |
| 3     | API Key Middleware & Request Logging | Done     |
| 4     | Dynamic CRUD API Engine              | Done     |
| 5.1   | SecurityReport Model & Endpoint      | Done     |
| 5.2   | Deterministic Rule Engine            | Done     |
| 5.3   | Log Sanitization                     | Done     |
| 5.4   | Groq AI Provider Integration         | Done     |
| 5.5   | NVIDIA Fallback Provider (planned)   | Upcoming |
| 5.6   | Fallback Chain & Full Integration    | Upcoming |
| 6     | API Docs Generator                   | Upcoming |
| 7     | Frontend Dashboard                   | Upcoming |

---

## Contributing

1. Fork the repo and clone your fork.
2. Create a new branch for your feature or bugfix.
3. Run `npm install` in `/backend`.
4. Add or update tests for your changes.
5. Open a pull request with a clear description.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
