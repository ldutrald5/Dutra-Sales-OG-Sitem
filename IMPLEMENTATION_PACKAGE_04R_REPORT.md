# IMPLEMENTATION PACKAGE 04R REPORT

## Resultado atual

**PACKAGE 04R — IMPLEMENTADO EM BRANCH; PR #7 DRAFT; CI/AUDITORIA FINAL EM ANDAMENTO**

## Baseline e escopo

- Base: `main@a0efb31a244a1967ae8e3cd17d8a29f273f26619`
- Branch: `package-04r-sync-conflict-ux`
- PR: `#7` — `feat(04r): durable sync bridge and conflict review`
- Objetivo: tornar sincronização local-first explícita e recuperável, eliminando merge/reenvio silencioso após `409`.
- Não objetivos: migração 05R, remoção de `lead.id`, ativação obrigatória de Supabase, Realtime, deploy ou mudança de dados reais.

## Evidência e decisão

O baseline 00R já havia definido revisão do servidor como autoridade e removido `forceMerge`. A auditoria do 04R confirmou que o frontend ainda fazia merge automático após `409` e reenviava o estado sem decisão explícita do vendedor. Também confirmou que o outbox do Service Worker existia estruturalmente, porém não havia ponte de gravação segura no app e um envio autônomo não poderia depender do token mantido somente em `sessionStorage`.

Decisão do 04R: conflito bloqueia write, snapshots são preservados, o usuário revisa antes de enviar, e a outbox é persistida sem credenciais; somente o foreground com sessão ativa faz o PUT.

## Sync Conflict Core

`sync-conflict-service.js` entrega:
- snapshot local + remoto com revisões;
- resumo por coleção;
- diferenças por ID e campos;
- preparação determinística de merge para revisão sem gravar no servidor.

O fluxo antigo `409 → mergeBackup → PUT automático` foi removido.

## Sync Bridge e recuperação

`sync-bridge-service.js` usa IndexedDB `sistema-og-sync` versão 2:
- store `outbox`: último estado pendente;
- store `recovery`: conflito e revisão preparados.

Nenhum header/token é persistido. O Service Worker v29 não envia a outbox diretamente; ele sinaliza `OG_SYNC_OUTBOX_READY` e o app autenticado faz o envio.

Markers pequenos em `localStorage` impedem pull remoto caso IndexedDB esteja temporariamente indisponível. Tombstones impedem que um registro antigo de recovery reapareça se a limpeza do IndexedDB falhar.

## Concorrência e verdade de estado

Writes são serializados com `serverSyncInFlight` e `serverSyncGeneration`. Edições feitas enquanto um request está em voo geram novo envio depois da revisão retornada, evitando auto-conflito por duas gravações da mesma aba.

Antes de qualquer GET que possa substituir estado local:
1. recovery é restaurado;
2. conflito/revisão pendente bloqueia pull;
3. outbox é enviada no foreground;
4. só então o estado remoto pode ser carregado.

Conflitos usam o estado local atual no momento da detecção para não perder edição feita durante um request.

## UX

Em conflito, o vendedor vê:
- revisões local/remota;
- quantidade de divergências;
- registros somente locais/remotos;
- campos divergentes;
- ações `Ver divergências`, `Preparar conciliação` e `Usar versão do servidor`.

A conciliação é local primeiro. Um segundo botão `Enviar revisão` e confirmação explícita são necessários para o PUT. Se houver novo `409`, nasce um novo conflito.

Antes de usar a versão do servidor ou preparar reconciliação, o app tenta salvar checkpoint local em IndexedDB.

## Hardening residual do 03R

A auditoria estrutural confirmou e corrigiu dois riscos herdados:
- `operations.contacts` é coleção mista durante a transição; contato legado sem `entityType` não pode bloquear escrita canônica, mas `entityType` explícito incorreto continua inválido;
- Company 360 agora agrega pipeline por moeda e não exibe soma única quando há moedas diferentes.

Nenhum contato legado é convertido automaticamente.

## Testes e gates

Testes adicionados/expandidos:
- `og:sync:conflict:test`;
- `og:sync:bridge:test`;
- `og:sync:conflict:ui:test`;
- `og:canonical:test`;
- `og:canonical:editor:test`;
- `og:company360:test`;
- `og:security:test`;
- `og:ops:test` exige os serviços no shell offline.

Todos fazem parte do `npm run validate`.

CI real da PR #7: workflow run `36283164052` foi iniciado. O resultado permanece **NOT RUN/IN PROGRESS para fins de certificação** até conclusão observada.

## Segurança

- token Cloudflare continua somente em `sessionStorage`;
- outbox não grava Authorization/Bearer;
- Service Worker não faz PUT autônomo da outbox;
- backend continua autoritativo por revisão;
- sem `forceMerge`;
- nenhum segredo novo.

## Dados

Nenhum dado comercial real foi migrado ou transformado por este package. Alterações são de código/contrato de sincronização. Recovery/checkpoints afetam apenas operações futuras no navegador que executar a versão 04R.

## Rollback

Antes do merge: fechar PR #7.
Após merge: revert por PR. O rollback de código não deve apagar snapshots/recovery/outbox automaticamente. Se houver recovery pendente, a versão anterior deve ser usada somente após export/checkpoint manual, porque ela não entende o novo store `recovery`.

## Riscos residuais / não objetivos

- resolução granular escolhendo campo local/remoto ainda não existe; o 04R informa campos e prepara merge determinístico por registro;
- Supabase Auth remoto continua pendente por `OQ-PKG02-001`;
- o full-state JSON continua sendo ponte de transição; 05R é responsável pela reconciliação/migração canônica controlada;
- Background Sync sem janela não envia dados porque credenciais não são persistidas deliberadamente.

## Definition of Done

O 04R só fecha quando:
- CI da PR estiver SUCCESS;
- `npm run validate`, Brain, security, audit e release gate tiverem PASS no workflow;
- branch estiver sem drift relevante do `main`;
- review threads/reviews estiverem limpos ou resolvidos;
- Builder Brain for atualizado e validado;
- PR sair de draft e for mergeada com head SHA protegido.

## Próxima sequência

Após merge do 04R e STOP:
- 05R — Legacy Reconciliation / migração controlada.
