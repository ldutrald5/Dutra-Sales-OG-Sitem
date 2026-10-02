# DPA-01 — DUTRA Prompt Architect V1

## Contexto

O projeto já possui Builder Brain, Intelligence Compiler, Context Router, Skills de domínio, QA Guardian e `SubagentPromptBuilder`. Faltava a camada explícita entre uma intenção natural de Lucas e a missão delegável: escolher profundidade, recuperar apenas contexto relevante, delimitar escopo, definir evidência de sucesso e produzir um prompt executável sem repetir toda a memória do projeto.

## Objetivo

Criar `dutra-prompt-architect` como compilador de **intenção → contexto mínimo → especificação → Execution Prompt**, sem duplicar as capacidades existentes.

## Decisão de arquitetura

```text
Lucas
  ↓
DUTRA Prompt Architect
  ↓
Context Router + Second Brain + Skills de domínio
  ↓
Execution Prompt
  ↓
Builder/Dev/UX/CRM/OG Tech/AIOX task
  ↓
QA Guardian
  ↓
Builder Brain learning loop
```

## Regras

1. Builder Brain continua responsável por método/evidência/decisões duráveis.
2. Context Router continua sendo a fonte de roteamento de contexto.
3. `SubagentPromptBuilder` continua empacotando agentes/tasks AIOX; Prompt Architect não copia definições estáticas.
4. Prompt Architect não executa feature quando o pedido é somente gerar a missão.
5. Progressive disclosure é obrigatório.
6. L0/L1 não recebem cerimônia L3.
7. Prompt reutilizável vai para Prompt Library; prompt temporário não precisa ser registrado.
8. Nenhum secret/dado volátil de cliente entra em Skill global.

## Critérios de aceite

- [x] Skill Codex criada e compacta.
- [x] Skill Claude criada com o mesmo contrato.
- [x] Tipos FEATURE/BUG/UX/etc. documentados.
- [x] Níveis L0/L1/L2/L3 documentados.
- [x] Context Manifest obrigatório em L2/L3.
- [x] Regras de token economy documentadas.
- [x] Guardrails DUTRA referenciáveis por escopo.
- [x] Contrato de execução/relatório definido.
- [x] Lint determinístico criado.
- [x] Testes cobrem L0/L1/L2/L3, secrets e arquivos obrigatórios.
- [x] `AGENTS.md`, Context Router, Prompt Library e ADR atualizados no branch de implementação.
- [x] Second Brain atualizado e regenerado.
- [x] Gates relevantes executados no branch.

## Fora de escopo

- reescrever `SubagentPromptBuilder`;
- criar novo banco/vetor de memória;
- criar novo Builder/QA agent;
- alterar lógica comercial do Sistema OG;
- deploy do produto.

## File List

- `.codex/skills/dutra-prompt-architect/SKILL.md`
- `.claude/skills/dutra-prompt-architect/SKILL.md`
- `docs/prompts/architect/PROMPT-ARCHITECTURE.md`
- `docs/prompts/architect/PROMPT-TYPES.md`
- `docs/prompts/architect/TOKEN-ECONOMY.md`
- `docs/prompts/architect/DUTRA-GUARDRAILS.md`
- `docs/prompts/architect/EXECUTION-CONTRACT.md`
- `scripts/prompt-lint.mjs`
- `scripts/test_prompt_architect.mjs`
- `docs/prompts/PROMPT_LIBRARY.md`
- `docs/prompts/PROMPT-MESTRE-EVOLUCAO-SISTEMA-OG.md`
- `docs/intelligence/CONTEXT_ROUTER.md`
- `docs/architecture/DUTRA_INTELLIGENCE_DECISIONS.md`
- `scripts/test_intelligence_compiler.mjs`
- `package.json`
- `AGENTS.md`
- Second Brain JSONL + generated index/metrics

## Evidência de conclusão

- Branch: `feat/dutra-prompt-architect-v1`.
- PR: **#103 — DPA-01: DUTRA Prompt Architect V1** → `dutra-os-ui-v3-premium`.
- GitHub Actions: **Package 00R CI run 401 — success**.
- A suíte `npm run validate` inclui `og:intelligence:test`, que agora executa também `test_prompt_architect.mjs`.
- Nenhuma lógica comercial/runtime do produto foi alterada e nenhum merge na `main` foi realizado.

## Status

Implemented and validated on isolated feature branch; awaiting merge decision for PR #103.
