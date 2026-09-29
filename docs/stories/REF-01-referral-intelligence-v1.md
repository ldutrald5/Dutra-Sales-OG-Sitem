# REF-01 — Referral Intelligence V1

Transformar indicação confirmada em entidade rastreável: indicador → indicado → contexto → oportunidade → venda → receita.

## Guardrails
- Nunca inferir indicado de texto livre sem confirmação humana.
- Deduplicar antes de criar conta; coincidência gera revisão, não fusão automática.
- Receita atribuída somente com venda confirmada vinculada.
- Não cria segundo score; OG_LEAD_INTELLIGENCE permanece canônico.
- Referral → DUTRA Force será passagem explícita e revisável.

## V1
Contrato, validação, fingerprint/deduplicação, portfólio e testes determinísticos.

## Próximo incremento
Persistência em operations.referrals, UI Customer 360, vínculo com oportunidade e passagem revisável para DUTRA Force.
