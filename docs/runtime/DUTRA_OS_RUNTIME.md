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
STATUS: COMPLETE — authenticated live reality check PASS.

Reuses `applyHostedSeed` / `OG_STATE_SEED_GZIP_B64`, idempotent canonical merge, existing `state.leads` and durable sync/outbox. Fixture `scripts/fixtures/isolated-preview-seed.json` contains only DEMO-DUTRA-CLIENT / DEMO-DUTRA-PROSPECT, synthetic company/contact/context, no telephone/CNPJ/email or production data. No separate CRM, score, agenda, history, sync or demo engine. Existing guarded technical client change carries canonical identity from the sales card and client sheet; no unsaved draft overwritten without the existing confirmation.

`OG_ISOLATED_PREVIEW=true` is an explicit service-only switch. Public no-store runtime metadata contains no data/secrets; SW never caches it. Preview status annotates actual sync mode (never forces OK), preserving visible failures/offline/conflict and all ordinary production semantics. External communication launch and remote Sales Execution/Call Intelligence/research endpoints are blocked in isolated preview; canonical local review/result/follow-up and ephemeral `/api/state` still work. Existing access PIN remains required; no production credentials copied. Health release can read Railway's deployed commit metadata.

QA proportional: og:check PASS; new `og:preview:reality:test` PASS at 390x844 / 1440x900 through real seed→Meu Dia→client sheet→Call AI review→result/follow-up→Meu Dia→technical→quote, exact CRM identity/vehicle/pieces/quantities, real ACK/offline/reconnect and honest HTTP503. Standard hosted config/auth, hosted seed, client sheet/CRM, Call AI, technical unit/context browser, sync bridge/conflict/reconnect/HTTP409 and PWA release checks PASS. No eight-viewport matrix or independent full-stage replay. Durable lesson SRC-CONVERGENCE-REALITY-20261007-001 / INC-TECH-ENTRY-CONTEXT-001; Brain150 zero warnings.

Rollback: entry SHA above plus service's prior pinned `85e17dffd04f2f1f16eab1714344778bb60a3422`; disable only service-specific preview flag/seed if reverting. Never clear persisted user state. Synthetic seed is additive and marker-controlled; ephemeral container replacement can restore the fixture and lose preview-only changes. Stage7 NOT authorized.

Stage6.6 hosted closeout: deployed/pinned SHA `8c1e9c6443e59c89c80269093d8fc7afe3f86d4f`, deployment `0a9ae144-3df1-49ed-b58c-2998fb91f82b` SUCCESS on service `b385d7a3-616c-4c44-82c7-7c9541ba7c45`. URL https://dutra-os-uxr01-preview-production.up.railway.app ; HTTP200 health reports that exact release SHA. Explicit runtime flag true, no volume. Seed and OG_ISOLATED_PREVIEW are service-only; a generated preview-only OG_LOCAL_ACCESS_TOKEN enabled authenticated smoke without exposing credentials or changing existing OG_ACCESS_PIN. It is not copied from production.

Live new reality test PASS 390x844 / 1440x900: canonical customer and review identity, human DEMO outcome/follow-up→Meu Dia, guarded client→technical→exact existing quote handoff, actual `/api/state` writes/ACKs, offline/reconnect and visible HTTP503 recovery, blocked external communication. Node hosted runner uses NODE_USE_ENV_PROXY=1 for this workspace's transport; no test assertion/timeout weakened. Server inspection after smoke: exactly 2 synthetic leads, blank phone/CNPJ/email, 2 explicitly reviewed DEMO interactions and 1 technical draft under the same client ID. Screenshots at /workspace/scratch/stage66-live (outside Git). No live production/provider/WhatsApp/telephone/Supabase write.

Protected runtime rechecked: V2 and V3 deployments unchanged; official production remains `def9b0c2-301b-4c83-a459-07ff29c0dda3` with its separate `/data` volume. Integration implementation push verified CLEAN/local=remote by @devops; normal hooks77/77 PASS. Documentation closeout commit is intentionally newer than the pinned runtime and must likewise be pushed/verified. Readiness: Lucas can test with the existing preview PIN; only synthetic disposable data, remote AI/transcription/research/Sales Execution providers unavailable. Filesystem data may disappear on redeploy. Stage7 STOP.

### Stage6.7 recovery — auth prepared, deployment intentionally unchanged

Live Railway read-only inspection (2026-10-07): UXR preview b385d7a3-616c-4c44-82c7-7c9541ba7c45 still pinned Stage6.6 SHA8c1e9c6443e59c89c80269093d8fc7afe3f86d4f; SUCCESS/health200, no volumes/staged changes. Auth recovery code on integration is not yet deployed. Current ephemeral user work must have a recoverable authenticated backup/export before any redeploy/volume attachment; credentials are not available in this execution context and must not be overwritten to gain access.

Prepared server flag OG_PERSISTENT_AUTH=true enables PIN→signed HttpOnly Secure SameSite=Strict Path=/ cookie. Remember-device30days; unchecked browser-session cookie/server expiry24h; logout revokes stored hash. Session hashes use existing OG_DATA_DIR/access-sessions.json and stable secret from OG_SESSION_SECRET or existing local access token, never PIN persisted browser-side. A preview-only persistent volume is QG-authorized but not provisioned until current store is backed up. Process restart with retained dataDir/key tested; container replacement without volume still invalidates sessions and risks user data. No production volume or credential sharing. Missing primary CRM OG dr.ods pauses real import only; no daily-real-pilot claim until data/persistence/liveauth gates are verified.

Auth validation clarification: enabled session mode accepts PIN only through rate-limited login; existing strong API bearer stays compatible. Installed-PWA offline-reload QA uses explicit online event after CDP restores network, matching existing shell/PWA harness: trace showed navigator.onLine=true but zero native online events. Canonical handler must produce real sync OK/API200; no visual override or timeout increase. Ordinary no-reload reconnect and browser restart use normal browser events.

### Stage6.7 — isolated persistent real-data pilot (2026-10-07)

Existing service `dutra-os-uxr01-preview` (`b385d7a3-616c-4c44-82c7-7c9541ba7c45`) in preview project `d8e7173f-b8d3-4f8a-85e7-33c93d627774`, environment `e5b1fd77-0460-431c-b886-7be134a5c5f3` (named production in the preview project). Branch integration/dutra-os-one-system, pinned deployed SHA `5ed1518179bba323df6ea978238df2f9a56579cc`; final deployment `5da54afa-b8bf-4553-aae7-d4b5aeb2da76` SUCCESS. URL https://dutra-os-uxr01-preview-production.up.railway.app ; /health HTTP200, exact release and persistent=true.

Isolated pilot volume `piloto-dutra-os-data` (`509ed70c-cdfc-44e9-9eaf-3d0dc144ff2c`), 500 MB, us-east4-eqdc4a, mounted at /data ONLY on this service. OG_DATA_DIR=/data. The official production volume is separate and unchanged; no production storage, provider credential or Supabase write path attached. Existing applyHostedSeed restores the full supplied pilot backup on an empty store and adds the prepared canonical real seed idempotently. 434 leads, original work preserved; actual process restart and compatible redeploy retained exact leads/history/operations, including the explicitly marked test quote. Private source exports/seed/review and recoverable snapshots stay outside Git.

Opt-in persistent auth is now online. Original preview PIN unchanged; remember-device signed HttpOnly Secure SameSite=Strict cookie30days, unchecked browser-session cookie/server expiry24h; explicit logout revokes the stored session. Stable private signing key and session hashes persist in the isolated data directory. Anonymous API/incorrect PIN denied online. Full normal-PIN cookie lifecycle tested locally; live authenticated smoke uses a private API bearer and does not claim original-PIN human login. No credential values documented. A QA transport-error bearer was replaced, and its rejection verified after redeploy; no user PIN or signing-key rotation.

Runtime banner: Piloto DUTRA OS · Dados reais · Ambiente isolado only when explicit isolation/pilot flags, actual mount/dataDir, validated seed marker/hash and real-source provenance agree. Sync remains actual OK/pending/error/offline/conflict; public last-known isolation metadata supports offline PWA boot, not authentication. External communication/provider writes remain blocked. Call AI UI/manual review works within existing owners; real remote transcription/research/Sales Execution unavailable honestly.

Live390x844/1440x900:20 real entities each, canonical client→Call AI→technical context, one unsent test quotation with exact vehicle/items/quantities, navigation/reload/reconnect/overflow/bootstrap PASS. History now contains original quote plus marked validation quote. Production/V2/V3 remain unchanged. Final documentation/harness closure commits may be newer than the pinned, tested product build; reconnect source deliberately for future authorized code release. Keep routine recoverable exports; do not clear this volume to revert. Stage7 not authorized.


## Stage7 pilot publication — pending platform approval (2026-10-08)

- Authorized target remains the existing isolated UXR pilot: service b385d7a3-616c-4c44-82c7-7c9541ba7c45/project d8e7173f-b8d3-4f8a-85e7-33c93d627774/environment e5b1fd77-0460-431c-b886-7be134a5c5f3. URL https://dutra-os-uxr01-preview-production.up.railway.app .
- Git Stage7 implementation: c8c08924d43d1589b30bd228d765f4f5260dd537 on integration/dutra-os-one-system, verified published/CLEAN.
- Sole reviewed staged patch b155ce96-83be-4ddc-a8ba-909c2913ae85 changes source.commitSha to that commit. Railway accept_deploy cancelled twice, including after fresh user approval. No build started; do not claim Stage7 is hosted.
- Live readback remains deployment0c0e06df-e90b-4b6b-9ed4-43c234579b1e SUCCESS, health200/ok, SHA2797d3db087d774f5ec7350deba1f3c162ad1550. Existing isolated500MB volume509ed70c-cdfc-44e9-9eaf-3d0dc144ff2c at/data, secrets and data unchanged.
- Platform/dashboard must apply that reviewed patch; then verify SUCCESS/exacthealthSHA and guarded two-viewport real-client save/reopen before closing hosted Stage7. Production/V2/V3 remain intact.


## Stage7 online gate recovery (2026-10-08)

Prior platform approval blocker resolved: isolated UXR deployment e2017b88-b390-4df4-844a-0a32c5b2b8f9 SUCCESS at6af84634ca8e873fef834e850eb74e88c12af1d4, health200/persistent and the same500MB/data volume. No new infrastructure, credentials or mounts. Actual online acceptance reproduced a quote-history whole-state snapshot exceeding the5000000-byte state request limit. A bounded future composition-only snapshot and SW v77 passed local81-gate validation, release gate, Brain161 and native browser regressions before integration-only/pilot publication and repeated live acceptance. Existing CRM/history/user work remain intact in private recoverable backups; no pruning or data migration. Final runtime/readback follows only after SUCCESS and online acceptance. No Stage7.1.

Correction source033be6668bca07d352f5fa65b6224add03b5b7d4 is integration-published/CLEAN (normal hooks81/81). Sole staged pilot commit-pin patchf01db9c6-dd61-42e2-b8ba-a357931a1417 was cancelled by approval tool with “the user did not approve this action”; remains STAGED. Health still200/ok/persistent at6af84634, no fix deployment started. Explicit patch approval/application pending; no credentials/volume/production changes or alternate bypass. After approval verify exact new SUCCESS/SHA before live repeat.


## Stage7.1 pilot source pin — pending platform apply (2026-10-08)

Stage7 is accepted by QG and live at513b2d82ad94c4fde608bb461ebb943e209e988f, deployment1a561d06-cbd4-49ed-a8e2-0a301bb9506a SUCCESS/HTTP200/persistent. Earlier Stage7 blockers above are historical. Stage7.1 integration implementation710468534e36aca96eca92698713189315819dab passed82 gates and scoped browser regressions. Sole service source pin patch e06e857d-47fa-4a4d-8485-380667474ba6 remains STAGED after accept_deploy cancelled with user-not-approved; no build started. No variable/volume/auth/provider/infrastructure change.

Apply only that reviewed patch on the existing preview project/environment/service; then verify exact deployed health and guarded real-client Cavalo/Carreta save/reload/reopen before claiming Stage7.1 hosted acceptance. Current URL https://dutra-os-uxr01-preview-production.up.railway.app/ continues running Stage7. Isolated500MB/data volume and current434-lead/3-history/19-quote snapshot remain recoverable; no commercial writes performed by Stage7.1 live QA yet. Official production, V2 and V3 deployments/config/mounts unchanged. See V3_UNIFICATION_CHECKPOINT; no Stage8.
