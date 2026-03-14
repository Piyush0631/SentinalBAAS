# SentinelBaaS — Project Understanding

## 1) What SentinelBaaS Is

SentinelBaaS is a multi-tenant developer platform that automatically provides backend APIs per project, protects those APIs with project API keys, analyzes security weaknesses, and generates API documentation.

In short:

Developer creates project -> platform provisions backend API -> developer uses API -> platform returns security report + docs.

## 2) System Type

This is a modular monolith with multi-tenant data isolation.

- Many developers use the same platform.
- Each developer owns multiple projects.
- Each project owns its own API key, records, security reports, and docs.

Ownership chain:

User -> Projects -> Records / Reports / Docs

## 3) Correct Auth Split (Critical)

Dashboard and management routes use JWT auth.

- `/api/v1/auth/*`
- `/api/v1/projects/*`
- `/api/v1/projects/:id/security-report`
- `/api/v1/projects/:id/docs`

Generated project data routes use API key auth.

- `/api/v1/records`
- `/api/v1/records/:id`

Header for project API calls:

- `x-api-key: sk_proj_xxxxxxxxxxxx`

## 4) Developer Workflow

1. Register/login via JWT endpoints.
2. Create project and receive project API key.
3. Use generated records API with `x-api-key`.
4. Fetch security report for project.
5. Fetch generated docs for project.

Example flow endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/projects`
- `POST /api/v1/records`
- `GET /api/v1/projects/:id/security-report`
- `GET /api/v1/projects/:id/docs`

## 5) Core Subsystems

1. Authentication System
   - register, login, JWT middleware, protected dashboard routes
2. Project Management System
   - project CRUD-lite, API key generation, owner access checks
3. API Engine
   - generated records endpoints (`POST`, `GET`, `GET by id`, `PUT`, `DELETE`)
4. Security Analysis Engine
   - deterministic checks + AI explanation layer
5. API Documentation Engine
   - endpoint metadata, headers, auth requirement, request/response examples

## 6) Non-Negotiable Safety Rules

1. Always enforce project isolation on records queries.

- Every records query must include `projectId` scope.
- Never allow cross-project reads/updates/deletes.

2. Keep auth systems separated.

- JWT for dashboard/management.
- API key for generated records API.

3. Keep architecture maintainable.

- Thin controllers.
- Business logic in services.
- Consistent response/error contract with error codes.

## 7) What SentinelBaaS Is Not

It is not a cloud infrastructure provider or database engine.

It is a backend automation platform with security analysis for developers.

## 8) Final Mental Model

SentinelBaaS is a backend factory for developers, with per-project isolation and built-in security feedback.

## 9) Modular Monolith Rules

Follow these rules to keep architecture clean as the codebase grows:

1. Feature-first modules
   - Organize by business features (`auth`, `projects`, `records`, `security`, `docs`) instead of only technical layers.
2. Low coupling between modules
   - Do not import business logic directly from one feature into another feature.
   - Use explicit service interfaces or shared modules for cross-feature needs.
3. Shared cross-cutting code in common modules
   - Keep reusable parts in shared/common areas (`config`, `middleware`, `utils`, `errors`, `response`).

Recommended target backend layout:

- `backend/features/auth/{routes,controllers,services,validators}`
- `backend/features/projects/{routes,controllers,services,validators}`
- `backend/features/records/{routes,controllers,services,validators}`
- `backend/features/security/{routes,controllers,services}`
- `backend/features/docs/{routes,services}`
- `backend/shared/{config,middleware,utils,errors,response}`
