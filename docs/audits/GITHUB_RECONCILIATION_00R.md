# GitHub Reconciliation — Package 00R

Baseline: `main@655d5243c6227aadbe441eef2d878a4f08106dd3`.

| Item | Classificação | Decisão 00R |
|---|---|---|
| CRM, Mesa de Vendas, Prospecção, Call AI e Comunicação | já existente no GitHub | Preservado e coberto pela suíte existente. |
| Evolução incremental e compatibilidade legada | decisão ainda válida | Mantida como regra de arquitetura. |
| Builder Brain V2 | ainda faltante | Incorporado como skill local, JSONL, índice, métricas, schemas, ciclos e checker. |
| Sequência futura | referência ambígua | Reconciliada como 01R — Canonical Domain Foundation; 02R — Supabase Auth + Organization Pilot; 03R — Company/Contact + Company 360 Beta; 04R — Sync Bridge & Conflict UX; 05R — Legacy Reconciliation / migração controlada. Nenhuma migration/flag foi ativada em 00R. |
| Changesets descritos nos relatórios 02/03 | incompatível e sujeito a redesenho | Não importados; descrevem uma linha paralela sem garantia de compatibilidade com o baseline. |
| Arquitetura V1 e Plano Mestre | parcialmente superado | Direção preservada; sequência será revalidada a partir do código atual. |
| `xlsx@0.18.5` npm + bundle vendorizado | obsoleto/risco | Dependência npm removida; bundle isolado em Web Worker com limites defensivos. |
| API local aberta em `0.0.0.0` | incompatível | Padrão alterado para loopback; LAN exige token explícito. |
| `forceMerge` e timestamp do cliente como árbitro | incompatível | Removidos do servidor; conflitos usam revisão e retorno `409`. |
| Token Cloudflare em `localStorage` | incompatível | Movido para `sessionStorage`. |
| Token global Cloudflare | parcialmente superado | Mantido temporariamente por compatibilidade; identidade real depende do futuro Auth. |
| CI e release gate | ainda faltante | Criados para Node 24, instalação reproduzível, testes, Brain, auditoria e gate. |

Nenhum dado real, migration SQL, feature flag canônica ou configuração remota foi alterado.
