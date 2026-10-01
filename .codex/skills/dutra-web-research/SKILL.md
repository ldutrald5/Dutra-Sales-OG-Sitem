---
name: dutra-web-research
description: Conduct controlled public-web research for DUTRA OS prospecting and QA, with Obscura as an optional sandbox engine.
---
# DUTRA Web Research

Optional external engine: h4ckf0r0day/obscura (Apache-2.0).

Use for authorized public-web research, repeatable QA and prospecting enrichment when the existing browser/search stack is insufficient.
Respect site terms, access controls, robots/rate limits where applicable, and privacy/data-minimization rules.
Do not use stealth/anti-detection capabilities to bypass CAPTCHAs, authentication, blocks, paywalls or platform enforcement.
Do not collect sensitive personal data for prospecting.
Store only business-relevant sourced facts and provenance needed by the CRM.

Workflow:
research question -> allowed sources -> rate-limited collection -> normalize -> source/provenance -> human/logic validation -> CRM suggestion/import.
