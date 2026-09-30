# DUTRA Sales OG — mapa de integração V1

**Status:** em execução  
**Baseline:** `dutra-os-ui-v3-premium` em `cd919192eadc1d319d1bd59711d237385db9f9dc`  
**Branch:** `integration/v1-official`

## Decisão

A V3 Premium é o shell visual oficial. O Sistema OG maduro continua fornecendo domínio, dados, automações e persistência durante a extração incremental. Não haverá terceira aplicação nem reescrita geral.

```text
V3 Premium (UI)
  -> serviços de domínio canônicos em apps/sistema-og/services
  -> estado operacional atual + Sync Bridge
  -> backend hospedado atual
  -> Supabase somente após Auth -> Organization -> Membership -> RLS
```

## Mapa encontrado

| Área | Fonte atual | Estado V1 | Ação segura |
|---|---|---|---|
| Shell/Home | `preview-v2/` | preservado | evoluir por módulo |
| CRM/Cliente | `apps/sistema-og` + `preview-v2/core-bridge.js` | reutilizado | uma conta, sem cadastro paralelo |
| Conexão/sync | serviços canônicos + espelhos `preview-v2/p0-services` | estabilizado | paridade byte a byte obrigatória |
| Aplicação técnica | legado em `app.js` e módulo V3 extraído | duplicidade parcial | fonte canônica criada em `technical-application-service.js` |
| Cotação | `preview-v2/technical-quote-service-v3.js` | funcional, antes sem fonte canônica | fonte canônica criada em `quote-engine-service.js` |
| Catálogo/preços | `apps/sistema-og/data.js` | fonte real atual | não duplicar nem inventar valores |
| Propostas | `proposal-entry-v3.js` + `proposal-intelligence-service.js` | editor e persistência integrados; legado como fallback | completar PDF, estados e conversão em pedido |
| Persistência | localStorage + IndexedDB + backend JSON/KV | local-first | manter outbox e confirmação explícita |
| Supabase | migrations e pilotos existentes | não é fonte geral ativa | não ampliar nesta fase |

## Ordem de integração

1. Baseline e gates verdes.
2. Motor de Cotação canônico e paridade de deploy.
3. Carrinho multi-veículos e edição manual.
4. Proposta persistente ligada à conta.
5. Pedido e pós-venda.
6. Migração gradual de persistência após a cadeia de segurança do Supabase.

## Regra de ambiguidade

Quando faltarem respostas ou a combinação técnica não estiver coberta, o motor devolve validação pendente. Nenhum suporte é escolhido silenciosamente. A UI deve tratar isso como `TECHNICAL_DATA_REVIEW_REQUIRED` antes de proposta oficial.

## Stabilization 02

Não existe uma branch remota com esse nome literal. O conteúdo correspondente está incorporado na linhagem V3 pelos commits e testes de conexão, offline, outbox, idempotência, save feedback, performance inicial e recuperação. A reconciliação usa o comportamento e os gates presentes no GitHub, sem importar changeset externo.
