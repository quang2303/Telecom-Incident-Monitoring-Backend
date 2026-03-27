# Telecom Incident Monitoring Backend

Production-ready NestJS application for the Telecom Incident Monitoring System.

## Project Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run start:dev
   ```

## Available endpoints (v1)

### Authentication
- `POST /api/v1/auth/register` - Register a new operator account
- `POST /api/v1/auth/login` - Login with email/username + password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (requires auth)
- `GET /api/v1/auth/me` - Get current user profile (requires auth)

### Users
- `GET /api/v1/users/assignable-technicians` - List active technicians for assignment (Operator/Admin)

### Incidents
- `GET /api/v1/incidents` - List all incidents with pagination and filtering
- `GET /api/v1/incidents/:id` - Get incident details
- `PATCH /api/v1/incidents/:id/status` - Update internal incident status

### Webhook (Telemetry)
- `POST /api/v1/webhook/telemetry` - Ingest real-time device faults (Requires API Key auth)

### Dashboard Analytics
- `GET /api/v1/dashboard/summary` - Get high-level KPI counts
- `GET /api/v1/dashboard/incidents-by-status` - Breakdown chart data
- `GET /api/v1/dashboard/fault-severity-distribution` - Severity chart data

### AI Analysis & RAG
- `GET /api/v1/ai/analysis/:incidentId` - Retrieve stored AI analysis
- `POST /api/v1/ai/analyze/:incidentId` - Trigger AI analysis using Gemini 2.5 Flash
- *Note:* Integrates an **In-Memory RAG** (Retrieval-Augmented Generation) module to retrieve historical runbooks and inject them into the LLM context, guaranteeing high-resolution, hallucination-free `suggestedActions` based on actual telecom scenarios.

### Data Ingestion (Telstra Dataset)
- `POST /api/v1/imports/telstra` - Upload dataset (`.zip` or 5 CSVs) for async background processing
- `GET /api/v1/imports` - Check import job statuses

### Technical
- `GET /api/v1/health` - API Health check
- `GET /docs` - Swagger Documentation UI

## Security & Data Integrity

The system enforces strict security and validation paradigms:
- **Mass Assignment Protection**: Global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`.
- **Pagination Limiters**: API requests are stringently capped (e.g., `@Max(100)`) to prevent OOM/DoS attacks via mass retrieval.
- **Strict Logic Guards**: Enforces rigid Incident lifecycle ownership. Operators cannot assign inactive technicians, and technicians cannot arbitrarily modify incidents they do not own.

## Authentication

JWT-based authentication with refresh token rotation.

### Roles
- **ADMIN** — created via seed or direct DB access only
- **OPERATOR** — assigned to all users registered via the API

### Environment Variables
| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | Yes | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins (comma-separated for multiple, e.g., `http://localhost:3000,https://app.com`) |

### Guards & Decorators
- `@UseGuards(JwtAuthGuard)` — protect a route with JWT auth
- `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` — restrict by role
- `@CurrentUser()` — extract the authenticated user from the request

## Environment Setup & Operations

1. **Database & Environment**: Copy `.env.example` to `.env` and fill in DB connection strings and secrets.
   - Note: The application uses `helmet`, `cls-rtracer`, and `rate-limiting` by default.
   - You can restrict origins using the `CORS_ORIGIN` env variable.
2. **Migrations**: 
   ```bash
   npx prisma migrate dev
   ```
   *For production deployment, use `npx prisma migrate deploy`.*
3. **Seeding Database**:
   ```bash
   npx prisma db seed
   ```
   *This sets up the default ADMIN user and essential initial data.*
4. **Running the App**:
   ```bash
   npm run start:dev  # development
   npm run start:prod # production
   ```

## Example Requests (cURL)

**1. Register an Operator**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Password123!"}'
```

**2. Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

**3. Get Incidents** (Requires standard Bearer token from Login response)
```bash
curl -X GET "http://localhost:3000/api/v1/incidents?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Continuous Integration (CI)

This repository includes a GitHub Actions workflow for automated testing and linting, ensuring team readiness and code quality.

- **Trigger**: The workflow runs automatically on `push` and `pull_request` to the `main` branch.
- **Steps**: It executes dependency installation (`npm ci`), linting (`npm run lint`), building (`npm run build`), unit testing (`npm run test`), and E2E testing (`npm run test:e2e`).
- **Database Strategy**: Instead of requiring live Neon production credentials, the CI spins up a local ephemeral **PostgreSQL 15 container locally**. Prisma pushes the schema directly to this container before running the test suite. This ensures a clean, test-safe, and deterministic environment without risking data leaks.
- **Secrets & Env**: No secrets are required in the GitHub repository settings for the workflow to pass. Development-safe JWT secrets and an internal database connection URL are provided directly within the workflow environment definition.
