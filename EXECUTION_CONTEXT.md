# Execution Context — Baseline pós-Package 01R

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline estável: `4e062cf1228a407eccc688b7b00254ef44bf3ded`
- Packages 00R e 01R: incorporados ao `main`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Estado estável: segurança/release baseline + Canonical Domain Foundation/operations schema V2.
- Package em execução: **02R — Supabase Auth + Organization Pilot**.
- Fora do escopo do 02R: Company 360, migração de dados reais, corte do acesso legado e deploy.

## Sequência reconciliada

1. 01R — Canonical Domain Foundation — **MERGED**
2. 02R — Supabase Auth + Organization Pilot — **EM EXECUÇÃO**
3. 03R — Company/Contact + Company 360 Beta
4. 04R — Sync Bridge & Conflict UX
5. 05R — Legacy Reconciliation / migração controlada

## Estado do 02R

A branch `package-02r-auth-organization-pilot` introduz migration versionada para organizations/profiles/organization_members com RLS, bootstrap de sessão protegido por feature flag e uma fronteira de auth-state somente leitura. A feature permanece desligada e o acesso legado continua operacional.

`OQ-PKG02-001` permanece aberta: CI pode validar contratos e regressões, mas migration/Auth/RLS só serão considerados comprovados remotamente após ensaio contra um projeto Supabase piloto.

## Restrições de dados

01R não migrou dados reais. 02R também não está autorizado a transformar leads, localStorage, IndexedDB, JSON/KV ou criar memberships a partir de dados existentes.

## Regra de avanço

Cada package segue: branch isolada → implementação mínima → testes → gate → auditoria → merge autorizado → novo baseline → STOP. Merge do 02R não significa ativação do piloto remoto; a ativação exige validação ambiental explícita.
