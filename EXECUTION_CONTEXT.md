# Execution Context — Package 00R

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch base: `main`
- Commit base auditado: `655d5243c6227aadbe441eef2d878a4f08106dd3`
- Branch de execução: `package-00r-reconciliation`
- Runtime: Node `>=24 <25`, npm `>=11`
- Escopo: reconciliação, governança, contenção XLSX, hardening, CI e release gate.
- Fora do escopo: Supabase, Auth, migrations de domínio, Company 360, feature flags canônicas e deploy.

## Fontes auxiliares

Builder Brain V2, Arquitetura V1, Plano Mestre e relatórios dos Packages 02/03 são fontes de decisão. O código do GitHub continua sendo a fonte de verdade. Nenhum changeset desses relatórios foi copiado automaticamente.

## Restrições de dados

Esta execução não migra nem altera dados reais, `localStorage`, IndexedDB ou `apps/sistema-og/.data`. O token de acesso Cloudflare passou de armazenamento persistente para sessão sem apagar valores antigos automaticamente.
