## PR Summary
<!-- Describe the problem being solved and the approach taken. Keep changes small and narrow. -->

## Rollback Considerations & Risks
<!-- Detail any migration risks, data-loss potential, or CI failure risks. -->

## Definition of Done checklist
- [ ] Build passes
- [ ] Lint passes
- [ ] Relevant tests pass
- [ ] New env vars documented in `.env.example`
- [ ] README/docs updated if setup or behavior changed
- [ ] Swagger updated for new endpoints
- [ ] No dead code, comments, or placeholder-only implementation remains
- [ ] Schema changes include proper migrations and seed updates (if applicable)
- [ ] Indexes and constraints clearly explained (if applicable)

## Self-Review checklist
- [ ] Checked for unclear naming or duplicate logic
- [ ] Checked for missing validation or weak error handling
- [ ] Checked for inconsistent DTO/response shape
- [ ] Checked for accidental scope creep or unnecessary abstraction
- [ ] Checked for missing docs/env/test updates
- [ ] Verified no secrets, credentials, build output, or generated junk are committed
