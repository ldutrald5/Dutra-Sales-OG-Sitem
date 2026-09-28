# AUTO-01 — Automation Engine V1

Status: **concluída**

## Objetivo

Transformar fatos já confirmados em sugestões de rotina acionáveis, sem construir um Zapier genérico e sem executar mudanças comerciais silenciosamente.

## Regras V1

1. `proposal.sent` + 48h sem aceite/revogação → sugerir follow-up.
2. `installation.completed` → sugerir pós-venda para +15 dias.
3. `customer.satisfaction.confirmed` → sugerir pedido de indicação.
4. teste com `testEndsAt/trialEndsAt` próximo → sugerir revisão antes do encerramento.
5. conta ativa sem atividade há 7 dias, sem próxima ação/follow-up futuro → sugerir retomada.

## Contrato

- o motor **gera sugestões**;
- nada é aplicado sozinho;
- o botão **Criar próxima ação** chama o mesmo `interaction-service.setNextAction` usado pelo restante do produto;
- a aplicação gera `automation.suggestion.applied` para não repetir a mesma sugestão;
- nenhuma regra registra contato, envio, abertura, venda, instalação ou satisfação por inferência.

## UI

O Meu Dia ganha um Automation Center abaixo do Signal Center. Cada sugestão mostra conta, motivo, ação e botão explícito.

## Segurança / integridade

- estados terminais são ignorados;
- proposta aceita/revogada encerra follow-up automático;
- eventos de origem precisam existir em `activityEvents`;
- nenhum secret ou chamada externa nova.

## Correção adicional

Este pacote também corrige sequências literais `\n` que haviam entrado no HTML/Service Worker ao adicionar módulos anteriores e passa a validar a sintaxe do `service-worker.js` em todo `og:check`.

## Rollback

Reverter o pacote remove o Automation Center e as regras. Próximas ações já explicitamente aplicadas pelo usuário permanecem como fatos históricos e não são apagadas.

## Evidência de conclusão

- PR: **#41 — feat: AUTO-01 Automation Engine V1**.
- CI de implementação: Package 00R CI run **163**, conclusão **success**.
- Gates aprovados: validate, Brain, Security, npm audit e Release Gate.
- O Service Worker passa a entrar no syntax gate permanente.
