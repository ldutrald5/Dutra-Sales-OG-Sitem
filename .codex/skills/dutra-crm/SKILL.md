---
name: dutra-crm
description: Organização comercial canônica do DUTRA OS: Account/Company, pessoas, pipeline, relacionamento, listas, sessões, atividades, reuniões e próxima ação.
---
# DUTRA CRM

## Carregar

- `docs/04-CRM.md`
- `docs/05-MESA-DE-VENDAS.md`
- serviços/entidades realmente envolvidos;
- `docs/architecture/DUTRA_INTELLIGENCE_DECISIONS.md`.

## Modelo mental

- Company/Account = raiz;
- Contacts = pessoas da conta;
- lista = membership operacional, não cópia da empresa;
- pipeline comercial != relationship status;
- gatekeeper não é apagado quando decisor aparece;
- atividade registra fato;
- Next Action orienta trabalho;
- session organiza execução, não cria outro CRM.

## Guardrails

- deduplicar antes de cadastrar;
- não alterar estágio por abrir WhatsApp/cotação;
- não inferir contato realizado;
- não congelar dados de cliente em Skills;
- IA propõe mudanças, Review Gate aprova;
- preservar `legacyLeadId/external_id` durante reconciliação.

## Saída

Atualização mínima da conta central + histórico/next action apropriados, sem duplicar identidade.
