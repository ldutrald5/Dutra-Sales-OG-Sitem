# Execution Context — Baseline pós-Package 06R

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline de produto/runtime verificado antes deste closeout: `9873644423a7f6bc204240dac3b4bb40d533fd4c`
- Packages 00R, 01R, 02R, 03R, 04R, 05R e 06R: incorporados/publicados
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Package 06R: **PUBLICADO E VERIFICADO**
- Próximo package: **NÃO AUTORIZADO AINDA**

## Sequência reconciliada

1. 01R — Canonical Domain Foundation — **MERGED**
2. 02R — Supabase Auth + Organization Pilot — **MERGED; piloto remoto pendente**
3. 03R — Company/Contact + Company 360 Beta — **MERGED**
4. 04R — Sync Bridge & Conflict UX — **MERGED**
5. 05R — Legacy Reconciliation / migração controlada — **MERGED**
6. 06R — HTTPS Preview Deployment — **PUBLICADO / VERIFIED**

## Runtime ao vivo verificado

- Railway project: `Dutra Sales OG`
- Project ID: `02a559fd-b4a6-457a-81dd-6501a0e23bdb`
- Environment: `production`
- Environment ID: `976ea20f-7cac-4d48-83c5-1ccffb1cd7f9`
- Service: `sistema-og`
- Service ID: `f5bf6592-1ef6-40d0-89d4-518c65fae12d`
- URL: `https://sistema-og-production.up.railway.app`
- Mobile helper: `https://sistema-og-production.up.railway.app/celular`
- Deployment verificado: `ea0134ea-d6fa-46f4-adea-5db0b4c3b53a`
- Commit publicado: `9873644423a7f6bc204240dac3b4bb40d533fd4c`
- Status: **SUCCESS**
- Healthcheck `/health`: **PASS**
- Replicas: **1/1**
- Variáveis presentes: `OG_ACCESS_TOKEN`, `PORT`

## Segurança e persistência

O valor de `OG_ACCESS_TOKEN` permanece somente no Railway e nunca deve ser gravado em documentação/Git.

O serviço foi verificado sem volume persistente. Portanto:
- acesso HTTPS está pronto;
- preview e testes multi-dispositivo estão autorizados;
- filesystem remoto NÃO é banco definitivo;
- não usar a instância como única cópia de dados comerciais importantes;
- Supabase Postgres/Auth continua a direção arquitetural para verdade canônica remota.

## Runtime Operator

Para deploy, link, domínio, logs, health ou acesso móvel:
1. ler `.codex/skills/dutra-runtime-operator/SKILL.md`;
2. ler `docs/runtime/DUTRA_OS_RUNTIME.md`;
3. consultar Railway ao vivo;
4. comparar com GitHub quando versão/commit importar;
5. só então responder ou mutar infraestrutura.

## Pendências estruturais

- `OQ-PKG02-001`: validação real de Supabase Auth/Organization/RLS;
- persistência canônica remota;
- migração adicional de entidades legadas aninhadas;
- eventual remoção de `lead.id` como identidade operacional;
- política de backup remoto definitiva.

## Regra de avanço

O 06R termina no closeout desta publicação. Não iniciar o próximo package automaticamente.

Qualquer mudança de storage, volume Railway, banco, auth remoto ou migração de dados reais volta ao fluxo estrutural completo: auditoria → decisão → package reversível → testes → gate → deploy → verificação.
