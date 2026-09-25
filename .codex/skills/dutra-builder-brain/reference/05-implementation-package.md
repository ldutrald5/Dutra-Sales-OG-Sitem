# Implementation Package Workflow

One package is the largest unit that may be implemented and validated as a single reversible change.

## Before code

1. Confirm approved architecture/decision basis.
2. Define exact scope and non-goals.
3. Identify data/schema impact.
4. Create checkpoint/backup.
5. Verify environment/toolchain gates.
6. Run relevant baseline tests.

## During code

- Work on a copy/branch when possible.
- Keep changes additive and bounded.
- Reuse existing services/components/contracts.
- Use feature flags/adapters for risky cutovers.
- Do not migrate real data merely to demonstrate architecture.
- Add observability for new failure modes.
- Add UX truth states when operations may be pending/fail/conflict.

## After code

Run:

1. unit/contract tests;
2. domain/data tests;
3. migration tests if applicable;
4. integration tests;
5. regression tests for affected commercial flows;
6. mobile/responsive checks when relevant;
7. health/release gates;
8. rollback verification or rehearsal appropriate to risk.

## Package report

Record:

- what changed;
- what intentionally did not change;
- data migrated/not migrated;
- tests passed/failed/blocked;
- environment limitations;
- security/secret check;
- rollback path;
- new brain entries;
- next recommended package.

A failure/blocker must remain visible. Never convert “not run” into “pass”.
