# Motor de Cotação V1

## Fonte canônica

- Aplicação técnica: `apps/sistema-og/services/technical-application-service.js`
- Cotação, catálogo e ajuste manual: `apps/sistema-og/services/quote-engine-service.js`
- Dados comerciais e catálogo: `apps/sistema-og/data.js`

Os arquivos equivalentes em `preview-v2/` são espelhos necessários porque o Railway publica essa pasta como raiz. `og:v1:quote:mirror:test` impede divergência.

## Entradas

- veículo/regra selecionada;
- respostas técnicas;
- quantidade de veículos;
- pressão;
- inclusão da dianteira;
- tabela comercial;
- parcelas;
- extras autorizados.

## Saídas

- eixos e posições;
- suportes confirmados ou pendentes;
- linhas consolidadas;
- códigos OG e ERP quando cadastrados;
- quantidades, unitários e totais;
- pneus atendidos;
- pendências técnicas;
- condição simulada.

## Guardrails

- Dados técnicos e preços vêm somente das fontes cadastradas.
- Pergunta ausente ou combinação ambígua gera validação pendente.
- `SUPORTE-A-DEFINIR` não pode virar proposta oficial sem revisão.
- Ajustes manuais preservam rastreabilidade e recalculam totais.
- Cálculo assistido pode virar base manual sem recomputar tudo.
- O resumo é pré-orçamento; envio depende de revisão humana.

## Contrato inicial

O motor expõe busca normalizada, perguntas visíveis, resolução de aplicação, consolidação de peças, cotação, busca no catálogo, ajuste manual, resumo e carrinho multi-veículos. `buildMultiVehicleQuote()` agrupa códigos iguais, preserva o detalhamento por veículo e mantém o conjunto pendente quando qualquer aplicação ou preço precisar de revisão.
