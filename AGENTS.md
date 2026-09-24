# AGENTS.md - Synkra AIOX (Codex CLI)

Este arquivo define as instrucoes do projeto para o Codex CLI.

<!-- AIOX-MANAGED-START: core -->
## Core Rules

1. Siga a Constitution em `.aiox-core/constitution.md`
2. Priorize `CLI First -> Observability Second -> UI Third`
3. Trabalhe por stories em `docs/stories/`
4. Nao invente requisitos fora dos artefatos existentes
<!-- AIOX-MANAGED-END: core -->

<!-- AIOX-MANAGED-START: quality -->
## Quality Gates

- Rode `npm run lint`
- Rode `npm run typecheck`
- Rode `npm test`
- Atualize checklist e file list da story antes de concluir
<!-- AIOX-MANAGED-END: quality -->

<!-- AIOX-MANAGED-START: codebase -->
## Project Map

- Core framework: `.aiox-core/`
- CLI entrypoints: `bin/`
- Shared packages: `packages/`
- Tests: `tests/`
- Docs: `docs/`
<!-- AIOX-MANAGED-END: codebase -->

<!-- AIOX-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:skills:codex`
- `npm run sync:skills:codex:global` (opcional; neste repo o padrao e local-first)
- `npm run validate:structure`
- `npm run validate:agents`
<!-- AIOX-MANAGED-END: commands -->

## Comandos do Sistema OG

- `npm run og:start`
- `npm run og:check`
- `npm run og:assets`
- `npm run og:cloud:dev`
- `npm run og:cloud:deploy`

## Sistema OG — regras de execução

Estas regras complementam os blocos gerenciados pelo AIOX e prevalecem para tarefas em `apps/sistema-og/`.

1. Leia este arquivo antes de trabalhar e use o código existente como fonte da verdade.
2. Consulte somente os documentos ligados ao escopo. Não carregue toda a pasta `docs/` ou `knowledge/` sem necessidade.
3. Preserve código funcional, dados locais e contratos existentes. Migrações devem ser aditivas e reversíveis; nunca apague `localStorage`, IndexedDB ou `.data` automaticamente.
4. Reutilize componentes, módulos, estado, autenticação e padrões existentes quando adequados. Não faça refatorações amplas durante tarefas pequenas.
5. Implemente apenas o escopo solicitado, com arquivos pequenos e responsabilidades separadas. Evite dependências novas quando a plataforma já resolver o problema.
6. Respeite `docs/03-DESIGN-SYSTEM.md` e `docs/02-BANCO-DE-DADOS.md`. Dados comerciais sem fonte permanecem como `[CONHECIMENTO PENDENTE]`.
7. Priorize soluções determinísticas. Use IA somente quando regras, filtros, templates ou cálculos não forem suficientes.
8. Para IA, carregue o contexto fixo OG uma vez e envie apenas o contexto variável relevante da conta, eventos novos e resumos compactos.
9. Ações externas, gravações, envios, alterações comerciais e confirmações de resultado exigem ação explícita do usuário. Abrir WhatsApp não significa mensagem enviada.
10. Antes de concluir, execute os testes disponíveis e relevantes no `package.json`; não invente comandos ausentes. Para mudanças gerais do app, o mínimo é `npm run og:check`.
11. Registre decisões arquiteturais importantes em `docs/01-ARQUITETURA.md` ou em documento dedicado vinculado a ele. Atualize `tasks/TODO.md` e `tasks/DONE.md` quando o status de uma tarefa mudar.

### Roteamento de contexto

| Escopo | Ler primeiro |
|---|---|
| Visão e prioridade | `docs/00-VISAO-SISTEMA.md`, `docs/10-ROADMAP.md` |
| Arquitetura e integração | `docs/01-ARQUITETURA.md` |
| Persistência e entidades | `docs/02-BANCO-DE-DADOS.md` |
| Interface e componentes | `docs/03-DESIGN-SYSTEM.md` |
| CRM e Mesa de Vendas | `docs/04-CRM.md`, `docs/05-MESA-DE-VENDAS.md` |
| Call AI | `docs/06-CALL-AI.md`, depois somente o arquivo necessário em `knowledge/` |
| Comunicação e templates | `docs/07-CENTRAL-COMUNICACAO.md`, `docs/08-TEMPLATES-COMERCIAIS.md` |
| Custos e contexto de IA | `docs/09-CUSTOS-IA.md` |
| Execução | `tasks/TODO.md` e a story específica em `docs/stories/` |

### Mapa real do Sistema OG

- Aplicação: `apps/sistema-og/`
- Entrada da interface: `apps/sistema-og/index.html`, `styles.css`, `app.js`, `data.js`
- Modelo operacional: `apps/sistema-og/operations-model.js`
- Arquivos locais: `apps/sistema-og/material-store.js`
- Servidor local: `apps/sistema-og/server.mjs`
- Publicação: `cloudflare/worker.mjs`
- Testes do produto: `scripts/test_*.mjs`
- Dados reais e conhecimento importado: `apps/sistema-og/.data/` (privado e fora do Git)

<!-- AIOX-MANAGED-START: shortcuts -->
## Agent Shortcuts

Preferencia de ativacao no Codex CLI:
1. Use `/skills` e selecione `aiox-<agent-id>` vindo de `.codex/skills` (ex.: `aiox-architect`)
2. Se preferir, use os atalhos abaixo (`@architect`, `/architect`, etc.)

Interprete os atalhos abaixo carregando o arquivo correspondente em `.aiox-core/development/agents/` (fallback: `.codex/agents/`), renderize o greeting via `generate-greeting.js` e assuma a persona ate `*exit`:

- `@architect`, `/architect`, `/architect.md` -> `.aiox-core/development/agents/architect.md`
- `@dev`, `/dev`, `/dev.md` -> `.aiox-core/development/agents/dev.md`
- `@qa`, `/qa`, `/qa.md` -> `.aiox-core/development/agents/qa.md`
- `@pm`, `/pm`, `/pm.md` -> `.aiox-core/development/agents/pm.md`
- `@po`, `/po`, `/po.md` -> `.aiox-core/development/agents/po.md`
- `@sm`, `/sm`, `/sm.md` -> `.aiox-core/development/agents/sm.md`
- `@analyst`, `/analyst`, `/analyst.md` -> `.aiox-core/development/agents/analyst.md`
- `@devops`, `/devops`, `/devops.md` -> `.aiox-core/development/agents/devops.md`
- `@data-engineer`, `/data-engineer`, `/data-engineer.md` -> `.aiox-core/development/agents/data-engineer.md`
- `@ux-design-expert`, `/ux-design-expert`, `/ux-design-expert.md` -> `.aiox-core/development/agents/ux-design-expert.md`
- `@squad-creator`, `/squad-creator`, `/squad-creator.md` -> `.aiox-core/development/agents/squad-creator.md`
- `@aiox-master`, `/aiox-master`, `/aiox-master.md` -> `.aiox-core/development/agents/aiox-master.md`
<!-- AIOX-MANAGED-END: shortcuts -->
