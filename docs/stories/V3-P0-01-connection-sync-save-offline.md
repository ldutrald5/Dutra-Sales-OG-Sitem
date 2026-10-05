# V3-P0-01 — Connection State, Save Visible e Offline Mutation Queue

## Contexto

A auditoria da branch `dutra-os-ui-v3-premium` identificou que o DUTRA OS já possui cache local, pending save e Sync Bridge, mas ainda não oferece uma experiência transversal de confiança sobre conexão, persistência e replay.

Esta story evolui o mecanismo existente de forma aditiva. Não cria uma segunda fonte de verdade e não ativa Supabase/Auth.

## Objetivo

Garantir que o vendedor saiba, em qualquer tela V3, se a base está conectada, se uma ação está salvando, se foi confirmada, se ficou pendente offline e se precisa tentar novamente.

## Arquitetura alvo

```text
UI V3
  ↓
Connection State singleton
  ↓
DUTRA_CORE commit/save
  ↓
Mutation metadata granular
  ↓
Sync Bridge existente (IndexedDB)
  ↓
PUT /core-api/state (snapshot operacional atual)
```

A mutation queue é uma camada de rastreabilidade/replay do save existente. O snapshot operacional continua sendo a persistência efetiva enquanto o backend não expuser endpoint granular de mutations.

## Estados globais

- `CONNECTING`
- `CONNECTED`
- `OFFLINE`
- `SYNCING`
- `ERROR`

## Save feedback

Fases visíveis:

- `SALVANDO…`
- `SALVO ✓`
- `SALVO NESTE APARELHO · SINCRONIZAÇÃO PENDENTE`
- `TENTAR NOVAMENTE`

## Regras

1. Não apagar nem substituir `state.leads`.
2. Não criar nova fonte de score/fila comercial.
3. Não ativar Supabase/Auth.
4. Não alterar o estágio comercial como efeito de sincronização.
5. Mutation IDs são estáveis durante retries.
6. Retry de rede não reaplica a ação de negócio; apenas reenvia o snapshot já materializado.
7. O full-state outbox existente permanece como recovery; a fila granular o complementa.
8. Segredos/tokens nunca entram na fila.
9. Sem `alert()`/`prompt()` novos.
10. Nada desta story será mergeado em `main` sem aprovação explícita.

## Critérios de aceite

### CASO 1 — perda de internet

- [ ] Base inicia em `CONNECTED`.
- [ ] Internet cai e estado muda para `OFFLINE`.
- [ ] Vendedor registra ação enquanto offline.
- [ ] Alteração continua visível imediatamente na UI.
- [ ] Mutation granular é persistida com ID/idempotency key.
- [ ] Snapshot fica persistido no outbox existente.
- [ ] Indicador mostra quantidade de alterações pendentes.
- [ ] Internet volta e replay inicia automaticamente.
- [ ] Mutation é confirmada sem duplicar ação.
- [ ] Estado volta para `CONNECTED`.
- [ ] Reload após reconexão mantém o dado.

### CASO 2 — falha durante save

- [ ] Ação entra em `SALVANDO…`.
- [ ] Falha de backend/rede não mostra sucesso falso.
- [ ] Mutation permanece pendente.
- [ ] UI mostra `TENTAR NOVAMENTE` ou estado offline apropriado.
- [ ] Retry reutiliza a mutation existente.
- [ ] Confirmação do backend remove/acknowledge a mutation.
- [ ] UI mostra `SALVO ✓`.
- [ ] Reload mantém o resultado.

## Entregáveis

- [x] `apps/sistema-og/services/connection-state-service.js`
- [x] evolução aditiva de `apps/sistema-og/services/sync-bridge-service.js`
- [x] integração no `preview-v2/core-bridge.js`
- [x] carregamento dos serviços no `preview-v2/server.mjs` / `index.html`
- [x] espelhos de deploy em `preview-v2/p0-services/` com teste byte-a-byte de paridade
- [x] feedback global de conexão/save
- [x] metadados/idempotency keys de mutation em ações críticas V3
- [x] testes unitários, contratos P0 e gates do repositório
- [x] documentação arquitetural atualizada

## Evidência automatizada e de runtime

- Connection State testável com `CONNECTING | CONNECTED | OFFLINE | SYNCING | ERROR`.
- IndexedDB `sistema-og-sync` evoluído para schema v3 com `outbox`, `recovery` e `mutations`.
- O full-state outbox continua sendo o payload de recovery; mutations granulares adicionam identidade, idempotência, tentativas e rastreabilidade sem criar segunda base comercial.
- `localStorage` de pending save virou apenas fallback/migração de compatibilidade.
- Replay reenvia o snapshot já materializado e não repete a ação de negócio.
- ACK é limitado ao `recordId` e aos `mutationIds` do lote realmente confirmado, impedindo um replay antigo de apagar uma edição mais nova.
- Ações tipadas: resultado de ligação + próxima ação, agendamento/conclusão de próxima ação, configuração técnica, Meu Dia/Automation e rascunho de proposta.
- Falha HTTP 5xx mantém a alteração local, mostra `TENTAR NOVAMENTE` e não comunica sucesso remoto falso.
- CI `Package 00R` run 334: `npm ci`, `validate`, Brain, Security, `npm audit --audit-level=high` e `release:gate` — PASS.
- O CI também detectou a dependência `undici 7.29.0`; a branch foi alinhada ao override auditado `undici 7.30.0` já usado na `main`.
- Railway V3 publicou o commit `4374886cadbda4a113b21fd701cb21a0df9daa09` com status SUCCESS.
- Runtime verificado: `/health`, `/core/services/connection-state-service.js` e `/core/services/sync-bridge-service.js` retornam HTTP 200.
- A primeira validação de produção detectou 404 nos dois serviços por causa de `rootDirectory=/preview-v2`; o empacotamento foi corrigido e protegido por teste de paridade.

## Aceitação ainda manual

Os critérios CASO 1 e CASO 2 acima permanecem desmarcados até serem exercitados em um navegador autenticado real, incluindo desligar rede, editar, reconectar e recarregar. A implementação e os contratos automatizados que suportam esses casos estão verdes, mas isso não substitui o teste manual de comportamento do browser.

Revalidação em 2026-09-30: todos os testes direcionados e a suíte V3 passaram; o deployment Railway consultado estava `SUCCESS`, e a página e o `/health` responderam HTTP 200. Auditoria consolidada em `docs/audits/DUTRA_OS_V3_SPRINT_1_AUDIT.md`. A pendência manual acima permanece sem ser marcada artificialmente como concluída.

## File List

- `docs/stories/V3-P0-01-connection-sync-save-offline.md`
- `apps/sistema-og/services/connection-state-service.js`
- `apps/sistema-og/services/sync-bridge-service.js`
- `apps/sistema-og/service-worker.js`
- `preview-v2/p0-services/connection-state-service.js`
- `preview-v2/p0-services/sync-bridge-service.js`
- `preview-v2/core-bridge.js`
- `preview-v2/server.mjs`
- `preview-v2/index.html`
- `preview-v2/sales-action-center-v3.js`
- `preview-v2/technical-center-v3.js`
- `preview-v2/meu-dia-v3.js`
- `scripts/test_connection_state_service.mjs`
- `scripts/test_sync_bridge.mjs`
- `scripts/test_v3_p0_connection_sync.mjs`
- `scripts/test_v3_p0_service_mirror.mjs`
- `package.json`
- `package-lock.json`
- `scripts/validate.mjs`

## Status

Implemented — automated/runtime validation complete; browser offline/reload acceptance pending.
