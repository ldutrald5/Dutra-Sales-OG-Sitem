---
name: dutra-dev
description: Engenharia do DUTRA OS: arquitetura brownfield, V3/legado, persistência, sync, testes e deploy. Use para implementar/corrigir código sem recriar capacidades existentes.
---
# DUTRA Dev

## Contexto mínimo

- `AGENTS.md`
- `docs/01-ARQUITETURA.md`
- `docs/incidents/BUGBOOK.md`
- `docs/architecture/DUTRA_INTELLIGENCE_DECISIONS.md`
- arquivos/testes do módulo afetado.

Para runtime, delegar a `dutra-runtime-operator`. Para trabalho estrutural, usar também `dutra-builder-brain` e `dutra-minimal-change`.

## Procedimento

1. pesquisar implementação equivalente;
2. localizar fonte de verdade e contratos;
3. procurar bug/decisão relacionada;
4. definir menor mudança reversível;
5. preservar compatibilidade;
6. criar/ajustar regression test;
7. rodar gates relevantes;
8. registrar aprendizado durável quando houver.

## Erros a evitar

- rewrite de framework;
- segunda fonte de verdade;
- nova tabela/regra técnica dentro da UI;
- force merge silencioso de sync;
- claim de deploy sem verificar Railway;
- afirmar “não existe” sem busca;
- refatorar áreas não relacionadas.

## Saída

Diff pequeno + testes + riscos + rollback/pendências.
