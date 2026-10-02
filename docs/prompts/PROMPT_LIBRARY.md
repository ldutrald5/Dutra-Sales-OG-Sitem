# DUTRA Prompt Library

Prompts are versioned tools, not canonical facts. Current code/contracts and validated knowledge outrank prompt text.

| ID | Name | Status | Purpose |
|---|---|---|---|
| PRM-SALES-EXEC-001 | Sales Execution Sprint | ACTIVE | design/extend list → session → call → decision maker → meeting workflow |
| PRM-SYSTEM-COMPLETE-001 | Complete DUTRA OS plan | SUPERSEDED | historical broad implementation plan; current roadmap/context is authoritative |
| PRM-V3-REINTEGRATION-001 | V3 + legacy reintegration | SUPERSEDED/PARTIAL | historical migration reasoning; current `main` is canonical |
| PRM-VISUAL-001 | Premium visual mockups | EXPERIMENTAL | UX exploration only; never technical evidence |
| PRM-INTEL-COMPILER-001 | Intelligence Compiler | ACTIVE | turn durable history into routed knowledge/skills/tests without model-weight claims |

## PRM-SALES-EXEC-001

**When to use:** structural Sales Execution work.

**Core instruction:** audit existing CRM/contracts first; do not create parallel company/list stores. Optimize for LIST → SESSION → CALL → CONFIRMED RESULT → NEXT ACTION, with stage-aware Call AI and human-confirmed external outcomes.

**Dependencies:** Sales Execution contract, current CRM/domain services, sales playbooks, tests.

**Output:** bounded implementation plan/code/test changes.

## PRM-INTEL-COMPILER-001

**When to use:** after a recovered conversation, architecture decision, incident, commercial learning or knowledge import.

**Process:** AUDIT → CLASSIFY → VALIDATE → DEDUPLICATE → ROUTE → RECORD PROVENANCE → UPDATE SKILL/CONTEXT IF NEEDED → ADD REGRESSION TEST IF MACHINE-CHECKABLE → REFRESH BRAIN.

**Rules:** do not create a parallel knowledge store; do not freeze dynamic CRM data; do not store secrets; do not claim model training.

## Historical prompts

Historical broad prompts remain useful as source evidence, but they do not override current `DUTRA_OS_CONTEXT.md`, `EXECUTION_CONTEXT.md`, tested code or active Second Brain decisions.
