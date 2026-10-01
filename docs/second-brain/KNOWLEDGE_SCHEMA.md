# DUTRA Knowledge Record Mapping

The Intelligence Compiler adapts the requested knowledge-card fields to the existing Builder Brain schema instead of duplicating every record into a second format.

| Requested concept | Builder Brain representation |
|---|---|
| ID | `id` |
| Título | `title` |
| Categoria / subcategoria | `tags` + `project_scope`; add explicit `category`/`subcategory` only when retrieval needs it |
| Tipo | collection + `type` |
| Origem | `source_ids`, source record `origin`/`source_kind` |
| Status | `status` |
| Confiança | `confidence` |
| Data / recência | `created_at`, `updated_at` |
| Escopo | `project_scope` |
| Dependências | `derived_from` plus referenced active decisions/contracts |
| Regra | `statement` and type-specific fields |
| Exceções | `notes`, `what_changes_this`, playbook/technical context when needed |
| Teste / validação | incident `regression_test`, experiment result, implementation/source evidence |
| Observações | `notes` or type-specific rationale/evidence fields |

## Type routing

- FACT / DOMAIN_KNOWLEDGE → `knowledge.jsonl`
- RULE / HEURISTIC / PROCEDURE / WORKFLOW → `patterns.jsonl` or scoped playbook/context
- DECISION → `decisions.jsonl` + ADR for structural decisions
- BUG / BUG_FIX → `incidents.jsonl`
- ANTI_PATTERN → `anti-patterns.jsonl`
- STRATEGY / PLAYBOOK → `docs/playbooks/` plus supporting pattern/knowledge record when durable
- PROMPT → `docs/prompts/PROMPT_LIBRARY.md`; source/decision record only if architecturally material
- TEST → code under `scripts/test_*.mjs` and linked incident/decision
- ASSUMPTION / PENDING → `open-questions.jsonl` or idea/experiment depending on intent
- DEPRECATED → retain record and use `status: deprecated|superseded` + `supersedes` lineage
- EXPERIMENT → `experiments.jsonl`

## Conflict rule

Never rewrite a lower-authority historical record to make it look current. Add newer evidence/decision and use status/supersession or an explicit scoped note.

## Confidence

Builder Brain uses `high | medium | low`. Interpret:

- `high` ≈ CONFIRMED/HIGH when supported by tested code, validated evidence or explicit current decision;
- `medium` ≈ MEDIUM/UNVERIFIED historical evidence that is useful but not current authority;
- `low` ≈ LOW/experimental hypothesis.

Use status and source provenance together; confidence alone never promotes a claim to technical truth.
