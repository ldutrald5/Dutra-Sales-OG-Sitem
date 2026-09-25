# GitHub Reconciliation — Package 00R

Baseline: `main@655d5243c6227aadbe441eef2d878a4f08106dd3`.

| Item | Classificação | Decisão 00R |
|---|---|---|
| CRM, Mesa de Vendas, Prospecção, Call AI e Comunicação | já existente no GitHub | Preservado e coberto pela suíte existente. |
| Evolução incremental e compatibilidade legada | decisão ainda válida | Mantida como regra de arquitetura. |
| Builder Brain V2 | ainda faltante | Incorporado como skill local, JSONL, índice, métricas, schemas, ciclos e checker. |
| Supabase, Auth e Company 360 | ainda faltante | Adiado para Package 01R; nenhuma migration ou flag foi ativada. |
| Changesets descritos nos relatórios 02/03 | incompatível e sujeito a redesenho | Não importados; descrevem uma linha paralela sem garantia de compatibilidade com o baseline. |
| Arquitetura V1 e Plano Mestre | parcialmente superado | Direção preservada; sequência será revalidada a partir do código atual. |
| `xlsx@0.18.5` npm + bundle vendorizado | obsoleto/risco | Dependência npm removida; bundle isolado em Web Worker com limites defensivos. |
| API local aberta em `0.0.0.0` | incompatível | Padrão alterado para loopback; LAN exige token explícito. |
| `forceMerge` e timestamp do cliente como árbitro | incompatível | Removidos do servidor; conflitos usam revisão e retorno `409`. |
| Token Cloudflare em `localStorage` | incompatível | Movido para `sessionStorage`. |
| Token global Cloudflare | parcialmente superado | Mantido temporariamente por compatibilidade; identidade real depende do futuro Auth. |
| CI e release gate | ainda faltante | Criados para Node 24, instalação reproduzível, testes, Brain, auditoria e gate. |

Nenhum dado real, migration SQL, feature flag canônica ou configuração remota foi alterado.
