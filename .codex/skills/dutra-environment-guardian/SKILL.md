
---
name: dutra-environment-guardian
description: Execution-environment and repository-access guardian for DUTRA OS. Use before STANDARD/STRUCTURAL work that depends on a local checkout, Git transport, GitHub, package installation, CI, deployment tooling, or any external execution environment. Distinguishes project failure from environment failure, chooses safe fallbacks, avoids repeated dead-end retries, and produces an actionable bootstrap checkpoint.
metadata:
  short-description: Preflight the execution environment before code work
---

# DUTRA Environment Guardian

This skill prevents implementation work from being blocked late by a missing checkout, dead proxy, broken Git transport, unavailable package manager, invalid workspace, missing credentials, or a tool capability mismatch.

Its job is not to fix everything automatically. Its job is to:

1. detect the actual execution capabilities early;
2. separate environment failures from code/project failures;
3. choose the safest available execution route;
4. avoid repeating a failing transport path;
5. leave a reproducible checkpoint and exact human remediation only when automation cannot proceed.

## Core law

Never assume the environment can execute the plan. Prove the execution path before investing in the plan.

For STANDARD/STRUCTURAL work:

TASK FRAME -> CAPABILITY INVENTORY -> REPOSITORY ACCESS GATE -> TOOLCHAIN GATE -> BASELINE -> IMPLEMENT

Do not reverse this order.

## Activation triggers

Use this skill when any of these are true:

- the task requires reading or modifying a Git repository;
- a local checkout is expected;
- GitHub refs/branches/PRs matter;
- npm, Supabase CLI, Railway CLI, Docker, Python, Postgres, or another toolchain is required;
- the task says clone, checkout, create branch, run tests, deploy, replay, build, migration, or integration;
- the previous attempt failed because of network, proxy, auth, checkout, workspace, tool availability, filesystem access, or provider access;
- a connector works but local CLI transport does not;
- the agent is operating in a temporary/cloud workspace whose contents are unknown.

## Truth model

Environment evidence is classified separately from project evidence.

### PROJECT FACT
Supported by repository contents, GitHub refs, persisted data, tests, CI or validated runtime state.

### ENVIRONMENT FACT
Supported by the current execution environment: filesystem, process, CLI, network, proxy, auth, package cache, container, or connector capability.

Do not turn an environment failure into a project conclusion.

Examples:

- git ls-remote failing through a dead proxy does NOT prove the GitHub token is invalid.
- no checkout in /workspace does NOT prove the repository does not exist.
- a working GitHub connector does NOT prove git clone works.
- a green remote CI run does NOT prove the current local workspace can execute tests.
- a missing local CLI does NOT invalidate a repository-level decision already proved remotely.

## Stage A — Capability inventory

Before STANDARD/STRUCTURAL execution, inspect only what the task actually needs.

Record:

- current working directory;
- whether a valid Git worktree exists;
- repository root if present;
- current branch/HEAD if present;
- working tree clean/dirty state;
- configured remotes;
- Git transport availability;
- GitHub connector availability;
- package manager/runtime availability;
- required CLI availability;
- filesystem write permission;
- relevant network/proxy state;
- whether tests can actually execute;
- whether the task requires local execution or can be completed through a connected provider.

Do this once at the beginning. Do not wait until after design/planning work.

## Stage B — Repository access gate

Use this fallback ladder.

### Route 1 — Existing valid checkout

Prefer an already available checkout when:

- git rev-parse --show-toplevel succeeds;
- remote points to the intended repository;
- working tree state is known;
- branch/HEAD is understood.

Do not silently discard local changes.

### Route 2 — Local Git transport

If no checkout exists, verify Git transport once.

Use a read-only probe such as git ls-remote.

If it succeeds, create an isolated checkout.

If it fails, classify the failure before retrying.

### Route 3 — Connected GitHub provider

If local Git transport fails but a GitHub connector/provider works:

- use the provider for repository inspection;
- use it for read-only branch/PR/file evidence;
- use it for explicitly authorized safe remote writes such as creating a dedicated branch or writing a checkpoint;
- do NOT pretend provider access creates a local testable worktree.

If implementation/tests require a worktree, provider-only access is a partial capability, not a full execution environment.

### Route 4 — Materialized/provided checkout

If the platform can mount/materialize a repository or the user can provide a checkout/archive, use that instead of repeatedly retrying a dead transport.

### Route 5 — Human remediation

Only after the previous routes are exhausted.

Return the smallest exact remediation that restores the missing capability.

Do not dump generic networking advice.

## One-failure / one-diagnosis rule

Do not loop on the same failed operation.

After one meaningful failure:

1. capture the exact error;
2. classify it;
3. inspect the relevant layer;
4. choose a different route or stop.

A second identical retry is allowed only when a concrete condition changed.

Examples of concrete changes:

- proxy configuration changed;
- network restored;
- credentials refreshed;
- checkout mounted;
- provider connection added.

Try again is not a changed condition.

## Proxy diagnosis protocol

When Git/HTTPS reports a proxy error, inspect without printing secret values:

- HTTP_PROXY
- HTTPS_PROXY
- ALL_PROXY
- NO_PROXY
- lowercase equivalents
- Git proxy configuration and its origin
- package-manager proxy configuration if relevant.

If a configured proxy endpoint is unreachable, classify:

ENVIRONMENT_BLOCKER: PROXY_UNREACHABLE

Do not infer authentication failure from requests that never reached GitHub.

Do not automatically delete proxy settings unless the user or hosting contract explicitly authorizes it.

If the proxy is platform-managed, report that the hosting/session environment must be repaired or replaced.

## Authentication diagnosis protocol

Authentication is evaluated only after transport is proven.

Order:

1. network route works;
2. TLS/host reachable;
3. provider responds;
4. then evaluate auth.

Never say token invalid when the request failed before reaching the provider.

Never print tokens.

## Toolchain gate

Before implementation, verify only required tools.

Examples:

- Node/npm version;
- Supabase CLI version;
- psql;
- Python;
- Docker;
- Railway tooling;
- browser/runtime tooling.

If a tool is optional and a provider/CI path is authoritative, do not block solely because the local CLI is absent.

If a tool is required to prove the Definition of Done, block before modifying code.

## Remote-write safety

When local checkout is unavailable but a connected Git provider can write, remote writes are allowed only with explicit task/user authorization and on a safe non-production branch.

Safe examples:

- create a dedicated integration branch from an exact SHA;
- create/update a story;
- create/update a checkpoint;
- add a project Skill;
- record an incident.

Not allowed without explicit authorization:

- merge main;
- force push;
- rewrite protected history;
- deploy;
- apply production migrations;
- mutate production infrastructure.

Every remote write must report:

- repository;
- branch;
- prior base SHA;
- resulting commit SHA;
- files changed.

## Bootstrap checkpoint

For blocked or structural work, maintain a checkpoint with:

ENVIRONMENT:
- checkout available?
- repository path
- local Git transport
- GitHub provider
- proxy status
- auth status
- required CLIs
- test execution capability

REPOSITORY:
- intended repo
- base branch/SHA
- working branch/SHA
- remote ancestry evidence

EXECUTION:
- what can proceed now
- what cannot proceed
- exact blocker
- selected fallback route
- human action required, if any

Do not mark SAFE_TO_CONTINUE: YES if the next stage requires capabilities that are still unavailable.

## Current DUTRA OS incident pattern

Known anti-pattern:

A structural convergence task entered Stage 0 assuming a local Git checkout would be available. The execution workspace contained no usable checkout and local Git HTTPS was routed through an unreachable proxy endpoint. GitHub provider access still worked, but the initial plan treated local Git as the only execution path.

Durable lesson:

Execution capability must be preflighted before repository-local work. Connected provider access and local CLI transport are distinct capabilities and need separate routing.

The volatile branch SHAs and current task state belong in the active handoff/checkpoint, not in this Skill.

## DUTRA OS convergence rule

For CONVERGENCE-01 / DUTRA OS ONE SYSTEM:

- do not alter main, V2, V3, PR #109, or PR #110 branches directly;
- use integration/dutra-os-one-system for convergence work;
- if local checkout is unavailable but GitHub provider access exists, repository setup/checkpoint/Skill updates may be done remotely when explicitly authorized;
- actual merge conflict resolution, local build, integration tests and filesystem-sensitive work still require a valid worktree;
- no next stage may be marked safe until its required execution capabilities are present.

## Interaction with other DUTRA Skills

### dutra-builder-brain
Environment Gate comes before Safety Baseline implementation work.

### dutra-dev
Repository/toolchain capability must be proved before file modification.

### dutra-runtime-operator
Use for hosted runtime/Railway/deployment state. Environment Guardian covers the current execution workspace; Runtime Operator covers hosted application infrastructure.

### dutra-qa-guardian
An environment blocker is not a test failure. Record tests as NOT RUN when they could not execute.

## Incident recording rule

When environment friction materially delays work or risks repeated failure, record:

SYMPTOM -> EXECUTION LAYER -> ROOT CAUSE -> FALLBACK -> PREVENTION -> MACHINE-CHECKABLE GATE

Do not merely record network failed.

## Stop conditions

Stop before implementation when:

- no trustworthy repository state is available;
- next-stage tests cannot run and no authoritative CI/provider substitute exists;
- filesystem writes would occur in an unknown directory;
- auth/transport state is ambiguous for a destructive action;
- the only available path would require force push, history rewrite, or production mutation;
- the environment repeatedly fails the same route without a changed condition.

## Completion output

For environment-gated work report:

ENVIRONMENT STATUS:
EXECUTION ROUTE:
CHECKOUT:
GIT TRANSPORT:
GITHUB PROVIDER:
PROXY:
AUTH:
TOOLCHAIN:
TEST CAPABILITY:
REMOTE WRITES:
BLOCKERS:
HUMAN ACTION:
SAFE TO CONTINUE:
