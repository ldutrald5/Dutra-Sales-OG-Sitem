# DUTRA-CORE-02 — Execution Log, Approval Queue e Adapter Contract

## Objetivo
Dar rastreabilidade e controle às futuras execuções multiagente sem permitir escrita externa implícita.

## Implementado
- Execution Log em memória com consulta por missão.
- Approval Queue com estados pending/approved/rejected.
- Adapter Contract com operações permitidas.
- `execute` externo exige `approved: true`.
- testes de contrato e falha segura.

## Regras
- o log registra metadados e evidências, não segredos;
- uma aprovação decidida não pode ser decidida novamente;
- adapter não pode executar operação fora da allowlist;
- esta fundação não envia mensagens nem altera produção.

## Próximo
DUTRA-DAY-01 — Morning Command: compor dados já existentes de Mission Control, Signal Center, tarefas e automações numa resposta única, explicável e mobile-first.
