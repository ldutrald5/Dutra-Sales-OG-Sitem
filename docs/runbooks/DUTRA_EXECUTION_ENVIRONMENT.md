# DUTRA Execution Environment Recovery Runbook

Use this runbook when Codex/CLI reports no checkout, failed Git transport, proxy failure or ambiguous authentication.

## Goal

Restore a trustworthy worktree without changing protected branches or production.

## Fast path

### 1. Prefer a fresh repository-attached workspace

If the current cloud workspace has no repository checkout, start a new coding session/workspace with the GitHub repository explicitly attached/cloned.

Repository:

ldutrald5/Dutra-Sales-OG-Sitem

Target branch:

integration/dutra-os-one-system

This is preferred over repairing an opaque platform-managed proxy.

### 2. Verify locally

Run:

pwd

git rev-parse --show-toplevel

git status --short --branch

git remote -v

git rev-parse HEAD

Expected branch:

integration/dutra-os-one-system

Do not continue if the worktree contains unknown local changes.

### 3. If Git transport fails, inspect proxy before auth

Do not print tokens.

Inspect whether these are configured:

HTTP_PROXY
HTTPS_PROXY
ALL_PROXY
NO_PROXY

and lowercase equivalents.

Inspect Git proxy origin:

git config --show-origin --get-regexp 'http\..*proxy|https\..*proxy|http\.proxy|https\.proxy'

If the error is connection refused / unable to connect to proxy:8080, treat it as transport failure.

Do not conclude GH_TOKEN is invalid until GitHub is reachable.

### 4. Only change proxy config when you control it

If proxy variables are platform-managed, replace/restart the coding workspace instead of deleting unknown platform settings.

If this is your own local PC and you know no proxy should be used, remove only the stale configuration you own, then open a new terminal/session and retest.

Do not paste credentials into chat or commit them.

### 5. Verify provider reachability

After transport is repaired:

git ls-remote https://github.com/ldutrald5/Dutra-Sales-OG-Sitem.git HEAD

Then fetch:

git fetch --all --tags

Switch to the convergence branch:

git switch integration/dutra-os-one-system

If the branch is not present locally:

git switch --track origin/integration/dutra-os-one-system

### 6. Confirm the protected references

Verify remote refs before work:

main
dutra-os-ui-v3-premium
supabase-00s-recovery-snapshot
supabase-00s-canonical-history
integration/dutra-os-one-system

Do not rebase, force push or rewrite #109/#110.

### 7. Run environment gate

Read:

.codex/skills/dutra-environment-guardian/SKILL.md

Then verify Node/npm and the task-specific tools.

### 8. Run baseline before Stage 1

At minimum, use the commands actually present in package.json. For CONVERGENCE-01, expected baseline includes:

npm ci
npm run og:check
npm test
npm run og:brain:check

Run Supabase replay/parity gates when the local environment supports them or through the dedicated authoritative CI workflow.

Package 00R braces/AIOX advisory remains separate. Do not use npm audit fix --force.

## Rule against retry loops

If the same Git/proxy command fails twice without any changed condition, stop retrying. Switch environment or route.

## Escalation output

If still blocked, report exactly:

CHECKOUT:
REPOSITORY_PATH:
GIT_TRANSPORT:
PROXY:
AUTH:
GITHUB_PROVIDER:
NODE/NPM:
REQUIRED_CLI:
TEST_CAPABILITY:
EXACT_ERROR:
WHAT_CHANGED_SINCE_LAST_ATTEMPT:
SAFE_TO_CONTINUE:
