# DUTRA-PROSPECT-02 — Provider Adapter + Research Queue

## Objetivo
Executar missões `prospect.research` através de um provider intercambiável, mantendo descoberta separada de CRM e exigindo evidência.

## Entrega
- contrato de provider com `search` e `health`;
- job de pesquisa imutável;
- fila queued/completed;
- execução limitada ao `requestedCount`;
- candidatos passam pelo Prospecting Intake;
- deduplicação contra CRM;
- resumo de prontos para revisão, duplicados e evidência insuficiente.

## Segurança
O provider não recebe permissão para importar lead, enviar mensagem ou alterar CRM. O resultado termina em revisão.

## Próximo
DUTRA-PROSPECT-03: Research Review Inbox + ação explícita "Adicionar ao CRM", produzindo evento de origem/evidência.
