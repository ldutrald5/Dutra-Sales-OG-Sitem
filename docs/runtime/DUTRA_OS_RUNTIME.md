# DUTRA OS — Runtime hospedado

> Manifesto operacional. Este arquivo contém apenas localizadores e contratos não secretos. Estado atual deve ser confirmado no Railway antes de ser tratado como verdade operacional.

## Repositório

- GitHub: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch de produção atual: `main`
- Aplicação: `apps/sistema-og/`
- Start hospedado: `npm start`
- Script hospedado: `scripts/start-og-hosted.mjs`

## Railway

- Workspace: `Lucas Dutra's Projects`
- Projeto: `Dutra Sales OG`
- Project ID: `02a559fd-b4a6-457a-81dd-6501a0e23bdb`
- Environment: `production`
- Environment ID: `976ea20f-7cac-4d48-83c5-1ccffb1cd7f9`
- Service: `sistema-og`
- Service ID: `f5bf6592-1ef6-40d0-89d4-518c65fae12d`

## Endereços

- Aplicação: `https://sistema-og-production.up.railway.app`
- Página auxiliar de acesso móvel: `https://sistema-og-production.up.railway.app/celular`
- Health endpoint: `/health`

Verificação operacional mais recente (2026-09-27):
- deployment `ea0134ea-d6fa-46f4-adea-5db0b4c3b53a`;
- commit `9873644423a7f6bc204240dac3b4bb40d533fd4c`;
- status `SUCCESS`;
- 1/1 replica rodando;
- healthcheck `/health` concluído com sucesso;
- domínio ligado ao serviço.

Mesmo assim, antes de responder sobre estado atual em conversas futuras, consultar Railway novamente.

## Runtime

- Start command no Railway: `npm start`
- Porta esperada no ambiente atual: variável `PORT`
- Host hospedado: definido pelo launcher para `0.0.0.0`
- Health path: `/health`

## Autenticação de acesso

O servidor hospedado exige um código/token de acesso para rotas protegidas.

- Nome da variável secreta: `OG_ACCESS_TOKEN`
- Compatibilidade interna: o launcher converte para `OG_LOCAL_ACCESS_TOKEN`
- O valor **não deve ser salvo neste repositório**.

O valor deve permanecer no gerenciador de variáveis do Railway ou outro cofre de segredos aprovado.

## Persistência — atenção

Na verificação de 2026-09-27, o serviço Railway continuava **sem volume persistente anexado**.

O launcher usa `RAILWAY_VOLUME_MOUNT_PATH` quando existe e, caso contrário, cai em `/data/sistema-og`. Sem volume/database durável confirmado, não tratar o filesystem do container como armazenamento definitivo de CRM.

Antes de migrar operação comercial real para a instância hospedada, verificar e implementar persistência durável conforme a arquitetura aprovada.

## Regra para agentes

Para qualquer pergunta sobre "sistema online", "celular", "deploy", "status", "domínio", "logs" ou "Railway":

1. ativar `dutra-runtime-operator`;
2. ler este manifesto;
3. consultar Railway ao vivo;
4. consultar GitHub quando houver dúvida de versão/commit;
5. só então responder ou executar mudança autorizada.

Nunca confiar apenas em uma URL lembrada de conversa anterior.

## V3 historical reference imported during Stage 1

These observations are historical locators, not current runtime certification. Stage 1 does not authorize deployment or backend activation.

# DUTRA OS — Runtime hospedado

> Manifesto de localizadores não secretos. **Sempre consultar Railway/GitHub ao vivo antes de afirmar status atual.**

## Repositório

- GitHub: `ldutrald5/Dutra-Sales-OG-Sitem`
- Core: branch `main`, aplicação `apps/sistema-og/`
- Shell V3: branch `dutra-os-ui-v3-premium`, aplicação `preview-v2/`

## Runtime A — Core Sistema OG

Railway:
- Project: `Dutra Sales OG`
- Project ID: `02a559fd-b4a6-457a-81dd-6501a0e23bdb`
- Environment: `production`
- Environment ID: `976ea20f-7cac-4d48-83c5-1ccffb1cd7f9`
- Service: `sistema-og`
- Service ID: `f5bf6592-1ef6-40d0-89d4-518c65fae12d`
- URL: `https://sistema-og-production.up.railway.app`
- Health: `/health`
- Start: `npm start`
- Builder atual: Dockerfile `Dockerfile.whisper`
- Region: `sfo`
- volume verificado: `/data`

Última verificação desta atualização (2026-10-01):
- deployment `def9b0c2-301b-4c83-a459-07ff29c0dda3`;
- commit `f4c2b3c68d747b6477410ffff50521d8788f8d62`;
- status `SUCCESS`.

## Runtime B — V3 Premium

Railway:
- Project: `DUTRA OS UXR-01 Preview`
- Project ID: `d8e7173f-b8d3-4f8a-85e7-33c93d627774`
- Environment: `production`
- Environment ID: `e5b1fd77-0460-431c-b886-7be134a5c5f3`
- Service: `dutra-os-v3-premium`
- Service ID: `21988cd9-4073-4b72-b88f-040115faefe2`
- URL: `https://dutra-os-v3-premium-production.up.railway.app`
- branch: `dutra-os-ui-v3-premium`
- rootDirectory: `/preview-v2`
- builder: Railpack
- start: `npm start`
- health: `/health`
- region: `us-east4-eqdc4a`
- variável de ponte: `OG_CORE_BASE_URL`

Última verificação desta atualização:
- deployment `1257e35e-c25a-4b0f-acf4-19d5202ba5c7`;
- commit `0d3d766726c1980297553e684663d11a6bb8bced`;
- status `SUCCESS`;
- core health retornou 200 no boot.

## V2 checkpoint

- service: `dutra-os-v2-preview-clean`
- ID: `74122e61-97d3-4138-bf70-7b7272bc6df7`
- URL: `https://dutra-os-v2-preview-clean-production.up.railway.app`

Não modificar salvo pedido explícito.

## Autenticação e segredos

Core usa segredos gerenciados no Railway. Nomes relevantes incluem `OG_ACCESS_TOKEN` e integrações específicas do runtime.

V3 usa o mesmo código de acesso do core via bridge e mantém o código somente em `sessionStorage`.

Nunca registrar valores secretos neste arquivo, Git, Skills ou Second Brain.

## Persistência

Core: volume `/data` foi verificado no Railway em 2026-10-01.

V3: não é fonte de dados independente; lê/grava o core por proxy/bridge e mantém cache/outbox local no navegador.

Supabase/Auth permanece direção canônica futura/piloto, não deve ser assumido como backend live da V3 sem validação.

## Regra para agentes

Para “sistema online”, “celular”, “deploy”, “status”, “domínio”, “logs”, “variáveis”, “Railway”:

1. ativar `dutra-runtime-operator`;
2. usar este arquivo somente como localizador;
3. consultar Railway ao vivo;
4. consultar GitHub para commit/branch;
5. reportar drift;
6. após write, verificar deploy + health + logs.

Nunca confiar apenas em hash/URL lembrados de conversa.


## Stage 6.5 — Unified Preview / Reality Check (2026-10-07)

STATUS: COMPLETE — recovery REUSE EXISTING UXR PREVIEW authorized by QG to avoid the Free plan fourth-service provisioning limit. No upgrade, new project, service or volume.

- Project: DUTRA OS UXR-01 Preview (`d8e7173f-b8d3-4f8a-85e7-33c93d627774`); environment production (`e5b1fd77-0460-431c-b886-7be134a5c5f3`). This is the preview project, not official production.
- Reused service: `dutra-os-uxr01-preview` (`b385d7a3-616c-4c44-82c7-7c9541ba7c45`), now the Unified Preview. Existing technical name/domain retained; former UXR source consciously replaced.
- Source: `ldutrald5/Dutra-Sales-OG-Sitem`, branch `integration/dutra-os-one-system`, pinned deployed SHA `85e17dffd04f2f1f16eab1714344778bb60a3422`. Pin prevents subsequent documentation pushes from implicitly deploying a different commit; reconnect source deliberately for later authorized releases.
- Deployment: `639a9b9b-0758-4af2-bd6e-2c8e057a8c9d`, SUCCESS. RAILPACK, repository root `/`, `npm start`, health `/health`.
- URL: https://dutra-os-uxr01-preview-production.up.railway.app
- HTTP application and health: 200; health `ok=true`. Release field is null; deployed SHA is verified through Railway deployment metadata, not inferred from health.
- Isolation: no attached volume, database migration, production credentials or seed copied. Only pre-existing preview OG_ACCESS_PIN / OG_ACCESS_TOKEN / OG_DATA_DIR remain. Filesystem persistence is EPHEMERAL; use disposable test data, not the only copy of customer records.
- Browser smoke on the live domain: 390x844 and 1440x900 PASS. Meu Dia, Prospecção, Call AI UI, Aplicação Técnica (`guia`) and existing Cotação navigate inside one shell; one visible workspace, zero horizontal overflow and zero page/bootstrap errors. Access-code prompt displayed. No mandatory navigation to historical V3.
- Scope of smoke: prompt dismissed without changing credentials; authenticated persistence/commercial writes and remote AI/provider workflows were NOT tested. Existing preview access code is required for protected APIs. Call AI/Whisper, Prospect Search and remote Sales Execution credentials were not copied; their remote capabilities may be unavailable and are not certified by UI smoke.
- Preservation confirmed live: V2 deployment `267a08bc-0e1f-4fd3-8674-2e35f41fba1a`, V3 `0d869744-565e-42a7-be53-f21d9007e868`, official production `def9b0c2-301b-4c83-a459-07ff29c0dda3` and its `/data` volume unchanged. Main and protected Git branches untouched. No application code changes.
- Runtime rollback: prior UXR source `uxr-01-mobile-simplification`, deployment `75ffd707-2287-4d84-bde4-a038a4f53745`, SHA `417d4fab88bf18e561559a62570f2404f0dab973`; retained as historical locator, no rollback executed.
- Reality check for Lucas: Meu Dia → Cliente → Prospecção → Registrar resultado → Call AI → Follow-up → Aplicação Técnica → Cotação existente. Ask: “Em qual momento eu ainda preciso sair deste sistema?” Record mandatory exits as prioritized backlog, without implementing Stage 7.

NEXT: STOP. Stage 7 requires fresh QG authorization.


## Stage 6.6 — Synthetic reality check (2026-10-07)

ENTRY_SHA: `8325f5cf6c2f0104138106f3025a0708ca06c069`.
STATUS: LOCAL VALIDATION PASS; hosted publication/acceptance pending below.

Reuses `applyHostedSeed` / `OG_STATE_SEED_GZIP_B64`, idempotent canonical merge, existing `state.leads` and durable sync/outbox. Fixture `scripts/fixtures/isolated-preview-seed.json` contains only DEMO-DUTRA-CLIENT / DEMO-DUTRA-PROSPECT, synthetic company/contact/context, no telephone/CNPJ/email or production data. No separate CRM, score, agenda, history, sync or demo engine. Existing guarded technical client change carries canonical identity from the sales card and client sheet; no unsaved draft overwritten without the existing confirmation.

`OG_ISOLATED_PREVIEW=true` is an explicit service-only switch. Public no-store runtime metadata contains no data/secrets; SW never caches it. Preview status annotates actual sync mode (never forces OK), preserving visible failures/offline/conflict and all ordinary production semantics. External communication launch and remote Sales Execution/Call Intelligence/research endpoints are blocked in isolated preview; canonical local review/result/follow-up and ephemeral `/api/state` still work. Existing access PIN remains required; no production credentials copied. Health release can read Railway's deployed commit metadata.

QA proportional: og:check PASS; new `og:preview:reality:test` PASS at 390x844 / 1440x900 through real seed→Meu Dia→client sheet→Call AI review→result/follow-up→Meu Dia→technical→quote, exact CRM identity/vehicle/pieces/quantities, real ACK/offline/reconnect and honest HTTP503. Standard hosted config/auth, hosted seed, client sheet/CRM, Call AI, technical unit/context browser, sync bridge/conflict/reconnect/HTTP409 and PWA release checks PASS. No eight-viewport matrix or independent full-stage replay. Durable lesson SRC-CONVERGENCE-REALITY-20261007-001 / INC-TECH-ENTRY-CONTEXT-001; Brain150 zero warnings.

Rollback: entry SHA above plus service's prior pinned `85e17dffd04f2f1f16eab1714344778bb60a3422`; disable only service-specific preview flag/seed if reverting. Never clear persisted user state. Synthetic seed is additive and marker-controlled; ephemeral container replacement can restore the fixture and lose preview-only changes. Stage7 NOT authorized.
