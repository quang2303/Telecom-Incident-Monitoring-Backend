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

## Available endpoints
- `GET /api/health` - API Health check
- `POST /api/auth/register` - Register a new operator account
- `POST /api/auth/login` - Login with email/username + password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user profile (requires auth)
- `GET /docs` - Swagger Documentation UI

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

### Guards & Decorators
- `@UseGuards(JwtAuthGuard)` — protect a route with JWT auth
- `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` — restrict by role
- `@CurrentUser()` — extract the authenticated user from the request
