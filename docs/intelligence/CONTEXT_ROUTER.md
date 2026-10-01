# DUTRA Intelligence — Context Router

Objetivo: carregar o menor contexto que permita uma decisão correta.

## Regra de entrada

Sempre leia `AGENTS.md`. Para trabalho STANDARD/STRUCTURAL, consulte também `docs/second-brain/BRAIN_INDEX.md` e a linha desta tabela.

| Tarefa | Skills | Contexto primário | Complementos |
|---|---|---|---|
| visão/priorização de produto | dutra-core + dutra-product | `docs/00-VISAO-SISTEMA.md`, `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`, `docs/10-ROADMAP.md` | decisões ativas |
| bug/regressão | dutra-core + dutra-dev + dutra-qa-guardian | `docs/incidents/BUGBOOK.md`, código e testes do módulo | decisões/anti-patterns relacionados |
| arquitetura/refatoração | dutra-core + dutra-dev + dutra-minimal-change | `docs/01-ARQUITETURA.md`, `docs/architecture/DUTRA_INTELLIGENCE_DECISIONS.md` | Builder Brain |
| Railway/deploy/runtime | dutra-core + dutra-dev + dutra-runtime-operator | `docs/runtime/DUTRA_OS_RUNTIME.md` | estado live GitHub/Railway |
| CRM/Cliente 360 | dutra-core + dutra-crm | `docs/04-CRM.md`, `docs/05-MESA-DE-VENDAS.md` | Company 360 e lead intelligence |
| prospecção | dutra-core + dutra-crm + dutra-sales + dutra-prospect-intelligence | `docs/playbooks/SALES_PLAYBOOKS.md`, Sales Execution | pesquisa pública quando necessário |
| ligação/Call AI | dutra-core + dutra-sales + dutra-crm + dutra-call-intelligence | `docs/06-CALL-AI.md`, playbooks comerciais | review gate |
| gatekeeper/decisor/reunião | dutra-sales + dutra-crm | `docs/playbooks/SALES_PLAYBOOKS.md` | dados da conta no CRM |
| proposta/cotação | dutra-core + dutra-sales + dutra-crm + dutra-og-tech + dutra-quote-engine | quote/proposal services + `docs/playbooks/TECHNICAL_APPLICATION.md` | pricing e histórico do cliente |
| aplicação técnica | dutra-core + dutra-og-tech + dutra-fleet | `knowledge/TECHNICAL-RULES.md`, `knowledge/FLEET-CONTEXT.md` | motor técnico + parity tests |
| Multi-Veículos | dutra-og-tech + dutra-fleet + dutra-product | motor técnico + legado multi-veículos | quote engine |
| pós-venda/expansão | dutra-sales + dutra-crm | playbooks comerciais + histórico da conta | Signal Center/Automation |
| interface/UX | dutra-core + dutra-product | `docs/03-DESIGN-SYSTEM.md` | fluxo do domínio afetado |
| pesquisa externa | dutra-web-research + skill de domínio | questão concreta + fonte atual | não carregar CRM inteiro |
| conhecimento/decisão nova | dutra-builder-brain + dutra-core | `docs/intelligence/README.md` | coleção Second Brain apropriada |

## Contexto por tipo de dado

- Conta/contato/proposta/reunião atual: ler do CRM/runtime, nunca de Skill.
- Regra técnica: ler motor + `knowledge/TECHNICAL-RULES.md`; se conflito, código/teste vence e registrar drift.
- Estado de deploy: consultar Railway ao vivo.
- Decisão histórica: Second Brain + documento ADR/arquitetura.
- Script/playbook: `docs/playbooks/` e `knowledge/SCRIPTS.md`.
- Objeção factual: `knowledge/OBJECOES.md`; não inventar prova.

## Pre-flight obrigatório

Antes de criar ou reescrever:

1. procurar nome/função equivalente no repo;
2. procurar decisão no Second Brain;
3. procurar bug/anti-pattern;
4. localizar testes;
5. checar fonte de verdade;
6. determinar rollback;
7. carregar apenas os arquivos afetados.

Se a resposta a “já existe algo equivalente?” for desconhecida, a implementação ainda não deve começar.
