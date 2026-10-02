# PLAYBOOK-02 — Abordagem contextual por rota comercial

Status: **em validação**

## Objetivo

Fazer a Ficha de Ataque dizer **como entrar na conversa agora** sem criar outro CRM, sem IA obrigatória e sem inferir fatos ausentes.

## Reuso obrigatório

- a rota comercial continua vindo de `OG_LEAD_INTELLIGENCE.salesProfile()`;
- PRECALL-01 continua fornecendo lacunas, perguntas e guardrails;
- a nova camada só transforma a rota já calculada em orientação operacional;
- nenhuma orientação altera estágio, próxima ação ou histórico.

## Entrega desta fatia

Para cada rota já existente, mostrar:

- modo de abordagem;
- objetivo;
- abertura sugerida;
- pergunta-chave;
- avanço desejado.

Rotas cobertas:

1. primeiro contato;
2. retomada com contexto;
3. follow-up;
4. diagnóstico do interesse;
5. proposta/negociação;
6. reativação de cliente;
7. pós-venda/expansão;
8. conferir ERP antes de abordar.

## Regras de segurança

- ausência de histórico continua sendo “Conhecimento OG não confirmado”;
- proposta enviada não significa proposta visualizada;
- rota ERP bloqueia a recomendação de abordagem até conferência;
- não entram nesta fatia preço, desconto, ROI, economia garantida, código de suporte ou aplicação técnica inventada;
- o vendedor decide se usa ou adapta a abertura.

## Fora desta fatia

- biblioteca completa de WhatsApp;
- respostas a objeções;
- proposta rápida/consultiva/executiva;
- preparação técnica por veículo;
- diário pós-contato;
- IA generativa.

## Critérios de aceite

- [x] reutiliza a rota canônica do Sales Profile;
- [x] primeiro contato, proposta, cliente e ERP têm orientação distinta;
- [x] nenhuma mutação automática do CRM;
- [x] orientação aparece dentro da Ficha de Ataque;
- [x] mobile empilha pergunta e avanço desejado;
- [x] testes cobrem as rotas críticas;
- [ ] CI completo aprovado;
- [ ] merge/deploy somente após validação.
