# Context Manifest — Baseline 2026-09-28 / CIC-03

> **Scope note — historical baseline:** this file preserves the CIC-03 baseline. For current implemented capability/runtime direction, prefer `EXECUTION_CONTEXT.md`, current tested code on `main`, and live infrastructure evidence. Do not interpret the historical “not yet implemented” list below as a current feature matrix.

## Source of truth

- Repository: `ldutrald5/Dutra-Sales-OG-Sitem`
- Canonical code branch: `main`
- Baseline before CIC-03: `1fdafed8b60e7f3bcf0df894e0127a11dc4b7368`
- Working branch: `feat/baseline-account360-command-center-20260928`

## Required context

1. `EXECUTION_CONTEXT.md`
2. `docs/roadmap/BASELINE_2026-09-28.md`
3. `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`
4. `docs/second-brain/BRAIN_INDEX.md`
5. `docs/second-brain/CONTEXT_ROUTER.md`
6. task/story specific to the change

## Current architectural facts

- Vanilla JS/CSS/HTML frontend remains the approved V1 stack.
- Domain contracts for Company, Contact, Opportunity, Activity and Task exist additively.
- `state.leads` remains the operational compatibility layer during controlled reconciliation.
- Supabase Auth/Organization foundation exists under feature flag; remote pilot validation is still pending.
- Company 360 beta, Sync Bridge, conflict review and legacy reconciliation are implemented.
- Mission Control and Signal Center are implemented and derive from current CRM facts.
- `OG_LEAD_INTELLIGENCE` is the single deterministic score source.
- Railway HTTPS is live and the main service currently has a persistent volume mounted at `/data`.
- Proposal Tracking, Automation Engine and Territory Intelligence are not yet implemented.

## Authority of external inputs

| Source | Role | Authority |
|---|---|---|
| GitHub `main` | executable code and current behavior | canonical |
| Railway live state | current deployment/runtime evidence | authoritative for runtime state |
| attached spreadsheets/PDFs | business evidence, templates and import sources | business input; not code authority |
| external UI/CRM references | pattern/inspiration | advisory only |

## Explicit prohibitions

- no big-bang migration;
- no React/Laravel/Twenty rewrite;
- no automatic Company creation from weak legacy identity;
- no second score/queue/source of truth;
- no secret in Git/browser persistent storage;
- no silent overwrite of historical facts;
- no feature marked complete without test/gate evidence.

## CIC-03 scope

CIC-03 may refine Account 360, Command Center, documentation and tests. It must not start Proposal Tracking, Automation Engine, Territory Intelligence or activate remote Supabase auth.

## V3 reference retained during Stage 1

The following preserves V3 branch guidance as reference for later stages; current integration safety and mature runtime remain authoritative. Historical runtime observations are not live certification.

# Context Manifest — DUTRA OS 2026-10-01

## Escopo

O projeto possui duas linhas executáveis relacionadas:

1. **Core Sistema OG** — `main`, aplicação brownfield madura em `apps/sistema-og/`.
2. **Shell V3 Premium** — `dutra-os-ui-v3-premium`, experiência nova em `preview-v2/` que reutiliza o core/motores existentes.

Não confundir “core canônico atual” com “experiência V3 atual”. A estratégia é reintegração incremental, não substituição big-bang.

## Hierarquia de verdade

Use `docs/intelligence/README.md`. Resumo:

1. confirmação atual;
2. código testado;
3. documentação atual;
4. decisão vigente;
5. Second Brain;
6. relatórios de recuperação;
7. histórico antigo;
8. hipótese/ideia.

Para runtime, Railway/GitHub ao vivo vence documentação estática.

## Contexto inicial por tarefa

1. `AGENTS.md`;
2. `docs/intelligence/CONTEXT_ROUTER.md`;
3. Skill da área;
4. código/testes afetados;
5. registros específicos do `docs/second-brain/BRAIN_INDEX.md`.

Não carregar toda a base histórica.

## Fatos arquiteturais atuais

- frontend principal permanece Vanilla JS/CSS/HTML;
- `state.leads` continua camada operacional de compatibilidade;
- contratos canônicos Company/Contact/Opportunity/Activity/Task existem;
- smart views são projeções da base central, não bancos independentes;
- V3 usa bridge para ler/gravar o core sem duplicar CRM;
- connection state + IndexedDB/outbox/mutations/idempotência estão implementados; aceite manual offline/reconnect ainda é pendência P0;
- motor técnico compartilhado foi extraído para `preview-v2/technical-application-core-v3.js`; convergência total ainda está em andamento;
- proposta V3 ainda usa ponte/embedded legado; proposta totalmente nativa é pendente;
- Supabase migrations/Auth pilot existem, mas Supabase não foi validado como verdade live deste shell;
- IA de pesquisa/Call passa por Review Gate antes de gravar inferências.

## Regras de reintegração

- V3 é a experiência única;
- legado pode fornecer motor interno durante migração;
- nenhum novo score, CRM, agenda ou tabela técnica paralela;
- automação sempre preserva override/manual quando necessário;
- aplicação incerta = VALIDAR.

## Runtime

Consultar `docs/runtime/DUTRA_OS_RUNTIME.md` e `dutra-runtime-operator`.

No momento da auditoria 2026-10-01:

- core `main`: commit `f4c2b3c68d747b6477410ffff50521d8788f8d62`, Railway SUCCESS;
- V3: commit `0d3d766726c1980297553e684663d11a6bb8bced`, Railway SUCCESS.

Esses hashes são fotografia histórica; verificar live antes de afirmar estado atual.

## Proibições

- big-bang rewrite;
- React/Next rewrite sem evidência;
- segunda fonte de verdade;
- technical mapping inventado;
- force merge silencioso;
- segredo em Git/browser persistent storage;
- dado dinâmico de cliente em Skill;
- feature “concluída” sem gate/teste;
- afirmar deploy saudável apenas por memória.

## Próxima dependência técnica

1. fechar aceite manual do P0 offline/reconnect;
2. concluir motor técnico único;
3. Multi-Veículos V3;
4. proposta V3 nativa;
5. pedidos;
6. somente depois consolidar persistência/auth canônica remota.
