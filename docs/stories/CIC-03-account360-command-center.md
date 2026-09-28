# CIC-03 — Account 360 operacional + Command Center 2.0

Status: **em revisão**

## Problema

A Ficha Universal, Company 360 beta, Mission Control, Signal Center e Command Center já existiam, porém o contexto da conta permanecia distribuído e o Ctrl/Cmd+K ainda era principalmente uma busca simples.

## Objetivo

Entregar uma evolução aditiva que:

- transforme a ficha atual em um Account 360 operacional;
- combine fatos do lead com Company 360 canônico quando disponível;
- mostre próxima ação, motivo, sinais, frota, potencial, pipeline, contatos e oportunidades;
- amplie o Command Center para módulos, ações por conta e Sales Brain;
- preserve um único score, uma única base de leads e os contratos canônicos existentes.

## Não objetivos

- migrar todo lead automaticamente para Company;
- criar banco ou auth novo;
- construir Proposal Tracking;
- criar Automation Engine;
- trocar framework/frontend;
- registrar fatos comerciais apenas por abrir uma ação.

## Critérios de aceite

- Account 360 funciona com conta legada e canônica.
- Nenhuma Company é criada automaticamente.
- Próximo movimento usa `OG_LEAD_INTELLIGENCE.nextBestAction`.
- Sinais usam `OG_SIGNAL_CENTER.signalsForLead`.
- Command Center navega pelos módulos existentes.
- Comandos de conta suportam Account 360, Call AI, cotação, WhatsApp, ligação e comunicação.
- `brain <consulta>` reutiliza `/api/knowledge/search`.
- Mobile continua utilizável.
- `prefers-reduced-motion` e stack atual são preservados.
- O pacote entra em `npm run validate`.

## Arquivos

- `apps/sistema-og/app.js`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/service-worker.js`
- `scripts/test_cic03_account_command.mjs`
- `package.json`
- `scripts/validate.mjs`
- `EXECUTION_CONTEXT.md`
- `.claude/CLAUDE.md`
- `CONTEXT_MANIFEST.md`
- `tasks/TODO.md`
- `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`
- `docs/roadmap/BASELINE_2026-09-28.md`

## Rollback

Reverter os commits desta branch restaura o Account/Command Center anterior sem migração de dados. Nenhum dado real é transformado por CIC-03.
