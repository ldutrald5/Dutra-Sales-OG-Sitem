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
