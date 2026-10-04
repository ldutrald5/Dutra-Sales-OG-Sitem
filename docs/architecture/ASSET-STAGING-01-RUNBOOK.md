# ASSET-STAGING-01 — Runbook de validação isolada da Memória Visual

Status: **automatizado e validado localmente; não executar em produção**

## Evidência já executada

O workflow gratuito `Asset Local E2E (Free)` já concluiu com sucesso o ciclo completo em Supabase local descartável.

Evidência de referência: run **36** (`37209722334`).

O smoke comprovou:

- `ok=true`;
- versão 2 preservada;
- assinatura de versão histórica pinada;
- signed URL privada com TTL;
- quatro vínculos contextuais;
- acesso anônimo ao banco bloqueado;
- acesso anônimo ao Storage bloqueado;
- gate de uso em proposta ativo;
- vínculo com entidade de outra Company bloqueado;
- soft delete final;
- invariantes SQL de banco/Storage em PASS.

O workflow também destrói o stack local ao final.

## Objetivo

Validar o domínio `assets` + `asset_versions`, o bucket privado `account-assets`, o Asset Gateway e a aba **Mídia** da V3 sem tocar nos dados ou no Storage do projeto live.

## Regra de segurança

A validação deve ocorrer em uma **Supabase development branch descartável**. A branch deve ser criada somente depois de consultar o custo aplicável à organização e obter confirmação explícita.

Não aplicar a migration diretamente no projeto live para “testar”.

## Pré-condições

1. CI da feature com `npm run validate` em PASS.
2. Branch Git: `feat/visual-memory-phase1-2`.
3. Supabase development branch criada a partir de `og-proposal-engine`.
4. Nenhum dado de produção copiado manualmente para a branch.
5. Uma Company sintética criada apenas para o ensaio, com:
   - nome: `ASSET E2E TEST`;
   - `legacy_lead_id` iniciando por `ASSET-E2E-`.
6. Railway/execução local de teste apontando **somente** para URL e service role da branch descartável.

## Sequência

### 1. Aplicar schema

Aplicar apenas a migration:

`supabase/migrations/20261003120000_add_canonical_account_assets.sql`

Confirmar:

- `public.assets` existe;
- `public.asset_versions` existe;
- RLS está habilitado nas duas tabelas;
- `anon` e `authenticated` não possuem grants diretos;
- nenhuma policy browser foi criada;
- `public.companies` continua sendo a raiz canônica.

### 2. Provisionar Storage

Criar o bucket `account-assets` pela API administrativa de Storage, não por INSERT manual em `storage.buckets`.

Configuração do MVP:

- private: `true` / `public=false`;
- file size limit: `15728640` bytes (15 MB);
- allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `application/pdf`

Não criar policy de browser em `storage.objects`.

### 3. Criar Company sintética

Usar um registro descartável no banco da branch. O `legacy_lead_id` precisa começar por `ASSET-E2E-`, por exemplo:

`ASSET-E2E-20261004`

Não reutilizar CNPJ, telefone, nome ou IDs de uma conta real.

### 4. Rodar smoke do gateway

Configurar somente no shell/ambiente temporário da branch:

- `OG_SUPABASE_URL`
- `OG_SUPABASE_SERVICE_ROLE_KEY`
- `OG_ASSET_E2E_LEGACY_LEAD_ID`
- `OG_ASSET_E2E_ALLOW_WRITE=YES_I_AM_USING_A_DISPOSABLE_BRANCH`

Executar:

`npm run og:asset:e2e`

O smoke precisa provar:

1. health do gateway;
2. criação de Asset;
3. upload de PNG privado;
4. resolução `legacy_lead_id -> companies.id`;
5. listagem sem expor `storage_path` ou SHA-256;
6. signed URL temporária;
7. substituição criando versão 2;
8. definição de principal;
9. archive;
10. soft-delete.

### 5. Validar Storage

Confirmar que o caminho físico segue:

`companies/<company_uuid>/assets/<asset_uuid>/versions/<version_uuid>.<ext>`

O caminho não pode conter:

- nome da empresa;
- CNPJ;
- telefone;
- `legacy_lead_id`;
- filename original como identificador.

### 6. Validar V3

Em preview/staging:

- abrir Cliente 360 → **Mídia**;
- testar câmera em celular;
- testar galeria;
- testar PDF;
- confirmar sanitização/regravação de JPEG/PNG/WebP;
- confirmar que HEIC é recusado com mensagem clara no MVP;
- confirmar filtros;
- confirmar lazy loading;
- abrir drawer de detalhe;
- definir principal;
- substituir arquivo;
- arquivar;
- excluir;
- confirmar que um arquivo duplicado exato retorna conflito em vez de duplicação silenciosa.

### 7. Critérios de aceite

A etapa só passa se:

- nenhum segredo aparecer no navegador;
- nenhum objeto ficar público;
- signed URLs expirarem;
- um Asset arquivado desaparecer da galeria padrão;
- uma falha de Storage não deixar Asset incompleto ativo;
- uma falha de banco não causar overwrite silencioso;
- versão anterior não for sobrescrita;
- `npm run validate` permanecer verde;
- não houver escrita no projeto live.

## Rollback do ensaio

A branch Supabase é descartável. Ao final:

1. guardar somente logs/resultados sem segredos;
2. remover a development branch;
3. não fazer merge da branch Supabase;
4. não copiar bucket, objetos ou Company sintética para produção.

## Gate seguinte

Somente após este runbook passar deve existir decisão sobre rollout controlado. Produção continua bloqueada até autorização explícita.
