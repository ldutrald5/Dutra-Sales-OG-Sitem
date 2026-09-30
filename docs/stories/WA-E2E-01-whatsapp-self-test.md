# WA-E2E-01 — Self-Test WhatsApp → CRM → Proposta

## Objetivo

Criar um teste E2E permanente e seguro para validar o fluxo real:

`whatsapp-ingest → commercial-processor → CRM → follow-up → proposal-engine → auditoria`.

O teste deve usar dados sintéticos, nunca enviar mensagem ao WhatsApp, evitar enriquecimento externo/custos desnecessários e limpar os dados criados ao final.

## Requisitos

- Comando único: `npm run og:whatsapp:e2e`.
- Testar o Supabase hospedado real, não apenas mocks.
- Exigir chave server-side via ambiente e falhar fechado sem segredo.
- Preferir chave Supabase nova `sb_secret_...`; aceitar fallback legado durante migração.
- Criar identificadores únicos com prefixo `[E2E]`.
- Exercitar ingestão real de Edge Function via HTTPS.
- Exercitar `commercial-processor` indiretamente via `whatsapp-ingest`.
- Exercitar `proposal-engine` real com perfil `rodotrem_9_eixos`.
- Modo E2E interno deve pular somente enriquecimento externo; cálculo/DB/proposta continuam reais.
- Validar retry/idempotência.
- Validar fato explícito confirmado.
- Validar que fato não confirmado não sobrescreve campo canônico.
- Validar follow-up.
- Validar proposta interna sem estado de envio.
- Validar trilha de auditoria.
- Limpar todos os registros criados mesmo em falha, salvo opt-in explícito de diagnóstico.
- Nunca tocar dados fora dos IDs criados pelo próprio run.

## Cenários

### A — caminho feliz
1. Mensagem sintética com empresa, frota e `rodotrem_9_eixos`.
2. Insight determinístico explícito, confiança alta e `confirmed=true`.
3. Esperado:
   - contato;
   - conversa;
   - mensagem;
   - insight;
   - oportunidade;
   - fleet size correto;
   - vehicle profile correto;
   - follow-up;
   - proposta/ROI;
   - processor run auditável.

### B — idempotência
Reenviar exatamente o mesmo evento.

Esperado:
- `duplicate=true`;
- nenhuma mensagem, insight, oportunidade ou proposta adicional.

### C — dado não confirmado
Criar empresa sintética controlada e enviar insight com frota/perfil não confirmados.

Esperado:
- oportunidade pode existir;
- frota não é aplicada;
- perfil não é aplicado;
- nenhuma proposta é gerada.

## Critérios de aceite

- [x] Story criada antes do código.
- [ ] Script E2E live implementado.
- [ ] Teste offline do harness implementado.
- [ ] `package.json` expõe comandos.
- [ ] `.env.example` documenta contrato sem segredos.
- [ ] Modo E2E interno não inicia company discovery.
- [ ] E2E limpa dados criados.
- [ ] CI completo passa.
- [ ] Security advisor revisado.
- [ ] Documentação/handoff/changelog atualizados.

## File List

- `scripts/whatsapp-e2e-self-test.mjs`
- `scripts/test_whatsapp_e2e_self_test.mjs`
- `package.json`
- `.env.example`
- `scripts/validate.mjs`
- `docs/stories/WA-E2E-01-whatsapp-self-test.md`
- `docs/01-ARQUITETURA.md`
- `DUTRA_OS_CONTEXT.md`
- `AI_HANDOFF.md`
- `CHANGELOG.md`
