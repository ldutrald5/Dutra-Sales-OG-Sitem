# Execution Context — Baseline pós-Package 02R

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline estável: `89e3eff4c78149659cfe3ac6b86f187b14d0297c`
- Packages 00R, 01R e 02R: incorporados ao `main`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Estado estável: segurança/release baseline + Canonical Domain Foundation/operations schema V2.
- Package em execução: **03R — Company/Contact + Company 360 Beta**.
- Fora do escopo do 03R: migração em massa do legado, remoção de `lead.id`, ativação obrigatória do Supabase remoto e Sync Bridge 04R.

## Sequência reconciliada

1. 01R — Canonical Domain Foundation — **MERGED**
2. 02R — Supabase Auth + Organization Pilot — **MERGED; piloto remoto pendente**
3. 03R — Company/Contact + Company 360 Beta — **EM EXECUÇÃO**
4. 04R — Sync Bridge & Conflict UX
5. 05R — Legacy Reconciliation / migração controlada

## Estado do 02R

A branch `package-02r-auth-organization-pilot` introduz migration versionada para organizations/profiles/organization_members com RLS, bootstrap de sessão protegido por feature flag e uma fronteira de auth-state somente leitura. A feature permanece desligada e o acesso legado continua operacional.

`OQ-PKG02-001` permanece aberta: CI pode validar contratos e regressões, mas migration/Auth/RLS só serão considerados comprovados remotamente após ensaio contra um projeto Supabase piloto.

## Restrições de dados

01R não migrou dados reais. 02R também não está autorizado a transformar leads, localStorage, IndexedDB, JSON/KV ou criar memberships a partir de dados existentes.

## Regra de avanço

Cada package segue: branch isolada → implementação mínima → testes → gate → auditoria → merge autorizado → novo baseline → STOP. Merge do 02R não significa ativação do piloto remoto; a ativação exige validação ambiental explícita.
