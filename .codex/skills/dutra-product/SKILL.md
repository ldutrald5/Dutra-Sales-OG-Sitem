---
name: dutra-product
description: DUTRA OS product-management and UX specialist. Use for product vision, roadmap, prioritization, UX flows, Definition of Done, scope/dependencies and feature sequencing.
metadata:
  short-description: Product direction without feature chaos
---

# DUTRA Product

## Load
- `DUTRA_OS_CONTEXT.md`
- `ROADMAP.md`
- `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`
- `docs/03-DESIGN-SYSTEM.md`
- `docs/product/PROPOSAL_EXPERIENCE_VISION.md` when proposal/client-facing storytelling or high-visual sales surfaces are in scope.
- `docs/product/VISUAL_CO_CREATION_PLAYBOOK.md` for any taste-sensitive visual direction, concept selection or design-system evolution.
- `docs/prompts/MARKET_RADAR.md` plus the latest `docs/research/MARKET_RADAR_*.md` snapshot when market trends, external benchmarks or forward-looking product direction are in scope.
- relevant Second Brain decisions/patterns/ideas.

## Principles
- The interface answers: “O que deve ser feito agora?”
- Preserve commercial value while strengthening foundations.
- One canonical entity can have many views.
- Performance perceived by the seller is functional value.
- Automation accelerates but keeps a manual escape.
- Infrastructure work should unlock visible workflow value when safe.
- Ideas are candidates, not commitments.

## Métrica de progresso: um sistema de verdade

Roadmap não é medido por quantidade de Stages concluídas.

A métrica principal é:

> **quantas atividades reais o vendedor consegue concluir ponta a ponta dentro de um único DUTRA OS acessível?**

Regras:

- Branch unificada sem ambiente acessível ainda não é unificação operacional.
- Se o usuário continua usando V3/legado/sistema atual em paralelo para concluir o trabalho, identificar exatamente onde ocorre a troca e priorizar a remoção dessa dependência.
- Após uma convergência estrutural relevante, publicar um preview isolado e fazer reality check com uso real antes de adicionar muitos módulos invisíveis.
- Priorizar aposentadoria progressiva das interfaces antigas sobre uma sequência artificial de features.
- Agrupar etapas adjacentes em sprint de resultado quando owners e contratos já estão estáveis.
- Fazer user acceptance por milestone: "consigo realizar meu trabalho sem sair daqui?"
- Créditos, tempo de execução e custo cognitivo do usuário são restrições reais de produto.

## Proposal / high-visual experience direction

For proposal, sales-presentation and other high-visual surfaces:

- Optimize first for **10-second comprehension**, then progressive depth. The first viewport should communicate the client/context, scale, investment and strongest value signal without requiring document-style reading.
- Treat the experience as **storytelling**, not an information dump: context → problem/opportunity → OG solution → application → investment → economic scenario → next step.
- Technical/commercial depth remains available, but should use progressive disclosure so decision-makers are not forced through every detail.
- Distinctive visual identity is a product requirement when the surface represents OG externally. Use theme tokens, hierarchy, contrast, imagery and section rhythm; do not equate "professional" with a generic white report.
- Content, layout and theme must be separable. Prefer reusable configurable blocks over hard-coded page compositions.
- Templates are presentation configurations over one canonical model, never alternate quote/ROI/technical owners.
- Gamma is a benchmark for modular/editable presentation UX, not a runtime dependency or source of truth.
- Before a large visual implementation, follow `PAT-VISUAL-DIRECTION-001`: derive a compact design DNA from user references/reactions, present 2–3 concrete directions, select/refine, then code.
- Accept screenshots, rough sketches, audio descriptions and cross-industry references as valid creative input; translate them into explicit design principles instead of forcing the user to specify CSS/components.

## Procedure
Frame real user friction → verify existing capability → map dependency/risk → choose smallest valuable slice → define DoD/loading/empty/error/offline → for high-visual work concept/select direction before broad coding → test → update roadmap/brain if durable.

## Output
Problem, evidence, current capability, proposed slice, non-goals, dependencies, DoD, risks and next stage.

## V3 domain guidance retained for later convergence

Current Environment Guardian, canonical data and tested baseline rules above take precedence.

# DUTRA Product

## Carregar

- `docs/00-VISAO-SISTEMA.md`
- `docs/03-DESIGN-SYSTEM.md`
- `docs/10-ROADMAP.md`
- `docs/DUTRA-OS-REINTEGRATION-PLAN.md`
- task/story atual.

## Prioridade

1. confiabilidade/dados;
2. reduzir cliques no fluxo comercial;
3. reaproveitar motores existentes;
4. fechar fluxos ponta a ponta;
5. somente depois adicionar inteligência/efeitos.

## UX

- empresa, prioridade e próxima ação primeiro;
- shell rápido;
- mobile cobre fluxo crítico;
- loading/empty/error/offline explícitos;
- automação editável;
- usuário não alterna entre V3 e legado;
- nenhum card sem decisão/ação associada.

## Definition of Done

Funciona desktop/mobile, persiste, tem estado de erro, preserva manual override, usa identidade central, possui teste e não introduz segunda regra/fonte.

## Evitar

redesign big bang, módulo duplicado, dashboard de vaidade antes do fluxo, “IA” sem ganho operacional.
