# ADR ASSET-01 — Memória Visual Canônica por Company

Status: **aceita para implementação incremental; ainda não aplicada em produção**

Data: 2026-10-03

## Contexto

O DUTRA OS opera hoje em arquitetura híbrida:

- a V3 operacional usa o core Railway e o snapshot persistido em `/data/shared-state.json` via `/api/state`;
- o Supabase `og-proposal-engine` já possui `companies`, CRM, propostas, Storage e serviços de domínio;
- `company_brand_assets` existe, mas é uma camada especializada de descoberta/enrichment de marca;
- `proposal_artifacts` e o bucket `proposal-artifacts` já representam artefatos finais de propostas;
- o bucket privado `company-assets` existe, porém pertence ao pipeline de branding e aceita apenas imagens;
- Supabase Auth + Organization ainda não está ativo no ambiente live: não existem `organizations`, `profiles` nem `organization_members`, não existem usuários em `auth.users` e não há policies RLS efetivas no schema público/Storage.

O novo módulo de memória visual precisa guardar fotos, documentos e referências visuais de uma Company sem criar uma terceira base de clientes, sem expor `service_role` ao navegador e sem reaproveitar de forma indevida infraestrutura criada para outro propósito.

## Decisão

### 1. Company continua sendo a raiz canônica

Todo Asset do MVP pertence obrigatoriamente a uma `public.companies.id`.

O módulo não cria uma tabela paralela de clientes e não usa `legacy_lead_id` como chave estrangeira. Enquanto a V3 ainda operar com leads do Railway, um gateway confiável deverá resolver `legacy_lead_id -> companies.id` ou provisionar/conferir a Company canônica antes de criar um Asset.

### 2. Separar entidade lógica de versão binária

Serão criadas duas tabelas canônicas:

- `public.assets`: identidade e contexto comercial do material;
- `public.asset_versions`: versões físicas do arquivo, hash, MIME, tamanho e caminho no Storage.

Editar título, categoria ou descrição não cria uma nova versão binária. Substituir o arquivo cria uma nova `asset_versions.version_number` para o mesmo `asset_id`. `assets.current_version_id` aponta para a versão vigente; propostas futuras devem poder fixar a versão exata usada.

### 3. `company_brand_assets` permanece especializado

`company_brand_assets` continua sendo uma camada de descoberta/cópia de branding, com sua taxonomia e estados atuais.

Ele não será renomeado, expandido ou reutilizado como repositório genérico de visitas, WhatsApp, frota, instalações ou documentos.

No futuro, um serviço pode promover um brand asset aprovado para `assets` sem destruir a origem ou a evidência de enrichment.

### 4. Storage canônico usa bucket próprio

Será provisionado, por API administrativa confiável do Supabase Storage, o bucket privado `account-assets`. A migration de banco **não** grava diretamente em `storage.buckets`/`storage.objects`; o schema `storage` é tratado como metadado gerenciado pelo serviço.

Motivos:

- evita misturar memória comercial com o pipeline `company-assets`;
- permite MIME types e limites próprios;
- facilita políticas e retenção independentes;
- mantém `proposal-artifacts` como saída final de proposta, não como entrada visual genérica.

O caminho do objeto deve ser gerado pelo backend, no formato lógico:

`companies/<company_id>/assets/<asset_id>/versions/<version_id>.<ext>`

O navegador não escolhe livremente `storage_path`.

### 5. Segurança do MVP é gateway-only

Nesta etapa:

- `assets` e `asset_versions` terão RLS habilitado;
- nenhuma policy para `anon` ou `authenticated` será criada;
- privilégios diretos de `anon` e `authenticated` serão revogados;
- o bucket `account-assets` será privado e sem policies de `storage.objects` para browser;
- leitura/escrita ocorrerá somente por backend confiável com credencial de servidor;
- `service_role` nunca é enviado ao cliente V3.

Isso é intencional enquanto a identidade do produto ainda é PIN/token no Railway.

### 6. Organization não será simulada apenas em Assets

O MVP não adiciona `organization_id` em `assets` enquanto `companies` ainda não possui fronteira de organização no ambiente live.

Criar multitenancy somente nessa tabela produziria uma segurança inconsistente.

Quando o pacote de Auth/Organization for ativado de ponta a ponta, uma migration posterior deverá:

1. adicionar/backfill `organization_id` na raiz canônica (`companies`);
2. adicionar `organization_id` em Assets ou derivá-lo de forma segura da Company;
3. criar policies de membership;
4. liberar acesso browser somente após testes de RLS e Storage.

### 7. Taxonomia não mistura natureza, conteúdo, origem e permissão

O MVP preserva dimensões distintas:

- `media_kind`: `IMAGE`, `DOCUMENT`, `VIDEO`, `AUDIO`, `ARCHIVE`, `OTHER`;
- `business_category`: `LOGO`, `COVER`, `FLEET`, `VEHICLE`, `TIRE`, `EQUIPMENT`, `FACILITY`, `VISIT`, `BUSINESS_CARD`, `CONVERSATION`, `COMMERCIAL_DOCUMENT`, `PROPOSAL_MATERIAL`, `MAP`, `MARKETING`, `REFERENCE`, `SOCIAL_PROOF`, `OTHER`;
- `source_type`: origem como `CAMERA`, `WHATSAPP`, `WEBSITE`, `PUBLIC_WEB` etc.;
- `visibility_class`: contexto de acesso/referência;
- `sensitivity_level`: risco do conteúdo;
- `usage_policy`: `INTERNAL_REFERENCE`, `PROPOSAL_ALLOWED`, `MARKETING_ALLOWED`, `RESTRICTED`.

WhatsApp é origem, não categoria comercial. Um print do WhatsApp é normalmente `business_category=CONVERSATION` e `source_type=WHATSAPP`.

`PUBLIC_SOURCE` nunca significa autorização automática para proposta ou marketing.

`is_primary=true` significa "principal dentro da categoria". Haverá no máximo um Asset ativo principal por `(company_id, business_category)`.

Isso permite ter logo principal e foto de frota principal simultaneamente sem criar pins específicos prematuramente.

### 8. Histórico é preservado; deleção física é explícita

`assets.status` e `asset_versions.status` permitem arquivamento/deleção lógica.

O banco não tentará apagar automaticamente objetos do Storage. A remoção física deverá ser uma operação de serviço explícita e auditável para evitar rows apagadas com blobs órfãos ou perda silenciosa de evidência comercial.

A FK `assets.company_id` usa `ON DELETE RESTRICT` para impedir que uma Company com memória visual seja apagada fisicamente por acidente.

### 9. Integridade e deduplicação

Cada versão pode armazenar SHA-256, tamanho, dimensões/duração e metadata técnica.

SHA-256 será indexado, mas não será `UNIQUE`: o mesmo arquivo pode legitimamente aparecer em Companies diferentes ou em contextos diferentes.

`(asset_id, version_number)` e `(storage_bucket, storage_path)` serão únicos.

### 10. Propostas consomem Assets; não duplicam artefatos finais

Assets podem ser usados como entrada de proposta (`PROPOSAL_INPUT`), mas PDFs/HTMLs gerados continuam em `proposal_artifacts` / `proposal-artifacts`.

Uma integração futura deverá registrar IDs/versões dos Assets utilizados na proposta em vez de copiar o mesmo arquivo para múltiplos domínios sem necessidade.

### 11. Mapa continua fora desta fase

TERR-01A permanece como fonte de verdade: não haverá geocoding ou mapa inventado nesta entrega.

O contrato `LOGO`/`COVER`/`FLEET` deixa a Company pronta para um futuro TERR-01B selecionar imagem de popup com fallback determinístico.

## Consequências

### Positivas

- uma única memória visual por Company;
- versões de arquivo preservadas;
- nenhum segredo novo no navegador;
- nenhuma dependência da ativação imediata de Supabase Auth;
- branding e proposta continuam com responsabilidades claras;
- caminho compatível com migração futura para Organization/RLS real.

### Custos / dívida explícita

- a V3 atual precisará de gateway backend para consultar e assinar/servir Assets;
- leads do snapshot que ainda não possuam `companies.id` exigirão resolução/provisionamento controlado;
- acesso direto via Supabase client continua bloqueado até Auth/Organization;
- upload/delete precisam de uma camada de serviço para manter DB e Storage consistentes.

## Rollback

Antes de qualquer dado real, rollback é não aplicar a migration.

Depois de aplicada em ambiente de teste vazio, rollback deve ocorrer por migration revisada que:

1. bloqueie novas gravações;
2. confirme ausência de Assets reais ou exporte os registros;
3. remova objetos de `account-assets` por serviço administrativo;
4. remova `asset_versions` e `assets`;
5. remova o bucket somente após confirmar que está vazio.

Não usar `DROP ... CASCADE` ou exclusão destrutiva improvisada em produção.

## Gate para próxima fase

A Fase 2 pode preparar a migration e testes estáticos. O bucket fica como passo de provisionamento separado via Storage API. Aplicação no Supabase live fica bloqueada até revisão explícita do SQL, do provisionamento e do contrato de gateway.
