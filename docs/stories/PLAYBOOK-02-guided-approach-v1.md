# PLAYBOOK-02 — Abordagem Guiada V1

Status: **em validação**

## Problema

A Ficha de Ataque já classifica a rota comercial, mas o vendedor ainda precisa transformar essa rota em uma abertura concreta, um avanço desejado e uma preparação técnica mínima antes de falar.

## Objetivo

Adicionar uma orientação curta e determinística dentro da Ficha de Ataque, sem IA obrigatória, sem novo cadastro e sem gravar sugestão como fato.

## Escopo V1

A partir de `OG_LEAD_INTELLIGENCE.salesProfile()`, derivar:

- abertura sugerida;
- três perguntas-base para a rota;
- CTA/avanço desejado;
- check técnico antes da conversa.

Rotas cobertas:

- primeiro contato;
- retomada/diagnóstico;
- follow-up;
- diagnóstico de interesse;
- proposta/negociação;
- reativação de cliente;
- pós-venda/expansão;
- conferir ERP antes de abordar.

## Regras

- sugestão é somente leitura;
- cliente existente nunca recebe abordagem de lead frio;
- follow-up não reinicia a venda do zero;
- proposta não salta direto para desconto;
- ERP pendente bloqueia abordagem comercial;
- aplicação, suporte, PSI e economia não são recomendados sem dados técnicos suficientes;
- frota maior pode receber CTA de simulação na frota real, mas sem inventar ROI.

## Critérios de aceite

- [x] usa a rota comercial canônica;
- [x] não cria nova fonte de verdade;
- [x] exibe abertura e avanço dentro da Ficha de Ataque;
- [x] inclui check técnico seguro;
- [x] cobre rotas por teste determinístico;
- [x] mobile mantém a primeira camada compacta;
- [ ] CI completo aprovado;
- [ ] PR revisada/mergeada;
- [ ] produção verificada.

## Fora de escopo

- mensagem pronta de WhatsApp;
- scripts por cargo/persona;
- objeções completas;
- recomendação de suporte/peça;
- ROI/payback;
- automação de envio;
- gravação automática no CRM.
