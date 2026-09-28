# CIC-02 — Mission Control + Signal Center

## Objetivo

Transformar o **Meu Dia** em uma central operacional que responda rapidamente:

> Qual conta merece ação agora, por quê e qual movimento devo executar?

Este incremento reaproveita o score explicável do CIC-01 e a Ficha Universal. Não cria uma segunda agenda, uma segunda base ou um segundo score comercial.

## Regras de arquitetura

- `OG_LEAD_INTELLIGENCE.score()` continua sendo a única fonte de score comercial.
- Signal Center é uma **visão derivada** dos fatos existentes do CRM; não persiste notificações nem inventa eventos.
- Nenhum sinal altera status, atividade, contato, proposta ou venda automaticamente.
- Contas em estados terminais (`fechado` / `perdido`) ficam fora da seleção de missão.
- A Ficha Universal e `state.leads` continuam sendo as fontes operacionais existentes.
- O incremento deve funcionar offline e respeitar `prefers-reduced-motion`.

## Escopo

### Mission Control

- CTA principal do Meu Dia passa a ser **INICIAR PRÓXIMA MISSÃO**.
- A conta é selecionada deterministicamente reutilizando o score do CIC-01.
- O sistema mostra a justificativa da missão usando o sinal comercial mais relevante quando houver.
- Iniciar uma missão seleciona a conta e leva o vendedor para a Mesa de Vendas; não registra contato nem atividade por si só.

### Signal Center V1

Detectar, a partir dos dados atuais:

1. follow-up vencido;
2. retorno nas próximas 24 horas;
3. proposta sem próxima ação;
4. conta prioritária sem próximo passo;
5. conta ativa sem próxima ação;
6. conta com frota grande sem decisor;
7. oportunidade avançada sem dor validada;
8. conta parada sem atividade confirmada recente.

Cada sinal precisa conter:

- conta;
- motivo;
- severidade;
- ação recomendada.

## Fora do escopo

- proposal tracking;
- proposta pública;
- automação de envio;
- referral intelligence;
- expansão automática;
- novo score por IA;
- notificações push;
- novo módulo/página de navegação.

## Critérios de aceite

- [x] Signal Center é derivado, determinístico e não muta leads.
- [x] Mission Control usa o score canônico do CIC-01.
- [x] CTA de próxima missão seleciona uma conta ativa e explica a escolha.
- [x] Signal Center aparece no Meu Dia sem criar nova página.
- [x] sinais são clicáveis e levam à mesma conta mestre.
- [x] estados terminais não entram nas missões.
- [x] novo módulo entra no shell offline.
- [x] testes unitários e de contrato de UI foram adicionados.
- [ ] CI completo / release gate aprovado.

## Arquivos principais

- `apps/sistema-og/modules/signal-center.js`
- `apps/sistema-og/app.js`
- `apps/sistema-og/index.html`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/service-worker.js`
- `scripts/test_signal_center.mjs`
- `scripts/test_mission_control_ui.mjs`

## Próximo incremento sugerido

Depois do CIC-02 validado, avaliar separadamente o **briefing de ligação / “o que não falar” + diagnóstico contextual**, sem misturar com este pacote.
