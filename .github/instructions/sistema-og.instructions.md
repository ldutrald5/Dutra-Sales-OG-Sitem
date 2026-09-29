---
applyTo: "apps/sistema-og/**"
---
# Instruções do Sistema OG
- Leia `AGENTS.md`, `AI_HANDOFF.md` e `docs/AI-CONTEXT-INDEX.md`.
- Preserve `lead.id`, estado existente, compatibilidade local-first e funcionamento offline.
- Não crie segunda fonte de verdade para CRM, conta, histórico ou Call AI.
- Não registre evento comercial sem ação/resultado confirmado.
- IA deve propor alterações; gravação no CRM exige revisão humana.
- Reutilize módulos existentes antes de aumentar `app.js`.
- Dados desconhecidos permanecem vazios ou pendentes.
- Mudança de persistência exige migração aditiva, compatibilidade e rollback.
- Execute testes relevantes reais antes de concluir.
