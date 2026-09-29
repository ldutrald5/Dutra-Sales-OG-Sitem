# PRECALL-01 — Diagnóstico contextual + “Não diga ainda”

Status: **concluído no código; aguardando merge/release**

## Objetivo

Antes de uma ligação, transformar lacunas reais da conta em perguntas úteis e proteger o vendedor de afirmar algo que o CRM/Proposal Intelligence ainda não comprova.

## Entrega

O Call AI passa a mostrar um briefing determinístico com:

- lacunas da conta;
- perguntas para descobrir;
- guardrails “NÃO DIGA AINDA”.

## Perguntas

As perguntas são montadas a partir de fatos existentes:

- frota/composição;
- decisor/processo de decisão;
- dor;
- segmento;
- impacto operacional;
- próximo passo seguro.

Há perguntas específicas para transportadora, agronegócio, ônibus e revenda. Segmentos desconhecidos recebem um conjunto conservador de diagnóstico de frota.

## Guardrails

Exemplos:

- não tratar contato como decisor sem confirmação;
- não tratar uma dor como confirmada se não estiver registrada;
- não prometer ROI/economia/payback como garantia;
- não prometer suporte/aplicação sem veículo/eixo/pressão validados;
- não prometer desconto/frete/prazo/condição sem registro aprovado;
- proposta enviada sem evento de abertura não pode ser apresentada como visualizada;
- mesmo com abertura/reabertura confirmada, o tracking é usado para timing: o roteiro orienta a não dizer ao cliente “eu vi você abrir”.

## Fonte de verdade

O serviço lê apenas o lead e `operations.activityEvents`. Não grava diagnóstico, dor, decisor ou qualquer outro fato.

## Custo e segurança

- zero IA;
- zero chamada externa;
- zero mutação do CRM;
- nenhuma inferência de abertura de proposta;
- compatível com eventos canônicos/legados de proposal tracking.

## Testes

`og:sales-brief:test` cobre lacunas, perguntas, guardrails, proposta enviada sem abertura, reabertura confirmada e wiring de Call AI/PWA.
