# DUTRA-CORE-02 — Execution Log + Approval Queue

Status: **concluído no código; aguardando merge/release**

## Objetivo

Adicionar memória auditável ao Command Core sem criar um banco paralelo e estabelecer um gate persistível para ações externas/irreversíveis.

## Arquitetura

O pacote reutiliza `operations.activityEvents` como trilha de eventos. Não adiciona outra coleção canônica nem altera o schema do estado.

Eventos:

- `command.mission.started`
- `command.mission.completed`
- `command.mission.failed`
- `command.mission.unsupported`
- `command.approval.requested`
- `command.approval.resolved`

A fila de aprovações pendentes é uma **projeção derivada** dos eventos requested/resolved, preservando a regra de uma fonte de verdade.

## Approval Gate

Ações marcadas como externas/irreversíveis ou `external_write` geram pedido de aprovação.

A resolução aceita somente:

- `approved`
- `rejected`

A aprovação não executa a ação por si só. Ela apenas libera o contrato de adapter para um executor explicitamente autorizado.

## Adapter Contract

`createAdapter()` padroniza:

- `read`
- `prepare`
- `execute`
- `health`

`execute` é bloqueado sem `approved:true`. Nenhum Gmail, Calendar, Supabase ou outro provedor é ativado por este pacote.

## Segurança

- campos sensíveis conhecidos são redigidos antes do log;
- payload/result têm limites de profundidade/tamanho;
- tokens, authorization, passwords, cookies e sessions não devem aparecer na trilha;
- eventos são idempotentes pelo `operations-model.appendActivity`;
- nenhuma ação externa ocorre no teste.

## Testes

`og:command-execution:test` cobre:

- início/conclusão/unsupported;
- redaction;
- fila de aprovação;
- aprovação e remoção da fila;
- bloqueio de ação que não precisa de aprovação;
- adapter health/read;
- bloqueio de execute sem aprovação;
- execute permitido somente com flag explícita;
- validade do Operations Model;
- shell/PWA.

## Rollback

Remover o serviço/UI futura não exige apagar eventos já registrados. Eventos `command.*` podem permanecer como histórico inerte e auditável.
