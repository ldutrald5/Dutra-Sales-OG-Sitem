# PLAYBOOK-01 — Ficha de Ataque V1

Status: **em validação**

## Problema

O DUTRA OS já possui Account 360, Next Best Action, Signal Center, PRECALL-01, Call AI e campos comerciais ricos, mas o vendedor ainda precisa percorrer superfícies diferentes para montar mentalmente a preparação imediata de uma conversa.

## Objetivo

Criar uma primeira camada compacta de preparação dentro da Ficha Universal, sem nova entidade, novo score, nova base ou inferência silenciosa.

## Reuso obrigatório

- `state.leads` continua como cadastro mestre operacional.
- `OG_LEAD_INTELLIGENCE.nextBestAction()` continua definindo o próximo movimento.
- `OG_SALES_BRIEF.build()` continua fornecendo lacunas, perguntas e guardrails PRECALL-01.
- estágio/situação usam `OG_LEAD_INTELLIGENCE`.
- eventos de proposta são apenas sinais explícitos de relacionamento; não viram venda nem conhecimento presumido.

## Entrega V1.1 — classificação determinística

A Ficha também deriva, sem persistir um novo fato:

- **relação OG confirmada**: conhecimento não confirmado, contato registrado, proposta confirmada ou cliente;
- **rota comercial**: primeiro contato, retomada/diagnóstico, follow-up, proposta/negociação, reativação de cliente, pós-venda/expansão ou conferência ERP;
- **faixa de frota**: desconhecida, 1, 2–9, 10–49 ou 50+ veículos.

As regras usam somente campos e eventos existentes. Ausência de evidência nunca vira “não conhece a OG”; fica **Conhecimento OG não confirmado**. A classificação é projeção somente leitura e pode mudar quando os fatos do CRM mudam.

## Entrega V1

A Ficha Universal passa a mostrar, antes dos dados completos:

- perfil operacional: segmento + frota registrada;
- momento comercial: situação da conversa + status;
- relacionamento baseado somente em histórico explícito;
- objetivo do contato usando o Next Best Action já existente;
- preparação/lacunas;
- três perguntas para descobrir;
- três guardrails “NÃO DIGA AINDA”.

## Regras

- somente leitura;
- nenhum campo novo persistido;
- “nível de conhecimento da OG” não é inventado;
- proposta aberta/enviada serve apenas como histórico confirmado;
- aplicação técnica, ROI, economia, desconto e condições permanecem sujeitos aos guardrails existentes;
- mobile mantém a primeira camada compacta e revela detalhes quando a ficha é expandida.

## Critérios de aceite

- [x] não cria segunda fonte de verdade;
- [x] reutiliza PRECALL-01 e CIC-01;
- [x] aparece na Ficha Universal;
- [x] não altera lead, estágio ou próxima ação;
- [x] mobile oculta listas longas na primeira camada;
- [x] teste de contrato da ficha cobre o wiring;
- [x] classificação de relação/rota/frota é determinística e coberta por teste;
- [ ] CI completo aprovado;
- [ ] PR revisada/mergeada;
- [ ] produção verificada, se houver deploy.

## Fora de escopo

- templates de WhatsApp;
- scripts completos por persona;
- OG Technical Brain;
- recomendação de aplicação/suporte;
- ROI/payback;
- Coach DUTRA;
- nova automação;
- persistência de classificação “conhece/não conhece”.

## Diagnóstico que originou a story

A maior parte do plano comercial já existe em componentes separados. A V1 fecha apenas a lacuna de **síntese operacional na ficha**, evitando reimplementar Account 360, Call AI, PRECALL, Next Best Action, Signal Center ou Diário Inteligente.
