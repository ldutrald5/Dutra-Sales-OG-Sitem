# DUTRA INTELLIGENCE IMPLEMENTATION REPORT

Original implementation branch: `feat/dutra-intelligence-compiler-v1`
Initial audited base: `f4c2b3c68d747b6477410ffff50521d8788f8d62`.
Merge: **PR #104 → main as `72354a1f04d6fdd5584fe876ec4b09bb050a312a`**.
Validation: **PR CI and post-merge main CI passed on Node 24**.
Railway: the live application was checked after merge and still served the earlier runtime SHA `f4c2b3c68d747b6477410ffff50521d8788f8d62`; this knowledge package did not force a production redeploy because it changed agent/docs/tests, not customer runtime behavior.

## 1. O QUE FOI ANALISADO

- current `main`, AGENTS, canonical context, execution context and manifest;
- Builder Brain/Second Brain schema, records, generator/checker/metrics;
- runtime/domain services including knowledge selector, account knowledge and command core;
- Sales Execution contract, current tests/package scripts and current Call Intelligence/Whisper line;
- recovered conversation/master handoff as historical evidence;
- root `knowledge/` commercial/product templates.

## 2. INTELIGÊNCIA EXTRAÍDA

- truth precedence and conflict handling;
- stable vs dynamic knowledge boundary;
- one canonical CRM / lists as operational collections;
- stage-aware sales guidance;
- technical uncertainty → validation state, never invented mapping;
- automation with manual escape;
- bug → root cause → prevention → regression;
- minimal context routing;
- current main supersedes historical V3 branch assumptions.

## 3. SKILLS CRIADAS

`dutra-core`, `dutra-dev`, `dutra-sales`, `dutra-crm`, `dutra-og-tech`, `dutra-fleet`, `dutra-product`, `dutra-qa-guardian`.

## 4. SKILLS ATUALIZADAS

`dutra-builder-brain` now routes recovered operational knowledge through the context router/domain skills and supports durable incidents.

## 5. CONTEXTOS CRIADOS

- `docs/second-brain/CONTEXT_ROUTER.md`;
- `docs/second-brain/KNOWLEDGE_SCHEMA.md`;
- `knowledge/OG-TECH-RULES.md`;
- `knowledge/FLEET-OG.md`;
- canonical context/handoff/AGENTS updated to use the router.

## 6. PLAYBOOKS

`docs/playbooks/SALES_PLAYBOOKS.md`: Gatekeeper, Decision Maker, Meeting, Proposal/Negotiation, Follow-up and Customer/Post-sale.

## 7. ADRs

`ADR-INTELLIGENCE-COMPILER-001`: extend the existing Builder Brain instead of creating a second memory; thin Skills; dynamic account facts remain in CRM/runtime.

## 8. BUGS TRANSFORMADOS EM REGRESSÃO

Incident store now covers historical V3 first-paint, technical data load, close-rate population bug, CRM/list isolation, sync conflict, XLSX repair, Call Intelligence audio/metric defects, Whisper runtime dependency and the live Supabase versioning drift discovered during technical recovery.

## 9. ANTI-PATTERNS

Added protection against parallel knowledge memories, volatile CRM facts in global Skills, remembered deploy state as runtime truth, universal sales pitch and code/history mappings promoted to confirmed OG facts.

## 10. PROMPTS CONSOLIDADOS

`docs/prompts/PROMPT_LIBRARY.md` classifies active, superseded and experimental prompt families; Intelligence Compiler and Sales Execution remain active.

## 11. CONFLITOS ENCONTRADOS

- historical V3/agent-skills branches vs current `main`: current `main` wins for code/current behavior;
- old “Supabase is future only” framing vs current hybrid Supabase verticals: recorded as transitional hybrid, not full master-data cutover;
- CIC-03 Context Manifest feature matrix vs later implementation: manifest explicitly marked historical baseline;
- runtime code mappings vs OG physical truth: code is implementation evidence, validated OG source is required for `Confirmada OG`.

## 12. INFORMAÇÕES QUE PRECISAM DE VALIDAÇÃO HUMANA

- exact official OG source that certifies each support/equalizer/application mapping;
- which reviewed compiled playbooks/technical guardrails should be imported into the live private Knowledge Command Center;
- real Excel certification of critical exports after the historical repair incident;
- live Railway state whenever deployment/health is asked (must be checked live).

## 13. TESTES CRIADOS/ALTERADOS

- added `scripts/test_intelligence_compiler_contract.mjs`;
- added `npm run og:intelligence:test`;
- added the intelligence test to `scripts/validate.mjs`;
- Builder Brain checker/index/metrics now understand incidents.

Validation evidence:
- connector-side contract/referential-integrity checks: **PASS**;
- PR #104 Package 00R CI #404: **PASS** on Node 24;
- PR #104 Sales Execution P0 #24: **PASS**;
- PR #104 Call Intelligence V1 #22: **PASS**;
- post-merge `main` Package 00R CI #405: **PASS**.

The local execution container remained on Node 22, so local unsupported-runtime results are not used as release evidence.

## 14. ARQUIVOS ALTERADOS

See branch diff against `main`. Main groups: `.codex/skills/`, `docs/second-brain/`, `docs/playbooks/`, `docs/prompts/`, `knowledge/`, project context/handoff files, package/test wiring.

## 15. O QUE O SISTEMA PASSOU A SABER

- how to choose the smallest context for a task;
- which source has authority when history conflicts;
- how to distinguish stable project knowledge from volatile CRM state;
- how to route sales/CRM/technical/fleet/product/dev/QA work;
- how to preserve a bug as prevention instead of a one-off patch;
- why uncertain OG application must remain validation-required;
- why current main cannot be replaced by remembered historical branch status.

## 16. COMO O SISTEMA VAI USAR ESSE CONHECIMENTO

`AGENTS.md` and `AI_HANDOFF.md` now require Context Router + relevant Skill/preflight for material work. The Builder Brain stores provenance/decisions/incidents. Domain Skills load scoped docs rather than copied master history. Knowledge regression is part of `validate` on `main` and was exercised successfully by CI.

## 17. O QUE AINDA ESTÁ FORA DA BASE

- dynamic customer/opportunity/proposal/current-next-action data (correctly remains CRM/runtime);
- secrets/credentials/raw customer exports/recordings (intentionally excluded);
- unvalidated OG technical/commercial claims;
- runtime KCC ingestion of these new stable docs pending explicit review;
- old agent-skill experimental branch content not automatically ported to current main.

## 18. PRÓXIMA EVOLUÇÃO RECOMENDADA

1. Keep the Intelligence Compiler on `main` as the agent/project knowledge layer.
2. Resolve `INC-SUPABASE-DRIFT-001` before further structural backend expansion so the live Supabase project becomes reproducible from Git.
3. After explicit review, run a small KCC ingestion pilot using only stable approved sales/technical guardrails; never ingest volatile CRM facts or unvalidated OG mappings.
