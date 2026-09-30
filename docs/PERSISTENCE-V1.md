# Persistência V1

## Contrato

O usuário trabalha localmente e recebe confirmação visual imediata. A gravação durável remota ocorre por sincronização e nunca apaga silenciosamente uma alteração local.

```text
ação confirmada
  -> snapshot local
  -> mutation com idempotencyKey
  -> IndexedDB sistema-og-sync
  -> tentativa autenticada no foreground
  -> confirmação do lote exato
```

## Estados visíveis

- `CONNECTING`: recuperando estado remoto sem bloquear a Home.
- `CONNECTED`: backend acessível e sem pendência conhecida.
- `OFFLINE`: navegador sem rede; trabalho local continua.
- `SYNCING`: há envio em andamento.
- `ERROR`: backend respondeu com falha; não rotular como falta de internet.

## Regras

1. `localStorage` mantém o estado operacional compatível.
2. IndexedDB mantém outbox, mutations e dados de recuperação.
3. O Service Worker não envia credencial nem mutation comercial sozinho.
4. Cada ação possui identidade estável; repetição não reaplica a regra de negócio.
5. Uma resposta antiga confirma somente o snapshot e mutation IDs daquele lote.
6. Conflitos preservam as duas versões para revisão humana.
7. Exclusão definitiva exige tombstone, sincronização confirmada e política explícita.
8. Os espelhos de deploy da V3 devem permanecer idênticos à fonte canônica.

## Limite atual

O backend hospedado ainda é um estado JSON versionado. Ele sustenta a prévia e o acesso remoto, mas não oferece o isolamento relacional e multiusuário do destino Supabase. Nenhuma migração de dados reais é feita nesta fase.
