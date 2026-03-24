# Contributing Guidelines

Thank you for contributing to the Telecom Incident Monitoring Backend! We follow strict guidelines to ensure code quality, maintainability, and production readiness.

## 1. Branching Strategy & Git Workflow
- **Assume work happens through feature branches.** Direct commits to `main` are restricted.
- Keep each change scoped and reviewable. Do not modify unrelated files.
- Mention rollback considerations for risky changes and likely CI risks before merging.
- Branch format: `<type>/<short-description>` (e.g., `feat/incident-crud`, `fix/jwt-validation`).

## 2. Commit Convention
We strictly follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

## 3. Pull Request Expectations
Every PR (and AI phase output) must include:
- A clear summary of the implemented change.
- Suggested branch name, conventional commit message, PR title, and PR summary.
- Adherence to the Definition of Done (builds pass, tests pass, docs updated, no dead code).

## 4. Architectural Rules
- **Module Boundaries:** Keep NestJS modules isolated. Do not create circular dependencies.
- **Thin Controllers:** Controllers should only handle routing, DTO validation, and HTTP response formatting.
- **Service Layer:** All business rules and cross-entity logic go here.
- **Error Handling:** Use centralized exception filters and avoid silent try-catch blocks. Throw standard HTTP exceptions with descriptive messages.
- **Logging:** Use structured logging for important state transitions. Do not log sensitive user data.

## 5. Self-Review & Hygiene Checklist
Before opening a PR, perform a self-review:
- Is naming clear? Is there duplicate logic?
- Is validation missing? Is error handling weak?
- Are DTOs/response shapes consistent?
- Is there accidental scope creep or unnecessary abstraction?
- Are docs/env/test updates missing?
- **Hygiene:** Do not commit secrets, credentials, logs, build output, cache, or generated junk.
- **Hygiene:** Do not leave commented dead code or unused imports. Clean up scripts to be minimal.

## 6. Local Development Workflows
1. Clone the repository and checkout a feature branch.
2. Verify Node environment via `.nvmrc` and run `npm install`.
3. Copy `.env.example` to `.env` and fill in local development keys.
4. Run Prisma migrations: `npx prisma migrate dev`.
5. Start the development server: `npm run start:dev`.
6. Run tests: `npm run test` and `npm run test:e2e`.
