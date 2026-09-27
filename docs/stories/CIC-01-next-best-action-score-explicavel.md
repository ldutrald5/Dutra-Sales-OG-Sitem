# CIC-01 — Next Best Action + Score Explicável

## Status

Em andamento — BUILD concluído em branch; aguarda auditoria/gate final.

## Objetivo

Transformar a próxima ação existente em um próximo movimento comercial explicável, sem criar segunda fila, segundo score, segunda agenda ou segunda base de clientes.

## Reuso obrigatório

- `apps/sistema-og/modules/lead-intelligence.js` continua sendo o único motor de priorização da fila inteligente.
- `apps/sistema-og/services/interaction-service.js` continua registrando próxima ação.
- `apps/sistema-og/services/crm-service.js` continua normalizando o cadastro mestre.
- Ficha Universal e Call AI apenas consomem/enriquecem o mesmo cliente.
- Dados legados sem os campos novos continuam válidos.

## Campos aditivos

- `nextActionReason`
- `nextActionObjective`
- `nextActionExpectedResult`

Todos são opcionais. `nextAction` e `followUpAt` permanecem compatíveis.

## Score explicável

O score continua determinístico. A mesma função usada para ordenar também expõe fatores com rótulo e pontos:

- prioridade;
- situação da conversa;
- retorno vencido/próximo;
- temperatura;
- potencial;
- ausência de próxima ação quando aplicável.

A explicação não altera status, prioridade ou estágio automaticamente.

## Próximo Movimento

A Ficha Universal mostra:

- ação;
- prazo;
- motivo;
- objetivo;
- resultado esperado;
- fatores do score.

Motivo explícito registrado pelo vendedor tem preferência. Quando ausente, o sistema só pode usar fatos determinísticos já presentes, como retorno vencido ou situação da conversa.

## Call AI

O contexto compacto recebe motivo, objetivo e resultado esperado quando registrados. Nenhum desses campos é inventado ou gravado sem ação humana.

## Não escopo

- “o que NÃO falar” contextual;
- perguntas de diagnóstico por segmento;
- Referral Intelligence;
- expansão de frota;
- diário comercial por linguagem natural;
- novo score por IA;
- automações de envio;
- migração canônica em massa.

Esses itens pertencem a pacotes posteriores.

## Critérios de aceite

- [x] Campos novos são aditivos e opcionais.
- [x] Score e explicação vêm da mesma função.
- [x] Score não altera o funil.
- [x] O score antigo do Meu Dia delega ao motor atual em vez de competir com ele.
- [x] Ficha exibe Próximo Movimento e permite editar motivo/objetivo/resultado esperado.
- [x] Call AI recebe os novos campos.
- [x] `setNextAction` preserva chamadas legadas e aceita metadados opcionais.
- [x] Testes determinísticos cobrem score, fatores, fallback e contexto.
- [x] FIX de auditoria: Mesa/Meu Dia delega ao score canônico sem pesos duplicados.
- [x] FIX de auditoria: trocar a descrição da ação invalida contexto antigo; trocar só a data preserva.
- [x] FIX de auditoria: estados sem ação explícita não recebem “Definir próxima ação”.
- [ ] CI/gates após o FIX.
- [ ] Auditoria final independente.
- [ ] Closeout do Builder Brain após aprovação.

## Rollback

Reverter o commit CIC-01 remove apenas campos/UI aditivos. Registros legados permanecem válidos; os campos opcionais não são necessários para abrir ou operar clientes existentes.
