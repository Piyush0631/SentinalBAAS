SentinelBaaS — Detailed Phase Development Plan (Revised)

Phase -1 — Standards & Contracts (New)
Goal
Define cross-cutting standards before coding.

Tasks

- Define API prefix/version (`/api/v1`).
- Define success/error response schema (single consistent format).
- Define structured error codes (example: `AUTH_001`, `PROJ_001`, `RECORD_001`).
- Define validation policy (required fields, type checks, constraints).
- Choose request validation approach for the project (`Joi` or `Zod`) and keep it consistent across modules.
- Define authentication policy (JWT expiry, refresh approach, protected route rules).
- Define API key policy (generation format, revocation, rotation guidance).
- Define environment variable contract (required vars and defaults).
- Define environment validation at startup so missing/invalid env vars fail fast.
- Define logging format (request id, route, status, error code).
- Define baseline security middleware strategy (security headers, sanitization, CORS policy, and rate limiting rules).
- Define coding standards and tooling (`ESLint`, `Prettier`, `.editorconfig`, Node version).
- Define automated test scope and minimum coverage expectation for critical modules.
- Define API documentation strategy (generated JSON now, OpenAPI/Swagger compatible later if needed).

Modular Monolith Guardrails

- Enforce feature-based modules (`auth`, `projects`, `records`, `security`, `docs`) as primary organization.
- Keep module boundaries clean: avoid direct business-logic imports between feature modules.
- Allow cross-feature reuse only through shared/common modules or explicit service interfaces.
- Keep shared cross-cutting code in common areas (`config`, `middleware`, `utils`, `errors`, `response`).
- Keep controllers thin; move business logic to per-feature services.

Recommended Backend Layout (Target)

- backend/features/auth/{routes,controllers,services,validators}
- backend/features/projects/{routes,controllers,services,validators}
- backend/features/records/{routes,controllers,services,validators}
- backend/features/security/{routes,controllers,services}
- backend/features/docs/{routes,services}
- backend/shared/{config,middleware,utils,errors,response}

Deliverable

- Standards are documented and used as implementation contract for all phases.

Phase 0 — Initial Setup & Environment
Goal
Create a running backend server and connect MongoDB.

Folder Structure (Only create this)
sentinel-baas/
└── backend/
├── config/
├── server.js
├── app.js
└── .env

Dependencies to Install

- npm init -y
- npm install express mongoose dotenv cors helmet express-rate-limit express-mongo-sanitize compression
- npm install morgan
- npm install nodemon --save-dev
- npm install --save-dev eslint prettier

Files to Create

- server.js
- app.js
- config/db.js
- .env
- .editorconfig
- .eslintrc
- .prettierrc

Tasks

- Start server from `server.js`.
- Initialize express app in `app.js`.
- Enable JSON parsing and CORS.
- Add request logging middleware (`morgan("dev")`).
- Add baseline security middleware (`helmet`, sanitization, compression, CORS policy).
- Add health endpoint: `GET /api/v1/health`.
- Add base error middleware skeleton.
- Add process-level handlers for `uncaughtException` and `unhandledRejection`.
- Capture the server instance from `app.listen(...)` and add graceful shutdown skeleton.
- Validate environment variables during startup before boot completes.
- Connect MongoDB with connection error handling.
- Pin Node version for the project and document local run commands.

Deliverable

- Server runs and DB connects.
- Runtime safety and baseline security middleware are in place.

Test

- `GET /api/v1/health` returns status OK.

Phase 1 — User Authentication
Goal
Allow developers to register, login, and access protected profile route.

New Files
backend/
├── models/User.js
├── controllers/authController.js
├── routes/authRoutes.js
└── middleware/authMiddleware.js

Dependencies

- npm install bcryptjs jsonwebtoken

Tasks

- Create User schema with constraints (unique email, required password).
- Hash password before save.
- Implement `registerUser`, `loginUser`, `getCurrentUser`.
- Implement JWT verification middleware.
- Apply Phase -1 response/error format and validation policy.

Routes

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me

Deliverable

- User can register, login, and access protected route.

Phase 2 — Project Management
Goal
Allow authenticated developers to create and view projects.

New Files
backend/
├── models/Project.js
├── controllers/projectController.js
└── routes/projectRoutes.js

Tasks

- Create Project schema.
- Implement `createProject`, `getProjects`, `getProjectById`.
- Protect all project routes with auth middleware.
- Generate secure API key on project creation.
- Enforce owner-only access for project reads.
- Store or derive generated API metadata clearly so docs/reporting can reference project endpoints later.

Routes

- POST /api/v1/projects
- GET /api/v1/projects
- GET /api/v1/projects/:id

Deliverable

- User can create and list own projects; each has API key.

Phase 3 — API Key Middleware
Goal
Protect generated project APIs via project API key.

New File

- backend/middleware/apiKeyMiddleware.js

Tasks

- Read `x-api-key` header.
- Resolve matching project.
- Attach project context to request.
- Reject missing/invalid key with standardized error response.
- Add API key usage logging fields (projectId, route, timestamp, status).

Deliverable

- Requests without valid key are unauthorized.

Phase 4 — CRUD API Engine (records)
Goal
Provide default project-scoped records CRUD APIs.

New Files
backend/
├── models/Record.js
├── controllers/recordController.js
└── routes/recordRoutes.js

Tasks

- Create Record schema (`projectId`, `title`, `value`, `createdAt`).
- Implement `createRecord`, `getRecords`, `updateRecord`, `deleteRecord`.
- Protect routes with `apiKeyMiddleware`.
- Add request validation and consistent response format.
- Ensure project scoping on all record queries.
- Add list pagination/sorting design for `GET /records` so the API scales beyond demo data.

Routes

- POST /api/v1/records
- GET /api/v1/records
- GET /api/v1/records/:id
- PUT /api/v1/records/:id
- DELETE /api/v1/records/:id

Deliverable

- Client performs CRUD with valid API key.

Phase 5 — Security Analyzer
Goal
Generate security findings for project APIs.

New Files
backend/
├── services/aiSecurityService.js
├── models/SecurityReport.js
└── controllers/securityController.js

Dependencies

- npm install openai

Tasks

- Implement deterministic checks first:
  - missing auth
  - missing validation
  - injection-prone query patterns
  - excessive data exposure
- Implement AI explanation/enrichment second (severity reasoning + recommendations).
- Store findings in SecurityReport with timestamp/status.
- Keep deterministic rule findings available even if the AI provider fails or rate limits.
- Record analyzer version/input summary so reports stay explainable over time.

Route

- GET /api/v1/projects/:id/security-report

Deliverable

- Security issues returned and persisted per project.

Phase 6 — API Documentation Generator
Goal
Auto-generate API docs for project endpoints.

New File

- backend/services/apiDocService.js

Tasks

- Generate docs for records endpoints.
- Include method, path, headers, auth required, request shape, response examples.
- Keep output aligned to Phase -1 response schema.
- Keep docs generation compatible with future OpenAPI/Swagger export.

Route

- GET /api/v1/projects/:id/docs

Deliverable

- API docs available as JSON per project.

Phase 7 — Frontend Dashboard
Goal
Provide web UI for auth, projects, reports, and docs.

New Folder

- frontend/

Setup

- npx create-react-app frontend
- npm install axios react-router-dom

Pages

- Login
- Register
- Project List
- Project Dashboard
- Security Report
- API Docs

Project Dashboard Must Show

- Project Name
- API Key (copyable)
- Security Report entry point
- API Docs entry point

Delivery Sequence

- First: auth + project management pages
- Then: security report and docs pages

Frontend Guardrails

- Keep frontend separate from backend serving concerns.
- Add loading, empty, and error states for every dashboard page.
- Store auth token securely and centralize API client configuration.

Deliverable

- End-to-end user workflow in UI.

Phase 8 — Testing & Cleanup (Quality Gate)
Goal
Stabilize and verify all MVP functionality.

Testing Tools

- npm install --save-dev jest supertest

Tasks

- Endpoint tests for auth/projects/records/security/docs.
- Middleware tests for auth + API key checks.
- Validation and error-format consistency audit.
- Remove dead code and normalize responses.
- Add lint and format scripts and require them to pass before release.
- Add coverage reporting for critical backend modules.
- Add CI pipeline for install, lint, test, and build verification.

Deliverable

- All critical flows pass with predictable API behavior.

Phase 9 — Deployment
Goal
Deploy backend, frontend, and database in production-like setup.

Backend

- Render or Railway

Frontend

- Vercel

Database

- MongoDB Atlas

Tasks

- Configure production env vars/secrets.
- Run staging verification before production release.
- Verify health endpoint and basic logs/monitoring.
- Add SIGTERM/graceful shutdown verification in hosted environment.
- Add Dockerfile and optional docker-compose for reproducible local/prod setup.
- Add deployment checklist for CORS, DB URI, API base URL, and secret rotation.

Final Result
SentinelBaaS provides:

- developer authentication
- project creation and API key protection
- records CRUD API generation
- AI-assisted security analysis
- auto-generated API documentation
- developer dashboard
