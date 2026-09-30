# PLAYBOOK-01 — Abordagem Comercial Contextual

Status: **em andamento**

## Objetivo

Transformar o briefing pré-ligação existente em uma ficha de ataque contextual que diga ao vendedor **como abordar esta conta agora**, sem criar uma segunda fonte de verdade e sem inventar conhecimento técnico/comercial.

## Princípios

- `state.leads` continua sendo a fonte operacional do cliente.
- A abordagem é derivada de estágio, histórico e fatos já registrados; não muda estágio sozinha.
- "Conhece a OG" só pode ser afirmado quando há evidência de contato/relação; caso contrário o sistema usa **conhecimento não confirmado**.
- Aplicação técnica, código de suporte, economia, ROI e condição comercial continuam protegidos pelas regras OG já existentes.
- A orientação é determinística e funciona offline. IA pode personalizar depois, mas não é necessária para o caminho principal.

## Fatia 1 — modo de abordagem pré-ligação

Entregas desta fatia:

- classificar o momento comercial em:
  - primeiro contato;
  - retomada com contexto;
  - recuperação de contato;
  - follow-up combinado;
  - interesse → diagnóstico;
  - follow-up de proposta;
  - negociação;
  - pós-venda/expansão;
  - fidelização/expansão;
  - reativação respeitosa;
- mostrar:
  - objetivo da conversa;
  - nível de conhecimento/contato comprovado;
  - abertura sugerida;
  - pergunta principal;
  - próximo avanço desejado;
  - checklist de preparação técnica segura;
- reutilizar `sales-brief-service.js` e a Central Call AI já existentes.

## Critérios de aceite da fatia 1

1. Primeiro contato não presume que o cliente conhece ou desconhece a OG.
2. Proposta enviada não recebe o mesmo script de primeiro contato.
3. Cliente registrado recebe orientação de pós-venda antes de expansão.
4. Negociação prioriza objeção/decisão em vez de reapresentação.
5. Preparação técnica sempre exige confirmação de veículo/configuração/pressão antes de aplicação/código.
6. Nenhum dado é persistido apenas por gerar o briefing.
7. Testes cobrem pelo menos primeiro contato, proposta, cliente e recuperação de contato.

## Próximas fatias

- **Fatia 2:** mensagens/WhatsApp por perfil usando o motor de templates canônico.
- **Fatia 3:** preparação técnica contextual conectada ao conhecimento OG validado.
- **Fatia 4:** proposta recomendada (rápida, consultiva ou executiva) por tamanho/estágio da oportunidade.
- **Fatia 5:** pós-contato revisável integrado ao Diário Inteligente.

## Arquivos

- `apps/sistema-og/services/sales-brief-service.js`
- `apps/sistema-og/app.js`
- `apps/sistema-og/styles.css`
- `scripts/test_sales_brief.mjs`
- `tasks/TODO.md`
- `CHANGELOG.md`
