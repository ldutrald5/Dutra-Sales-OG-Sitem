# SE-P0-01 — Sales Execution vertical slice

## Objetivo

Conectar a operação de prospecção existente ao Sales Execution normalizado sem criar CRM, fila, pipeline ou Call AI paralelos.

## Fluxo alvo

`lead_list → prospecting_session → current member → account context → Call AI → confirmed result → atomic command → next member`.

## Critérios de aceite

- [x] Listas ACTIVE podem ser consultadas por gateway confiável.
- [x] Sessão normalizada pode ser iniciada de forma idempotente.
- [x] Fila deriva de `lead_list_members`; não existe `session_queue` paralela.
- [x] Company/Contact/Opportunity são projetados para o Call AI existente.
- [x] Resultado canônico exige aprovação humana.
- [x] Resultados genéricos não promovem estágio normalizado.
- [x] Reunião exige data/hora e modo explicitamente confirmados.
- [x] Resultado é persistido em transação única e idempotente.
- [x] Pipeline não regride por resultado de menor maturidade.
- [x] Membro trabalhado sai da fila e sessão aponta para o próximo membro.
- [x] UI retorna automaticamente ao próximo prospect.
- [x] Falha de sincronização permanece observável e preserva o registro local.
- [x] Browser não recebe credencial administrativa Supabase.
- [x] Railway usa token interno rotacionável para chamar Edge gateway.
- [ ] Suíte completa executada em ambiente de validação.
- [ ] Lote piloto normalizado validado ponta a ponta.
- [ ] Auth/RLS de usuário final consolidado antes de acesso direto ao Supabase.

## Segurança

A função `record_sales_execution_result_v1(jsonb)` é `SECURITY DEFINER`, com search_path fixo e execução revogada de public/anon/authenticated. O transporte de produção é Browser → Railway autenticado → Edge gateway autenticado por token interno → RPC.

## Rollback

O P0 não apaga `state.leads`, IndexedDB nem estado compartilhado. Sem configuração do gateway, a aplicação mantém o fluxo legado. A ativação normalizada é por lista/sessão e pode ser interrompida sem converter toda a base.

## File List

- `apps/sistema-og/app.js`
- `apps/sistema-og/index.html`
- `apps/sistema-og/server.mjs`
- `apps/sistema-og/server-sales-execution-gateway.cjs`
- `apps/sistema-og/services/sales-execution-adapter.js`
- `apps/sistema-og/services/sales-execution-client.js`
- `supabase/functions/sales-execution-gateway/index.ts`
- `supabase/migrations/20260930024500_record_sales_execution_result_v1.sql`
- `supabase/migrations/20260930031500_harden_sales_execution_result_v1.sql`
- `scripts/test_sales_execution_adapter.mjs`
- `scripts/test_sales_execution_gateway.mjs`
- `scripts/test_call_ai.mjs`
- `scripts/test_prospecting_engine.mjs`
