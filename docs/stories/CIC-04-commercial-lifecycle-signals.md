# CIC-04 — Commercial Lifecycle Signals + Proposal Event Taxonomy

Status: **concluída**

## Objetivo

Transformar o Signal Center em uma camada mais útil também no pós-venda, expansão e intenção de compra, sem inferir fatos a partir de texto livre e sem criar uma segunda fonte de verdade.

## Entrega

### Signal Center V2

Sinais novos somente quando há dado explícito:

1. **Proposta reaberta** — exige evento confirmado `proposal.reopened`; aceite/revogação posterior encerra o sinal.
2. **Instalação pendente** — exige `installationStatus/installStatus` explícito.
3. **Teste perto do fechamento** — exige `testEndsAt/trialEndsAt` e ausência de encerramento explícito.
4. **Cliente satisfeito sem indicação** — exige satisfação explícita e ausência de pedido/recebimento de indicação.
5. **Frota com espaço para expansão** — exige frota total e quantidade explicitamente equipada/protegida.
6. **Revisão de reposição próxima** — exige data explícita de revisão/recompra.

Clientes fechados podem receber sinais de ciclo de cliente, mas deixam de receber sinais genéricos de prospecção. Clientes perdidos continuam fora do Signal Center.

### Taxonomia canônica de proposta

Eventos de proposta passam a convergir para:

- `proposal.prepared`
- `proposal.sent`
- `proposal.opened`
- `proposal.reopened`
- `proposal.contact_clicked`
- `proposal.accepted`
- `proposal.revoked`

Ingressos legados com underscore continuam aceitos e são normalizados.

Eventos de abertura/clique/aceite continuam restritos a backend confiável. Envio/revogação exigem confirmação explícita do usuário via contrato `recordUserEvent`.

## Integração

- Signal Center passa a consumir `operations.activityEvents` quando disponível.
- Automation Engine normaliza eventos legados/canônicos antes de aplicar regras.
- Nenhum sinal grava fatos ou muda status.
- Nenhuma automação é disparada por texto livre de observações.

## Segurança e integridade

- sem rota pública nova;
- sem token público;
- sem tracking pixel;
- sem leitura de segredo;
- sem criação automática de instalação, satisfação, indicação ou venda;
- compatibilidade com eventos legados preservada.

## Testes

- `og:signal-center:test`
- `og:proposal-intelligence:test`
- `og:automation-engine:test`
- `npm run validate`
- Security / Brain / audit / release gate via CI.

## Rollback

Reverter este pacote remove somente os sinais derivados adicionais e a normalização de eventos. Nenhum dado comercial existente precisa ser migrado ou apagado.


## Evidência de conclusão

- PR: **#42 — feat: CIC-04 sinais comerciais e eventos canônicos de proposta**.
- CI de implementação: **Package 00R CI run 168 — success**.
- `npm run validate`, Security, Brain, npm audit e Release Gate passaram.
- O primeiro run (167) detectou corretamente um falso positivo de expansão quando o número de veículos equipados estava ausente; o gate bloqueou a entrega e o pacote foi corrigido para exigir contagem explícita antes de sinalizar expansão.
