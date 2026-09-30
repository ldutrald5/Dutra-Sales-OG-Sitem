# DUTRA OS — Agent Skills Policy

Purpose: define which external agent skills/tools are useful to the DUTRA SALES OG engineering workflow without coupling production to experimental repositories.

## Core rule

Do not vendor or copy third-party source code into DUTRA OS by default. Prefer documented, optional developer tooling. Pin versions before CI/production use, review licenses, and keep production behavior independent from developer-agent tools.

## Evaluated tools

### VoiceStudio — candidate for audio workflows
Repository: debpalash/VoiceStudio
Use case for DUTRA OS: local transcription/dictation and, only with explicit permission, voice workflows for sales material. It exposes a local API/MCP and publishes agent skills.
Status: OPTIONAL / EVALUATE.
Guardrails: never clone a person's voice without permission; review AGPL-3.0 and model licenses before any commercial integration; do not make CRM core depend on it.

### video-use — candidate for marketing/video production
Repository: browser-use/video-use
Use case: agent-assisted editing of OG product, training and commercial videos.
Status: OPTIONAL / DEV-MEDIA ONLY.
Guardrails: its install guide uses ffmpeg and can use ElevenLabs for transcription; API credentials must remain in secrets, never committed. Keep outside the runtime path of the CRM.

### Obscura — candidate for controlled web automation
Repository: h4ckf0r0day/obscura
Use case: headless browsing/data extraction for prospecting research or QA in explicitly authorized public-web workflows.
Status: EXPERIMENTAL / SANDBOX ONLY.
Guardrails: respect site terms, robots/access controls, rate limits and privacy. Do not use anti-detection features to bypass access restrictions, CAPTCHAs, authentication, or platform enforcement. Do not make it the default browser layer until benchmarked against existing tools. Apache-2.0.

### Ponytail — engineering discipline reference
Repository: DietrichGebert/ponytail
Use case: reduce over-engineering by applying YAGNI/minimal-change principles to coding-agent work.
Status: ADOPT PRINCIPLES; OPTIONAL PLUGIN.
Rules for this repo:
- understand existing code before adding abstractions;
- reuse existing services/modules before creating new ones;
- prefer the smallest reversible change that satisfies a tested requirement;
- do not add dependencies without a concrete need;
- do not refactor unrelated code in feature commits;
- every new abstraction must remove real duplication/complexity or create a clear test seam;
- keep app.js shrinking rather than growing.

### APILayer / public-apis
The screenshot shows the public-apis/API discovery ecosystem, not one single capability we should install wholesale.
Use case: discovery of external APIs when DUTRA OS has a specific integration need.
Status: REFERENCE ONLY.
Rule: evaluate APIs one by one for data quality, terms, cost, privacy, SLA and necessity. Never add a generic API bundle or API key without a defined product requirement.

### fastpotify
Repository shown: crmne/fastpotify
Use case for DUTRA OS: none identified.
Status: DO NOT INTEGRATE.
Reason: Spotify client functionality is unrelated to CRM, quotation, OG technical intelligence, persistence or commercial workflow.

## Where these tools fit

Core product: CRM, Quote Engine, OG application rules, proposals, persistence, pipeline.
Developer/agent layer: Ponytail principles.
Optional media layer: VoiceStudio, video-use.
Optional research/QA sandbox: Obscura.
External API discovery: public-apis/APILayer only when a concrete integration is approved.

## Acceptance checklist for any new skill

1. A specific DUTRA OS use case exists.
2. Existing code/tooling cannot solve it more simply.
3. License and commercial-use constraints are reviewed.
4. Security/privacy impact is documented.
5. Secrets are stored outside Git.
6. Dependency is pinned/reproducible.
7. It runs outside production core unless explicitly approved.
8. There is a smoke test and rollback path.
9. No OG technical mapping is generated or inferred from the tool.
10. Production deploy requires separate approval.
