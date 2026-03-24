# AI Agent Working Agreement

This document defines the rules and boundaries for AI pair-programming in this repository. 
All AI agents contributing to this project must adhere to the following strict guidelines.

## 1. Core Operating Principles
- **Small Phases:** Work in small, reviewable phases. Never try to build everything at once.
- **Simplicity:** Keep solutions simple, maintainable, and production-oriented. Prefer clear modular design over unnecessary abstraction.
- **Narrow Diffs:** Keep diffs narrow and avoid touching unrelated files.
- **Security & Repo Hygiene:** Never commit secrets, credentials, logs, build output, cache, or generated junk. Do not leave commented dead code or unused imports. Prefer consistency over cleverness.

## 2. Technical Direction
- **Framework:** NestJS (strict TypeScript, clean module boundaries).
- **Database:** Prisma ORM, PostgreSQL (Neon).
- **Architecture:** DTO validation, service-layer business logic, thin controllers.
- **Cross-cutting:** Centralized error handling, structured logging, JWT authentication.
- **Tooling:** Jest for testing, ESLint + Prettier for formatting, Swagger for API docs.

## 3. Mandatory Pre-Coding Output
Before writing or modifying any code in a feature phase, the AI must output exactly:
- Phase goal
- Implementation plan
- Files to create/update/delete
- Assumptions
- Risks

## 4. Mandatory Post-Coding Output
After completing the code modifications, the AI must output exactly:
- Summary of changes
- Commands to run
- Test commands
- Remaining gaps
- Suggested branch name, commit message, PR title, and PR summary

## 5. Definition of Done
A feature phase is considered complete only when:
- The build passes and lint passes.
- Relevant tests pass.
- `.env.example` is updated if environment variables change.
- `README.md` or relevant docs are updated if setup/behavior changes.
- Swagger decorators are updated for new endpoints.
- No dead code or placeholder-only implementations remain.

## 6. Self-Review Discipline
Before considering work complete, the AI must verify:
- [ ] Checked for unclear naming or duplicate logic.
- [ ] Checked for missing validation or weak error handling.
- [ ] Checked for inconsistent DTO/response shape.
- [ ] Checked for accidental scope creep or unnecessary abstraction.
- [ ] Checked for missing docs/env/test updates.

## 7. Database Migration Discipline
- Schema changes must include proper migrations unless explicitly stated otherwise.
- Keep migration names descriptive.
- Update seed data when schema changes require it.
- Clearly document destructive changes and data-loss risk.
- Explain indexes and constraints for new tables.
- Do not casually rewrite old migrations.

## 8. Ambiguity and Risk Mitigation
- If behavior or requirements are ambiguous, choose the simplest production-safe option and state the assumption explicitly.
- Do not silently continue after a risky change; call out rollback considerations and risks clearly.
- Warn if CI is likely to fail before stopping.
