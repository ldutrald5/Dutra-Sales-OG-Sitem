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

- `apps/sistema-og/services/connection-state-service.js`
- evolução aditiva de `apps/sistema-og/services/sync-bridge-service.js`
- integração no `preview-v2/core-bridge.js`
- carregamento local dos serviços no `preview-v2/server.mjs` / `index.html`
- feedback global de conexão/save
- metadados de mutation em ações críticas V3
- testes unitários/contrato/aceitação
- documentação arquitetural atualizada

## File List

- `docs/stories/V3-P0-01-connection-sync-save-offline.md`

## Status

In Progress
