# Engineering Workflow

This document details the practical engineering lifecycle for the Telecom Incident Monitoring Backend, ensuring consistency and safety for both AI and human contributors.

## 1. Feature Lifecycle Execution
1. **Planning:** Scope out the change. Ensure it can fit into a small, reviewable diff.
2. **Implementation:** 
   - Follow clean architecture boundaries (thin controllers, heavy services, strict DTOs).
   - Commit incrementally using conventional commits.
   - Do not modify unrelated domain code.
3. **Database & Migration Discipline:** 
   - Never casually rewrite old migrations.
   - Schema changes must generate a migration with a descriptive name.
   - Update seed data if necessary.
   - Explicitly document if a migration is destructive/data-loss risk.
   - Explain indexes and constraints applied to new tables in the PR.
4. **Testing & Documentation Discipline:** 
   - Update tests whenever behavior changes.
   - Keep Swagger annotations, `README.md`, and `.env.example` continuously updated.
5. **Pre-Review:** Complete the self-review checklist in the PR template.
6. **PR Verification:** PRs must naturally pass build, lint, and relevant automated tests.

## 2. Repo Hygiene & Security Boundaries
- **No Secrets:** Never commit `.env` files, API keys, or credentials.
- **No Artifacts:** Do not commit `node_modules`, `dist`, local logs, caches, or OS junk files.
- **Clean Code:** Delete commented-out code. Remove unused imports. Do not leave placeholder-only implementations. Keep scripts coherent and minimal. Prefer consistency over cleverness.

## 3. High-Risk Change Management
- **Rollbacks:** Always consider "how do we revert this?" for risky framework bumps or destructive database changes. Document this rollback plan clearly.
- **CI Failures:** Warn before stopping if a requested local change might trigger a CI failure due to environment differences.
