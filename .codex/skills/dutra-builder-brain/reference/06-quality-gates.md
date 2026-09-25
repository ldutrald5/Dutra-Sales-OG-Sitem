# Quality Gates

## Baseline gate

Before structural change capture:

- app/version/schema version;
- environment/runtime versions;
- critical file hashes or commit/tag;
- portable backup/export where applicable;
- baseline test results.

## Data gate

No silent data loss. Migrations need:

- mapping;
- unknown-field strategy;
- duplicate strategy;
- reconciliation/read-back;
- rollback/restore path.

## Release gate

A release is green only if required checks actually ran in a supported environment.

Classify each check:

- PASS
- FAIL
- BLOCKED
- NOT APPLICABLE
- NOT RUN

## UX gate

For main workflows ask:

- Can the user understand state in ~5 seconds?
- Is the next action visible?
- Does save/sync truth match reality?
- Are errors actionable?
- Are destructive actions explicit?
- Is mobile/touch usable when relevant?
- Did the package add unnecessary clicks?

## AI gate

For AI-enabled changes verify:

- source context is bounded and relevant;
- deterministic facts/calculations are not invented;
- writes go through controlled tools/services;
- human confirmation exists when required;
- prompts do not leak unnecessary sensitive data;
- failures degrade safely.
