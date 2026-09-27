---
name: dutra-runtime-operator
description: Live runtime operator for DUTRA OS / Sistema OG. Use whenever the user asks to access the live system, open it on mobile, get the current URL, deploy/redeploy, inspect Railway status, services, domains, variables, logs, health, outages, or hosted runtime behavior. Always verify live state with connected infrastructure tools instead of relying only on memory or old docs.
metadata:
  short-description: Verify and operate the live DUTRA OS runtime safely
---

# DUTRA Runtime Operator

Operational skill for the hosted DUTRA OS / Sistema OG.

This skill exists so the agent does not answer runtime questions from stale memory. It turns "access the system", "open on mobile", "what is the current link?", "deploy", "status", "logs", "domain" and similar requests into live infrastructure checks.

## Activation triggers

Use this skill when the request concerns any of the following:

- current production/staging URL;
- mobile access to the hosted system;
- Railway project/service/environment;
- deployment, redeploy, rollback or release status;
- build/deploy/runtime logs;
- public/custom domain;
- health check or outage;
- hosted environment variables;
- start command, port, runtime configuration;
- confirming whether a GitHub commit is deployed;
- diagnosing "works locally but not online";
- publishing a repository change to the live environment.

## Required context

1. Read `AGENTS.md`.
2. Read `docs/runtime/DUTRA_OS_RUNTIME.md`.
3. If source behavior matters, inspect the exact GitHub files/commit involved.
4. Query the live infrastructure provider before claiming current status.

The runtime manifest contains locators and contracts. It is not sufficient evidence that the deployment is healthy right now.

## Tool routing

Prefer the connected providers:

- **Railway**: projects, services, deployments, domains, logs, health, variables, metrics, redeploys and infrastructure changes.
- **GitHub**: repository, branch, commits, files and deployed source verification.

Do not substitute generic web search for connected private/account-specific infrastructure when the connector is available.

## Read vs write behavior

Read-only operations such as checking status, URL, logs, domains or service config may be performed directly when requested.

A deploy, redeploy, variable change, domain change, rollback or infrastructure mutation is a write action. Perform it only when the user's request clearly authorizes that action.

After a write:
1. verify deployment status;
2. inspect logs if it fails;
3. verify health;
4. verify the public domain;
5. report what changed and any remaining risk.

## Mobile access workflow

When the user asks to access the system from a phone:

1. inspect the runtime manifest;
2. verify Railway deployment is healthy;
3. verify the active service domain;
4. return the HTTPS app URL;
5. if authentication is required, explain that the runtime access code is stored as an environment secret and must never be committed to Git;
6. never print a secret unless the user explicitly asks for that secret and the tool/session policy permits it.

The system should not require the user's PC or same Wi-Fi when the hosted runtime is healthy.

## Source-to-runtime verification

Do not assume `main` is live merely because the service points at the repository.

When material:
- read the latest deployment commit hash;
- compare it with the intended GitHub branch/commit;
- report drift explicitly.

## Health standard

A runtime is considered verified only when:
- latest intended deployment is successful;
- service is reachable through the active public domain;
- configured health endpoint succeeds;
- no immediate crash loop is visible in runtime logs.

If any of these fail, say the runtime is not verified and diagnose the first failing layer.

## Persistence warning

Hosted process health does not prove durable data storage.

Before telling the user that cloud data is safely persistent, verify the actual persistence layer/volume/database. If the service has no durable volume/database attached, treat filesystem-backed data as ephemeral.

## Secrets rule

Never store secret values in:
- GitHub files;
- skill files;
- AGENTS.md;
- docs/second-brain;
- runtime manifests;
- commit messages.

Store only secret variable **names** and where they are managed.

## Current project locator

The canonical current locators are documented in:

`docs/runtime/DUTRA_OS_RUNTIME.md`

If Railway identifiers or domain change, update that manifest after verification.
