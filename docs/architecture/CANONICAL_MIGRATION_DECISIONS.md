# Canonical Migration Decisions

1. O `main` auditado é a única origem canônica de código. Artefatos externos fornecem requisitos e decisões, não changesets.
2. Package 00R não cria Supabase, Auth, migrations de domínio nem Company 360.
3. A futura fundação canônica deve ser aditiva, reversível e protegida por feature flags inicialmente desligadas.
4. Dados locais continuam intactos até existir exportação, backup, ensaio e rollback validados.
5. Conflitos de sincronização usam revisão do servidor. Timestamps informados pelo cliente não decidem silenciosamente qual registro vence.
6. O acesso local inicia somente em loopback. A exposição em LAN é uma opção explícita com token de sessão.
7. O token compartilhado Cloudflare é uma ponte compatível, não identidade. Perfis e autorização aguardam o Package 01R.
8. XLSX permanece funcional em isolamento no navegador; a substituição futura requer compatibilidade comprovada antes da retirada do bundle vendorizado.
9. `derived_from`, `supersedes` e fontes do Builder Brain preservam a origem de decisões e evitam copiar conclusões sem evidência.
