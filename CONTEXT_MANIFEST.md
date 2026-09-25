# Context Manifest — Package 00R

## Source of truth

- Repository: `ldutrald5/Dutra-Sales-OG-Sitem`
- Baseline: `main@655d5243c6227aadbe441eef2d878a4f08106dd3`
- Working branch: `package-00r-reconciliation`

## Consulted inputs

| Source | Role | Authority |
|---|---|---|
| GitHub baseline | Executable code and current behavior | Canonical |
| `DUTRA_BUILDER_BRAIN_V2.zip` | Engineering governance and knowledge model | Advisory, reconciled |
| `DUTRA_OS_ARCHITECTURE_V1.md` | Target architecture decisions | Advisory |
| `DUTRA_OS_MASTER_IMPLEMENTATION_PLAN.md` | Sequencing and gates | Advisory |
| Package 02/03 reports | Prior implementation evidence | Non-canonical; no changesets imported |

## Context loaded for implementation

- `AGENTS.md`
- `package.json`, `package-lock.json`, `scripts/validate.mjs`
- local and Cloudflare state APIs
- spreadsheet import path and its tests
- data safety backup service and tests
- Builder Brain skill, schemas, JSONL collections, checker, index and metrics

## Explicit exclusions

Supabase, Auth, SQL migrations, canonical Company 360, production deployment, real customer data and remote repository settings.

## Provenance rule

Decisions created by this package cite the baseline or supplied decision artifacts through `source_ids`, `derived_from` and, when replacing an earlier decision, `supersedes`. Generated Brain surfaces are refreshed only after product gates pass.
