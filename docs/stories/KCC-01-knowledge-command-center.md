# KCC-01 — Knowledge Command Center

Status: **em revisão**

## Problema

Sales Brain, Call AI, Biblioteca e Account 360 já tinham conhecimento útil, mas o vendedor ainda precisava saber em qual módulo procurar.

## Objetivo

Transformar o conhecimento comercial em uma capacidade contextual reutilizável pela conta e pelo Ctrl/Cmd+K, sem duplicar base.

## Escopo deste incremento

- serviço puro para montar consulta de conhecimento a partir dos fatos da conta;
- ação **Sales Brain da conta** dentro do Account 360;
- reaproveitamento do Command Center 2.0 e do endpoint `/api/knowledge/search`;
- cache PWA e testes.

## Contratos

- o serviço não grava dados;
- a consulta usa apenas fatos já presentes no lead;
- Sales Brain continua sendo a fonte de conhecimento;
- Account 360 não copia registros de conhecimento;
- nenhuma resposta de IA é persistida automaticamente.

## Critérios de aceite

- conta com segmento/dor/objeção/veículo gera consulta contextual;
- consulta vazia cai em fallback seguro de produto/vendas;
- botão Account 360 abre Command Center já no modo Brain;
- funcionamento offline do restante da aplicação é preservado;
- `npm run validate` inclui o teste KCC.

## Rollback

Reverter o pacote remove somente o serviço/atalho contextual. Nenhum dado comercial é migrado.
