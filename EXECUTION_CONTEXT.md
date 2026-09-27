# Execution Context — Package 04R em validação

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline estável: `a0efb31a244a1967ae8e3cd17d8a29f273f26619`
- Packages 00R, 01R, 02R e 03R: incorporados ao `main`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Package em execução: **04R — Sync Bridge & Conflict UX**
- Branch: `package-04r-sync-conflict-ux`
- PR: **#7** — draft durante a validação estrutural
- CI atual: workflow run `36283164052` iniciado; resultado ainda não deve ser tratado como PASS até conclusão
- Fora do escopo do 04R: migração em massa do legado, remoção de `lead.id`, ativação obrigatória do Supabase remoto e reconciliação 05R.

## Sequência reconciliada

1. 01R — Canonical Domain Foundation — **MERGED**
2. 02R — Supabase Auth + Organization Pilot — **MERGED; piloto remoto pendente**
3. 03R — Company/Contact + Company 360 Beta — **MERGED**
4. 04R — Sync Bridge & Conflict UX — **EM VALIDAÇÃO**
5. 05R — Legacy Reconciliation / migração controlada

## Estado técnico do 04R

O contrato de revisão autoritativa do 00R continua vigente: write remoto exige a revisão corrente e `409` nunca autoriza sobrescrita silenciosa.

A branch 04R acrescenta:
- conflito determinístico com snapshots local/remoto e diferenças por ID/campos;
- revisão humana antes de qualquer envio reconciliado;
- checkpoint local antes de descartar ou conciliar;
- Sync Bridge IndexedDB para outbox e recovery;
- foreground autenticado como único emissor da outbox; Service Worker não persiste token e apenas sinaliza trabalho pendente;
- recovery antes de qualquer pull remoto;
- serialização de writes para impedir auto-conflitos e perda de edições concorrentes;
- recuperação entre refresh/reabertura e abas por marker + IndexedDB.

A auditoria do 04R também corrige dois riscos residuais do 03R: coexistência de contatos legados/canônicos e pipeline multi-moeda.

## Estado do 02R

`OQ-PKG02-001` permanece aberta. A fundação Auth/Organization foi mergeada, porém migration/Auth/RLS só serão considerados comprovados remotamente após ensaio contra um projeto Supabase piloto. O 04R não ativa esse piloto.

## Restrições de dados

Nenhum package até o 04R está autorizado a transformar em massa os leads existentes. O 04R altera mecanismos de sincronização/recuperação e contratos de compatibilidade, mas não executa migração de dados comerciais reais.

## Regra de avanço

Cada package segue: branch isolada → implementação → testes → gate → auditoria → documentação/Brain → merge protegido → novo baseline → STOP.

O 04R não pode ser declarado concluído enquanto CI/release gate não estiverem em PASS e a PR não tiver sido auditada/mergeada.
