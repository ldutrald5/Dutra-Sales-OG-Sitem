# Method Map — proportionality + stage routing

The loop is not a waterfall. First choose **scope class**, then route to the earliest unresolved stage.

## Scope classes

| Class | Use when | Mandatory path |
|---|---|---|
| MICRO | isolated low-risk change; no structural data/integration/auth/migration impact | inspect → change → focused test |
| STANDARD | bounded feature/workflow using known architecture/domain | frame → inspect → evidence/decision check → plan → implement → test → brain closeout |
| STRUCTURAL | persistence, canonical model, auth, sync, migration, integration, AI write, background job, deployment, cross-module foundation | full loop from earliest unresolved stage |

### Escalation triggers

Escalate to STRUCTURAL when the work creates or changes any of: source of truth, canonical entity, persistent relation, auth/permission, cross-device state, destructive migration, external integration, asynchronous processing, AI mutation path, deployment/runtime contract.

## Stage routing

| Situation | Start here | Typical output |
|---|---|---|
| Idea but problem vague | Frame | problem, constraints, success evidence, non-goals |
| System behavior/data location unclear | Audit | current-state report, risks, evidence |
| New repo/CRM/research introduced | Reference intake | source card, reverse-engineering notes, patterns |
| Current system + reference understood | Gap | keep/fix/adapt/reuse/replace/defer matrix |
| Structural choices unresolved | Architecture | domain/boundaries/ADRs/non-goals |
| Architecture approved | Plan | dependency graph + small packages |
| About to code structural change | Safety baseline | checkpoint + environment/tests |
| Scope approved and bounded | Implement package | reversible code + tests |
| Code complete | Validate/release | gate results + rollback readiness |
| Task complete | Learn | brain updates + cycle metrics + next recommendation |

## When NOT to run the full loop

Changing wording in a known component, adjusting spacing, fixing a typo, or correcting a local validation message should not trigger audit/gap/architecture. Use MICRO unless the task reveals hidden structural uncertainty.

## DUTRA progression

1. Product/commercial vision and operating principles.
2. Audit of real DUTRA OS persistence/modules.
3. Reverse engineering of DeskcommCRM as external reference.
4. Gap analysis: patterns that fit vs. complexity to avoid.
5. Architecture V1: official truth, canonical domain, identity, sync, AI boundaries.
6. Master implementation plan: foundation + commercial tracks.
7. Package 01: safety/reproducibility/checkpoint/feature flags/contracts/health gates.
8. Builder Brain: formalized method + durable memory.
9. Continue package by package, learning after each tracked cycle.
