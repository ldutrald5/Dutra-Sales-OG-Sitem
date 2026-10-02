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

- Rode `npm run lint` (checagem sintática real do Sistema OG)
- Rode `npm test` (suíte completa, equivalente a `npm run validate`)
- Rode `npm run og:brain:check` quando alterar decisões, arquitetura ou o Builder Brain
- Rode `npm run release:gate` antes de propor uma release
- Atualize checklist e file list da story antes de concluir
<!-- AIOX-MANAGED-END: quality -->

<!-- AIOX-MANAGED-START: codebase -->
## Project Map

- Aplicação comercial: `apps/sistema-og/`
- Backend local: `apps/sistema-og/server.mjs`
- Backend Cloudflare: `cloudflare/worker.mjs`
- Testes e gates: `scripts/test_*.mjs`, `scripts/validate.mjs`, `scripts/release-gate.mjs`
- Builder Brain: `.codex/skills/dutra-builder-brain/`, `docs/second-brain/`
- Runtime Operator: `.codex/skills/dutra-runtime-operator/`, `docs/runtime/DUTRA_OS_RUNTIME.md`
- Framework AIOX: `.aiox-core/`
- Documentação: `docs/`
<!-- AIOX-MANAGED-END: codebase -->

<!-- AIOX-MANAGED-START: commands -->
## Common Commands

- `npm run validate`
- `npm run og:brain:refresh`
- `npm run release:gate`
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
| Produção, Railway, deploy, domínio, logs e acesso no celular | `.codex/skills/dutra-runtime-operator/SKILL.md`, `docs/runtime/DUTRA_OS_RUNTIME.md` |
| Planilhas, Excel, backup/exportação CRM e vendas | `docs/11-INTEGRACAO-EXCEL.md`, `docs/spreadsheets/CANONICAL_TEMPLATES.md`, `docs/spreadsheets/canonical-templates.json` |

### Regra de templates canônicos de planilhas

Quando a tarefa envolver CRM Excel/ODS, exportação, backup em planilha, vendas, faturamento ou comissão, carregue primeiro `docs/11-INTEGRACAO-EXCEL.md` e `docs/spreadsheets/canonical-templates.json`. Os binários reais são privados e não devem ser commitados. Sempre trabalhar sobre cópia do modelo e preservar fórmulas, campos manuais e estrutura.

### Regra de runtime hospedado

Quando a tarefa envolver sistema online, Railway, deploy, domínio, logs, health check, link atual ou acesso pelo celular, carregue `.codex/skills/dutra-runtime-operator/SKILL.md` e consulte o estado ao vivo da infraestrutura antes de responder. Documentação e memória são apenas localizadores; não comprovam que o runtime está saudável.

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



## DUTRA Intelligence pre-flight

Para trabalho STANDARD/STRUCTURAL do DUTRA OS, use a inteligência durável antes de criar solução nova:

1. leia `docs/intelligence/README.md`;
2. roteie a tarefa por `docs/intelligence/CONTEXT_ROUTER.md`;
3. consulte a Skill da área e somente os documentos indicados;
4. consulte `docs/second-brain/BRAIN_INDEX.md` para decisões/perguntas relacionadas;
5. procure incidente semelhante em `docs/incidents/BUGBOOK.md`;
6. procure implementação e testes existentes antes de afirmar que algo não existe.

Regras:
- não criar uma segunda memória/knowledge base paralela ao Second Brain;
- dados voláteis de cliente permanecem no CRM/banco, nunca em Skills globais;
- conhecimento substituído deve ser marcado/superseded, não apagado silenciosamente;
- bug relevante deve gerar regra/teste quando determinístico;
- decisões, regras e aprendizados novos devem ser avaliados para incorporação ao Second Brain;
- rode `npm run og:intelligence:test` quando alterar Skills, context router, BUGBOOK, playbooks, prompt library ou regras permanentes.

## External Agent Skills — integration policy

For third-party skills/tools surfaced during development, read `docs/AGENT-SKILLS-POLICY.md` before installing or coupling them to the product.

Additional rules:
- Apply YAGNI/minimal-change discipline: understand first, reuse existing modules, make the smallest reversible change, and do not add speculative abstractions.
- Voice/video/browser-agent tools are optional developer capabilities, not core CRM dependencies.
- Do not commit third-party API keys, model files, recordings, cookies, browser profiles, or customer data.
- Public-web automation must respect access controls, terms, rate limits, and privacy; do not use stealth/anti-detection to bypass enforcement.
- Any third-party runtime dependency requires a concrete DUTRA OS use case, license/security review, pinned version, smoke test, and rollback path.


## DUTRA Prompt architecture

Quando o usuário pedir para transformar uma ideia, bug ou planejamento em prompt/especificação para outro agente:

1. carregue `.codex/skills/dutra-prompt-architect/SKILL.md`;
2. roteie o contexto por `docs/intelligence/CONTEXT_ROUTER.md`;
3. use L0/L1/L2/L3 de forma proporcional ao risco;
4. para L2/L3, inclua `CONTEXT_MANIFEST` com `required`, `conditional` e `do_not_load`;
5. não cole toda a Base Mestra, Second Brain, `docs/` ou `knowledge/` “por garantia”;
6. Prompt Architect não substitui Builder Brain, QA Guardian, Skills de domínio nem `SubagentPromptBuilder`;
7. prompts reutilizáveis podem entrar em `docs/prompts/PROMPT_LIBRARY.md`; prompts temporários não precisam virar memória permanente.

Rode `npm run og:prompt:test` quando alterar Prompt Architect, seus contratos ou o lint.
