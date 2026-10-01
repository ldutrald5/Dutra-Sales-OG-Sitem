# Execution Context — DUTRA OS 2026-10-01

## Repositório

- `ldutrald5/Dutra-Sales-OG-Sitem`
- Core brownfield: branch `main`
- Shell em desenvolvimento: branch `dutra-os-ui-v3-premium`
- Stack: Vanilla JS/CSS/HTML + Node; root exige Node >=24 <25 e npm >=11.

## Estratégia

Migração incremental, reversível, sem segunda fonte de verdade.

O shell V3 deve absorver UX e fluxos enquanto reutiliza serviços/motores maduros do core. Não reconstruir o sistema por estética.

## Estado verificado em 2026-10-01

### Core Sistema OG

Railway:
- Project `Dutra Sales OG` — `02a559fd-b4a6-457a-81dd-6501a0e23bdb`;
- service `sistema-og` — `f5bf6592-1ef6-40d0-89d4-518c65fae12d`;
- branch `main`;
- commit implantado `f4c2b3c68d747b6477410ffff50521d8788f8d62`;
- deployment `def9b0c2-301b-4c83-a459-07ff29c0dda3`;
- status `SUCCESS`;
- Volume: `sistema-og-data` montado em `/data`, 500 MB, região `sfo`;
- healthcheck `/health`.

### V3 Premium

Railway:
- Project `DUTRA OS UXR-01 Preview` — `d8e7173f-b8d3-4f8a-85e7-33c93d627774`;
- service `dutra-os-v3-premium` — `21988cd9-4073-4b72-b88f-040115faefe2`;
- branch `dutra-os-ui-v3-premium`;
- root `/preview-v2`;
- commit implantado `0d3d766726c1980297553e684663d11a6bb8bced`;
- deployment `1257e35e-c25a-4b0f-acf4-19d5202ba5c7`;
- status `SUCCESS`;
- healthcheck `/health`;
- core alvo via `OG_CORE_BASE_URL`.

Fotografia somente. Para operação atual use Runtime Operator.

## Estado do produto

Implementado/estável em boa parte:
- fila inteligente, Next Best Action, Account/Company 360 no core;
- listas/sessões/Call Mode V3;
- connection state, outbox, mutation queue e review de conflito;
- Call AI/research com Review Gate;
- proposta tracking/automation no core;
- aplicação V3 assistida/manual e parity tests;
- smart CRM views reintegradas.

Transicional:
- `state.leads` x domínio canônico;
- V3 x legado embedded;
- motor técnico compartilhado x fallback restante;
- auth PIN x Supabase Auth pilot.

Pendente crítico:
- aceite manual offline/reconnect;
- motor técnico único completo;
- Multi-Veículos V3;
- proposta V3 nativa;
- pedido/pós-venda contínuo;
- validação real Supabase/Auth/RLS antes de torná-lo fonte canônica.

## Pre-flight

Para nova tarefa:
1. `AGENTS.md`;
2. `docs/intelligence/CONTEXT_ROUTER.md`;
3. Skill da área;
4. Second Brain relevante;
5. BUGBOOK;
6. código/testes afetados.

Não usar este arquivo como prova de estado live.
