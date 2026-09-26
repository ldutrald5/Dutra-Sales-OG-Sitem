# Execution Context — Baseline pós-Package 00R

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline estável: `2735e01ad36510f4549e1e844b00d7ba583d047a`
- Package 00R: incorporado ao `main`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Estado: reconciliação, governança, contenção XLSX, hardening, CI e release gate concluídos no baseline.
- Próximo package planejado: **01R — Canonical Domain Foundation**.
- Fora do escopo deste fechamento: implementação do 01R, Supabase, Auth, migrations de domínio, Company 360, migração de dados reais e deploy.

## Sequência reconciliada

1. 01R — Canonical Domain Foundation
2. 02R — Supabase Auth + Organization Pilot
3. 03R — Company/Contact + Company 360 Beta
4. 04R — Sync Bridge & Conflict UX
5. 05R — Legacy Reconciliation / migração controlada

Esta sequência registra planejamento; não autoriza implementação automática do próximo package.

## Fontes auxiliares

Builder Brain V2, Arquitetura V1, Plano Mestre e relatórios históricos são fontes de decisão e evidência. O código do GitHub continua sendo a fonte de verdade. Changesets históricos não são incorporados automaticamente.

## Restrições de dados

O Package 00R não migrou nem alterou dados comerciais reais, `localStorage`, IndexedDB ou `apps/sistema-og/.data`. O token de acesso Cloudflare passou de armazenamento persistente para sessão sem apagar valores antigos automaticamente.

## Regra de avanço

O 01R só deve começar a partir do `main` estável após o fechamento administrativo do 00R. Cada package segue: branch isolada → implementação mínima → testes → gate → auditoria → merge autorizado → novo baseline → STOP.
