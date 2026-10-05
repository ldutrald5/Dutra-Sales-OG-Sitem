# DUTRA OS ONE SYSTEM — CHECKPOINT

MISSION: CONVERGENCE-01 — DUTRA OS ONE SYSTEM
CURRENT_STAGE: 0 — PREFLIGHT E BASELINE
STATUS: COMPLETE — Stage 0 baseline fully validated
UPDATED_AT: 2026-10-05 UTC
NEXT_STAGE: STOP — Stage 1 NOT STARTED
SAFE_TO_CONTINUE: NO — local closure is validated but publication is blocked; Stage 1 NOT STARTED

## Current environment and repository evidence

CHECKOUT: YES — real Git worktree, obtained with one successful clone
REPOSITORY_PATH: /workspace/Dutra-Sales-OG-Sitem
BRANCH: integration/dutra-os-one-system
ENTRY_HEAD: d8c31f0fd24a969a11d400bdd2031de78b79371b
CLOSURE_HEAD: c385e7f33cfa8f52dc84004a9ca4ac2cfec20ecb
PUBLICATION_BLOCKER_HEAD: commit containing this update (resolve with git log -1)
WORKING_TREE_INITIAL: CLEAN (git status --porcelain=v1 empty)
WORKING_TREE_AFTER_BASELINE: CLEAN
WORKING_TREE_PRECOMMIT: six understood documentation/Brain files only
WORKING_TREE_AFTER_CLOSURE_COMMIT: CLEAN
WORKING_TREE_FINAL: CLEAN after local documentation commits
REMOTE: https://github.com/ldutrald5/Dutra-Sales-OG-Sitem.git (origin fetch/push)
LOCAL_GIT_TRANSPORT: PASS — clone, ls-remote and fetch succeeded; no transport retries
PROXY: inherited platform route preserved; GitHub and npm transport succeeded
AUTH: repository reads verified; integration-branch push explicitly authorized
GITHUB_PROVIDER: not used; local Git route sufficient
FILESYSTEM: writable executable checkout
NODE: v24.19.0
NPM: 11.9.0 — meets engines >=11; packageManager declares npm@11.19.0
DOCKER: daemon available, 28.4.0
SUPABASE_CLI: absent from PATH
PSQL: absent from PATH
REMOTE_WRITE_SCOPE: Stage 0 closure commit to integration/dutra-os-one-system only

Skill read and followed: `.codex/skills/dutra-environment-guardian/SKILL.md`.
Requested AGENTS, story, prior checkpoint and execution runbook read before baselines.

## Remote references and ancestry

Refs independently checked with git ls-remote and fetched read-only:

| Reference | SHA |
|---|---|
| MAIN | 5255dc5d432850dfeebe0a523402a1902b1d3a52 |
| V3 / dutra-os-ui-v3-premium | 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f |
| #109 / supabase-00s-recovery-snapshot | c7585ba688ecca8e01b1ff8044cbef52aa5ac477 |
| #110 / supabase-00s-canonical-history | 6031e04462340847c8bcff3d5d698427db444918 |
| TARGET / integration/dutra-os-one-system | d8c31f0fd24a969a11d400bdd2031de78b79371b |

`git merge-base --is-ancestor` PASS for MAIN -> #109 -> #110 -> TARGET.
MAIN/V3 common ancestor: 1b55a4fa5c7cc4f114ee0551425c554e1f58f871.
TARGET application, scripts, Cloudflare, Supabase, package.json and lockfile are
byte-identical to #110 (`git diff --quiet` PASS). Existing differences are
convergence documentation, Skills and Second Brain routing/incident metadata.

## Baseline executions, in requested order

| Command | Result |
|---|---|
| npm ci | PASS — exit 0; 243 packages; lockfile unchanged |
| npm run og:check | PASS — exit 0 |
| npm test | PASS — final rerun exit 0; 64/64 gates PASS |
| npm run og:brain:check | PASS — after refresh and after full baseline; 97 records, 0 warnings |
| npm run og:supabase:recovery:test | PASS — exit 0 |
| npm run og:supabase:replay-safety:test | PASS — exit 0 |
| node scripts/build_supabase_transactional_replay.mjs supabase/migrations /workspace/scratch/dutra-replay.sql /workspace/scratch/dutra-actual-schema.json | PASS — SQL generated from 25 migrations; 34 table assertions; fingerprint capture enabled |

Historical baseline errors, now corrected:

```text
ERROR incidents.jsonl:10 invalid status mitigated
ERROR incidents.jsonl:10 requires source_ids or derived_from provenance
DUTRA brain check FAIL — 2 error(s), 0 warning(s).
Validation suite: FAIL (og:brain:check)
```

INC-EXEC-ENV-001 is preserved with status resolved and source_ids referencing
SRC-CONVERGENCE-ENV-20261004-001. derived_from remains empty. The new root source
records the actual initial failure and recovered execution route. No schema or
checker was changed. This resolves the specific incident, not all future proxy
risks; Environment Guardian prevention remains active.

`npm run og:brain:refresh` PASS; generated index/metrics refreshed legitimately.
`lint` is an alias of the executed og:check. release:gate and aiox:config-check
were executed by npm test and passed. No audit fix was run.

Local execution logs (ephemeral workspace evidence):

- /workspace/scratch/dutra-npm-ci.log
- /workspace/scratch/dutra-og-check.log
- /workspace/scratch/dutra-npm-test.log
- /workspace/scratch/dutra-brain-check.log (historical failure)
- /workspace/scratch/dutra-stage0-final-og-check.log (PASS)
- /workspace/scratch/dutra-stage0-final-test.log (64/64 PASS)

## Supabase evidence limits

Recovery/canonical alignment and replay safety passed on current TARGET.
Replay SQL generation is not a database replay or structural parity result.
Double disposable replay, actual fingerprint capture, structural parity and
fingerprint determinism: NOT RUN in this session because Supabase CLI and psql
are absent. No production connection, query, migration or deployment was made.
The dedicated workflow is `.github/workflows/supabase-replay-ci.yml` (CLI 2.119.0).
No workflow dispatch was performed.

Historical #110 evidence only: `docs/audits/SUPABASE_00S_CANONICAL_PROMOTION_REPORT.md`
records replay/parity PASS, 0 unexplained drift, 0 not-verifiable categories and
fingerprint `7f0c31d8de86892d48afb2bf9e4a6d0d36e293aab94d105344a5526241d959a9`.
LOCAL CANONICAL REPLAY: NOT RUN — Supabase CLI/psql unavailable
LOCAL STRUCTURAL PARITY: NOT RUN — Supabase CLI/psql unavailable
AUTHORITATIVE #110 CANONICAL REPLAY: PASS
AUTHORITATIVE #110 STRUCTURAL PARITY: PASS
UNEXPLAINED DRIFT: 0 in authoritative #110 evidence
NOT VERIFIABLE: 0 in authoritative #110 evidence

The user explicitly accepts this authoritative evidence solely for Stage 0.
No structural Supabase change exists after #110: `git diff --quiet` against #110
for supabase and scripts PASS, including all uncommitted Stage 0 changes.
Package 00R braces/AIOX audit debt remains separate.

Mandatory Stage 1 gate: after any integration/resolution changing supabase/**,
migrations, functions, recovery baseline or replay scripts, rerun Canonical
Replay and Structural Parity. Prefer the dedicated GitHub Actions workflow if
local Supabase CLI/psql remain unavailable. Do not proceed beyond this gate after
Supabase changes without successful replay/parity. No Stage 1 action was run.

## BASELINE_MATRIX — MAIN / V3 / SUPABASE CANONICAL / TARGET

This is a source-backed baseline and target contract, not implemented convergence.
MAIN and V3 were inspected through fetched Git objects without branch checkout or
modification. Their standalone suites were not rerun; current tests apply to TARGET.

| Scope | MAIN | V3 | SUPABASE (#109/#110) | TARGET |
|---|---|---|---|---|
| Operational source | Mature apps/sistema-og; current functional baseline | preview-v2 shell connected through core-bridge and /core-api/state | Canonical base inherits MAIN behavior | Currently #110 runtime; preserve tested MAIN behavior during future convergence |
| UI / mobile / desktop | Existing index.html, app.js, styles.css and PWA | Premium shell, feature loader, Meu Dia, operational CRM and technical center | No Premium UI convergence | One responsive shell; V3 UX with mature behavior; not implemented yet |
| CRM / Company 360 | canonical-domain, company-360, canonical-editor, reconciliation services | operational-crm-v3 and core bridge | Canonical recovery adds live CRM structures; Auth pilot remains pending | One canonical company/account identity and Client 360; no second CRM |
| Technical / Multi-Vehicles / quote | Existing app and proposal services | technical-application-core-v3, technical-quote-service-v3, quote handoff and parity tests | Canonical calculation/proposal SQL and recovered functions | One engine and one Multi-Vehicles/quote/proposal/ROI flow; parity must be preserved |
| Sales Execution | server-sales-execution-gateway.cjs, adapter/client and tests | sales-action-center-v3, prospecting-execution-v3 and sales-execution-service | Exact live Sales Execution migration versions and recovered gateway | Preserve mature gateway/contracts and adopt V3 flow after reconciliation |
| Call Intelligence | gateway/client, Whisper contracts and compiler tests | call-provider-v3; current V3 tree lacks MAIN gateway/client and call-intelligence function | Live call-intelligence migration/function recovered | One Call Intelligence path; avoid losing MAIN capabilities |
| Persistence / offline / sync | sync-bridge, conflict/reconciliation, backups and PWA tests | connection states, IndexedDB mutation outbox/retry; p0-services mirrors | 25 exact migrations; 13 functions; 8-table supplement; Auth pilot pending | One persistence/sync model; offline/mobile acceptance still needed |
| Schema history | Retimestamped duplicates and Auth pilot under migrations | Divergent Sales Execution names/history | Exact live history and recovered evidence; historical disposable parity PASS | Keep canonical history; do not auto-apply pending Auth or fabricate versions |
| Governance / tests | Mature validation and Second Brain | Divergent package/validate/Second Brain; audit at older SHA has manual offline acceptance pending | Recovery/replay-safety and dedicated double replay workflow | 64/64 validation gates PASS; Brain provenance corrected; Stage 0 COMPLETE |

Sources: fetched trees/diffs of MAIN, V3 and #110; V3's
`docs/audits/DUTRA_OS_V3_SPRINT_1_AUDIT.md` (historical baseline
57c9c8ff9e6a07cf35c6683eea84aeab64918c08), `preview-v2/package.json`, current
`package.json`, Supabase promotion report and CONVERGENCE-01 source-of-truth rules.
The V3 audit is not a new runtime or current-head certification.

## Stage 0 acceptance and stop

- Checkout, branch, HEAD, remote, clean initial baseline and toolchain: verified.
- Protected refs and canonical base ancestry: verified.
- Required baseline and available Supabase gates: executed and recorded.
- MAIN / V3 / SUPABASE / TARGET matrix: completed above.
- Stage 0 acceptance: COMPLETE — og:check, npm test (64/64), Brain all PASS.
- Disposable Supabase rerun capability: limited by missing CLI/psql.
- BLOCKERS: Stage 0 baseline has no test blocker; publishing its closure is blocked by Git HTTPS username unavailable. Supabase local tooling limitation is explicitly classified and accepted for Stage 0 only.
- Stage 1: NOT STARTED; SAFE_TO_CONTINUE_TO_STAGE_1: NO until the validated closure is published. Stop here.

PRODUCTION_CHANGED: NO
MAIN_CHANGED: NO
V2_CHANGED: NO
V3_CHANGED: NO
PR_109_CHANGED: NO
PR_110_CHANGED: NO
MERGE: NONE
REBASE: NONE
DEPLOY: NONE
PUSH_SCOPE: ONLY integration/dutra-os-one-system
PUSH: FAIL — one explicit push attempt; no retries or further remote probes
REMOTE_WRITES_SUCCEEDED: NONE

The local closure commit c385e7f33cfa8f52dc84004a9ca4ac2cfec20ecb was created
with the pre-commit check passing. The explicit integration-only push ran the
pre-push validation suite successfully, then failed with this exact error:

```text
fatal: could not read Username for 'https://github.com': No such device or address
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
error: failed to push some refs to 'https://github.com/ldutrald5/Dutra-Sales-OG-Sitem.git'
```

The push failure does not invalidate the green local Stage 0 baseline. Publication
requires restoration of Git HTTPS credentials/transport before a separately
authorized retry. No credential or proxy settings were changed. This blocker is
persisted in a local documentation-only followup commit; no second push occurred.

## Historical checkpoint (prior workspace; superseded environment finding)

The following records the earlier blocked environment. It is historical and does
not override the current successful checkout/transport evidence above.

## Completed

- Verified the four expected remote heads.
- Verified stacked ancestry main -> #109 -> #110.
- Created integration/dutra-os-one-system remotely from exact #110 SHA.
- Added dutra-environment-guardian.
- Routed Builder Brain and dutra-dev through the environment gate.
- Updated Context Router and AGENTS routing for checkout/Git/proxy/toolchain failures.
- Recorded incident INC-EXEC-ENV-001.

## Environment

CHECKOUT: UNAVAILABLE in the failing Codex workspace
REPOSITORY_PATH: not found locally
LOCAL_GIT_TRANSPORT: BLOCKED
PROXY: configured route to proxy:8080 was unreachable
AUTH: NOT PROVEN INVALID; transport failed before provider reachability
GITHUB_PROVIDER: AVAILABLE
FILESYSTEM_TEST_WORKTREE: UNAVAILABLE
LOCAL_TEST_CAPABILITY: UNAVAILABLE until a checkout is present

## Important diagnosis

The repository and remote refs are healthy enough to be inspected through the connected GitHub provider.

The blocker is the execution workspace transport/worktree, not the DUTRA OS repository and not the Supabase canonical package.

Do not repeat git ls-remote/clone through the same dead proxy unless the proxy/network condition changed.

## Conflicts resolved

None yet. V3 has not been integrated into this branch.

## Conflicts pending

- main/V3 code-level convergence;
- package/validate governance overlap;
- service worker/PWA overlap;
- docs/Second Brain overlap;
- canonical Supabase vs retimestamped V3 migration names;
- all other overlap discovered by actual merge in a valid worktree.

## Tests

TESTS_PASS: none executed after remote bootstrap
TESTS_FAIL: none — tests are NOT RUN because no local worktree exists

SUPABASE_CANONICAL_REPLAY: previously PASS on PR #110 evidence
STRUCTURAL_PARITY: previously PASS on PR #110 evidence
UNEXPLAINED_DRIFT: previously 0
NOT_VERIFIABLE: previously 0

These prior results are evidence for #110, not a substitute for convergence-branch reruns after V3 integration.

## Next required action

Obtain one valid executable checkout of integration/dutra-os-one-system.

Preferred order:

1. new Codex/workspace with repository attached or native GitHub checkout;
2. repair/remove the dead platform proxy only if that environment is under operator control;
3. clone/fetch the integration branch after transport works;
4. run dutra-environment-guardian preflight;
5. run baseline tests;
6. create MAIN / V3 / SUPABASE / TARGET matrix;
7. close Stage 0;
8. only then start Stage 1.

NEXT_STAGE: Finish Stage 0, not Stage 1.
BLOCKER: no executable local worktree in the prior Codex environment.
SAFE_TO_CONTINUE: NO for Stage 1 until a valid worktree/test route exists.
