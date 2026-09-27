# Execution Context — Package 06R em validação/publicação

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline estável: `30a3516a95a2385cd3a1ff6fae1b16f69b761409`
- Packages 00R, 01R, 02R, 03R, 04R e 05R: incorporados ao `main`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Package em execução: **06R — HTTPS Preview Deployment**
- Branch: `package-06r-https-preview`
- PR: **#11** — draft durante o gate final
- CI inicial do package: workflow run `36287750590` — **SUCCESS**
- Objetivo: publicar o DUTRA OS em HTTPS protegido para visualização/uso em PC e celular sem promover o JSON transitório a banco canônico.

## Sequência reconciliada

1. 01R — Canonical Domain Foundation — **MERGED**
2. 02R — Supabase Auth + Organization Pilot — **MERGED; piloto remoto pendente**
3. 03R — Company/Contact + Company 360 Beta — **MERGED**
4. 04R — Sync Bridge & Conflict UX — **MERGED**
5. 05R — Legacy Reconciliation / migração controlada — **MERGED**
6. 06R — HTTPS Preview Deployment — **EM VALIDAÇÃO/PUBLICAÇÃO**

## Estado técnico do 06R

O repositório possui agora um entrypoint hospedado separado do fluxo local:

`Railway → PORT/0.0.0.0 → start-og-hosted → server.mjs → DUTRA OS`.

Controles:
- token forte obrigatório antes do boot;
- `OG_ACCESS_TOKEN` aceito como segredo do ambiente;
- `/health` sem dados e sem autenticação;
- `/api/*` continua protegido;
- `RAILWAY_PUBLIC_DOMAIN` gera URLs HTTPS corretas;
- `RAILWAY_VOLUME_MOUNT_PATH` pode fornecer persistência;
- smoke test hospedado integra `npm run validate`;
- `package.json` expõe `start -> npm run og:start:hosted` para Railpack zero-config;
- `railway.json` legado foi removido após auditoria da documentação Railway vigente;
- healthcheck `/health`, domínio, segredo e volume são configurados no serviço Railway durante a publicação;
- security gate cobre o contrato do runtime hospedado.

## Limite arquitetural

Este package resolve **acesso HTTPS**, não a arquitetura canônica final de persistência.

Mesmo se um volume Railway for anexado:
- o full-state JSON continua ponte de transição;
- Supabase Postgres/Auth continua direção arquitetural oficial;
- OQ-PKG02-001 permanece aberta;
- nenhuma migração de dados reais ocorre automaticamente.

## Builder Brain

O 06R registra:
- `SRC-PKG06R-001`;
- `DEC-HOST-06R-001`;
- `PAT-HOST-001`.

## Estado externo Railway

O Railway foi instalado/conectado pelo usuário para permitir a publicação. O runtime foi atualizado para o fluxo aceito por serviços Railway novos; a publicação só pode ser declarada concluída depois de existir:
- projeto/serviço Railway;
- segredo `OG_ACCESS_TOKEN`;
- domínio público HTTPS;
- deploy saudável;
- verificação real de `/health` e da interface online.

## Regra de avanço

Fluxo obrigatório: implementação → testes → CI → auditoria → documentação/Brain → CI final → merge protegido → deploy externo → verificação HTTPS → closeout → STOP.

Não declarar 06R concluído apenas porque o código foi mergeado. A URL online verificada é parte do Definition of Done.
