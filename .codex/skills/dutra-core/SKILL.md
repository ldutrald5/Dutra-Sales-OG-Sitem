---
name: dutra-core
description: Cross-cutting DUTRA OS context router. Use for tasks that touch project purpose, principles, truth precedence, source-of-truth boundaries, or more than one domain. Load minimal context and route to specialized DUTRA skills.
metadata:
  short-description: Core rules + context routing for DUTRA OS
---

# DUTRA Core

## When to use
Use when a task spans domains, when task ownership is unclear, or before a structural change.

## Load
1. `DUTRA_OS_CONTEXT.md`
2. `EXECUTION_CONTEXT.md`
3. `docs/second-brain/CONTEXT_ROUTER.md`
4. only the specialized Skill/docs selected by the router.

## Core rules
- Current persisted facts and validated OG evidence outrank history.
- GitHub `main` is canonical code unless a newer explicitly approved baseline says otherwise.
- Do not create a second CRM, score, queue, rule engine or knowledge store.
- Stable knowledge may enter Skills/Second Brain; volatile account facts stay in CRM/runtime.
- AI proposes over structured truth; important writes/reality claims require controlled confirmation.
- No big-bang rewrite.
- No secrets in repo knowledge.

## Output
State the source-of-truth used, selected domain route, conflicts/unknowns, and smallest safe next action.

## Ask for validation when
Evidence conflicts, technical OG data is not confirmed, a destructive migration is proposed, or live runtime state is required but not verified.

## V3 domain guidance retained for later convergence

Current Environment Guardian, canonical data and tested baseline rules above take precedence.

# DUTRA Core

## Quando usar

Use como base para tarefas STANDARD/STRUCTURAL do DUTRA OS. Não é necessário carregar toda a documentação.

## Carregar

1. `docs/intelligence/README.md`
2. `docs/intelligence/CONTEXT_ROUTER.md`
3. `docs/second-brain/BRAIN_INDEX.md` somente para decisões/itens relacionados à tarefa.

## Regras

- audite antes de criar;
- V3 é a experiência única; legado pode ser motor interno temporário;
- CRM/Company é a identidade central; listas são coleções;
- automação sugere e sempre preserva saída manual quando o negócio exige exceção;
- IA não transforma inferência em fato sem revisão;
- aplicação técnica incerta = VALIDAR;
- runtime live precisa ser consultado, não lembrado;
- dados dinâmicos de cliente não pertencem a esta Skill;
- nenhum segredo entra em Git/Skills/docs.

## Saída esperada

Ação pequena, rastreável, reutilizando o que existe, com fonte de verdade e teste/validação apropriados.

## Pedir validação quando

A fonte de verdade estiver ambígua, regra comercial/técnica não tiver evidência, migração for destrutiva ou houver conflito com decisão ativa.
