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

## V3 reference retained during Stage 1

The following preserves V3 branch guidance as reference for later stages; current integration safety and mature runtime remain authoritative. Historical runtime observations are not live certification.

# DUTRA OS — Prompt Library

Prompts históricos são preservados somente quando ainda agregam valor. O objetivo é reduzir prompts gigantes por meio de Skills + Context Router.


## PROMPT-ARCHITECT-001 — DUTRA Prompt Architect

**STATUS:** SYSTEMIZED / ACTIVE VIA SKILL<br>
**VERSÃO:** 1.0<br>
**FINALIDADE:** converter uma intenção natural em missão L0–L3 com contexto mínimo, escopo, guardrails, critérios de aceite e testes.<br>
**QUANDO USAR:** antes de delegar feature, bug, refactor, UX, arquitetura, integração ou planejamento que ainda esteja ambíguo.<br>
**MECANISMO:** `.codex/skills/dutra-prompt-architect/SKILL.md` + Context Router + referências em `docs/prompts/architect/`.<br>
**DEPENDÊNCIAS:** Skill de domínio correspondente; Builder Brain/BUGBOOK/ADR somente quando alterarem a decisão.<br>
**SAÍDA:** Execution Prompt + Context Manifest + lacunas/validações necessárias.

**Regra:** não reenviar a Base Mestra nem definições estáticas AIOX; referenciar fontes e deixar `SubagentPromptBuilder` empacotar agent/task/checklists quando aplicável.

## PROMPT-SALES-EXEC-001 — Sales Execution Sprint

**STATUS:** ACTIVE AS SPECIFICATION / prefer Skills for execution<br>
**VERSÃO:** 1.0<br>
**FINALIDADE:** implementar estação operacional de prospecção sem recriar o brownfield.<br>
**QUANDO USAR:** mudanças estruturais em listas, sessões, Call Mode, reuniões, next action e métricas.<br>
**ENTRADAS:** estado atual do CRM, stack, schema, fluxos existentes.<br>
**SAÍDA:** auditoria → mudança incremental → testes de aceitação.<br>
**DEPENDÊNCIAS:** dutra-core, dutra-dev, dutra-crm, dutra-sales.

**Núcleo preservado:**

```text
NÃO recrie o projeto do zero.
Audite primeiro estrutura, banco, rotas, APIs e funcionalidades.

Fluxo:
IMPORTAR LISTA
→ organizar/enriquecer
→ selecionar lista
→ definir meta
→ iniciar sessão
→ briefing
→ ligar
→ identificar interlocutor
→ registrar resultado
→ encontrar decisor
→ qualificar
→ marcar reunião
→ salvar automaticamente
→ próximo contato.

Princípio:
o vendedor deve gastar tempo conversando com clientes, não administrando o CRM.
```

## PROMPT-REINTEGRATION-001 — V3 + legado

**STATUS:** ACTIVE AS ARCHITECTURAL SPECIFICATION<br>
**VERSÃO:** 1.0<br>
**FINALIDADE:** impedir que UI nova descarte motores maduros.<br>
**QUANDO USAR:** migração de módulo legado para V3.<br>
**SAÍDA:** shell V3 + serviço compartilhado + migração incremental.

**Núcleo:**

```text
Não abrir um sistema para trabalhar e outro para concluir.
V3 é o shell único.
Legado pode fornecer motor interno durante a migração.
Extrair dados/serviço/domínio antes de reescrever.
Eliminar iframe/ponte quando o módulo V3 nativo estiver pronto.
```

Referência canônica: `docs/DUTRA-OS-REINTEGRATION-PLAN.md`.

## PROMPT-RECOVERY-001 — Conversation Recovery Audit

**STATUS:** ACTIVE FOR ARCHIVAL<br>
**VERSÃO:** 1.0<br>
**FINALIDADE:** encerrar chats longos sem perder decisões, bugs, pendências, clientes e estado técnico.<br>
**QUANDO USAR:** antes de apagar/arquivar conversa relevante.<br>
**SAÍDA:** relatório mestre + technical handoff + bloco de migração.<br>
**REGRA:** não inventar; marcar NÃO DEFINIDO; distinguir estado conhecido de estado live.

## PROMPT-INT-COMPILER-001 — Intelligence Compiler

**STATUS:** SUPERSEDED BY SYSTEMIZED WORKFLOW<br>
**VERSÃO:** 1.0<br>
**FINALIDADE ORIGINAL:** transformar histórico em Skills/contexto/regras/playbooks/testes.<br>
**SUBSTITUÍDO POR:** `docs/intelligence/README.md`, Context Router, Builder Brain, novas Skills, BUGBOOK e knowledge regression test.<br>
**USO FUTURO:** não reenviar o prompt inteiro; solicitar “rode o DUTRA Intelligence pre-flight/compiler para este material”.

## Regras da biblioteca

- não duplicar prompt que uma Skill já resolve;
- prompts não armazenam segredos;
- dados de cliente entram como input runtime, não no prompt global;
- quando um prompt vira processo permanente, migrar para Skill/procedimento e marcar como superseded.


## Compatibilidade

O arquivo `docs/prompts/PROMPT-MESTRE-EVOLUCAO-SISTEMA-OG.md` permanece como **Prompt Mestre legado/compatibilidade**. Para trabalho novo, preferir `dutra-prompt-architect`, que escolhe nível, contexto e contrato de execução de forma proporcional.
