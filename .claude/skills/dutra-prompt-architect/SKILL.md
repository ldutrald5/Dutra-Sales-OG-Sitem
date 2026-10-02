---
name: dutra-prompt-architect
description: Transforma uma intenção, ideia, bug ou planejamento do DUTRA OS em uma missão executável, com contexto mínimo, escopo, guardrails, critérios de aceite e testes. Use quando o usuário pedir para planejar, especificar, gerar um prompt para outro agente, preparar uma implementação, decompor uma feature, investigar um bug ou converter uma ideia vaga em instruções de execução sem desperdiçar tokens.
metadata:
  short-description: Intenção → contexto mínimo → especificação → prompt executável
---

# DUTRA Prompt Architect

Compilar intenção humana em um **Execution Prompt** preciso sem duplicar o Builder Brain, o Context Router ou o SubagentPromptBuilder.

## Fronteiras

- `dutra-builder-brain`: método, evidência, arquitetura, pacote e aprendizado durável.
- `docs/intelligence/CONTEXT_ROUTER.md`: decide **qual contexto carregar**.
- `SubagentPromptBuilder`: empacota definições AIOX de agente/task/checklist/template.
- `dutra-prompt-architect`: transforma a intenção atual em **contrato de missão**, seleciona profundidade, contexto e critérios de aceite.
- executor especializado (`dutra-dev`, `dutra-product`, `dutra-crm`, `dutra-og-tech`, `@dev`, etc.): implementa.
- `dutra-qa-guardian`: valida regressões e evidência de conclusão.

Não usar esta Skill para executar a feature inteira quando o pedido for somente gerar/estruturar o prompt.

## Ativação

Usar quando ocorrer pelo menos um caso:

- “crie um prompt para implementar…”;
- “planeje isso direito antes de executar”;
- “quero chegar em X, monte a missão”;
- feature/bug/refactor/UX/integração ainda descritos de forma vaga;
- tarefa STANDARD/STRUCTURAL que será delegada a outro agente;
- pedido de reduzir tokens/contexto sem perder precisão;
- necessidade de decidir o que o executor deve ler, evitar, testar e provar.

Para alteração MICRO já inequívoca, usar caminho curto; não fabricar documentação pesada.

## Protocolo

1. **Classificar missão**: FEATURE, BUG, REFACTOR, UX_UI, ARCHITECTURE, RESEARCH, DATA, CRM, SALES, OG_TECH, DEPLOY, QA, PERFORMANCE, INTEGRATION ou DOCUMENTATION.
2. **Classificar profundidade**: L0, L1, L2 ou L3 conforme `docs/prompts/architect/PROMPT-TYPES.md`.
3. **Ler `AGENTS.md`** e rotear por `docs/intelligence/CONTEXT_ROUTER.md`.
4. Para STANDARD/STRUCTURAL, consultar `docs/second-brain/BRAIN_INDEX.md`, decisão/incidente relacionado e a Skill de domínio.
5. Pesquisar implementação/teste equivalente antes de afirmar “não existe”.
6. Definir `CURRENT_STATE → TARGET_STATE` sem inventar lacunas.
7. Montar `CONTEXT_MANIFEST` com `required`, `conditional` e `do_not_load`.
8. Delimitar `SCOPE` e `OUT_OF_SCOPE`.
9. Definir reuso obrigatório, guardrails, failure history, dados/segurança quando relevantes.
10. Definir critérios verificáveis, testes e evidência de conclusão.
11. Gerar o prompt no menor nível que preserve a qualidade da decisão.
12. Para L1–L3, rodar `node scripts/prompt-lint.mjs <arquivo> --level=Lx` quando o prompt for salvo em arquivo.

## Pre-flight anti-amnésia

Antes de escrever o prompt, responder internamente:

- Qual é o estado atual comprovado?
- Qual resultado visível define sucesso?
- Já existe algo parcial ou equivalente?
- Existe decisão ativa que restringe a solução?
- Existe bug/anti-pattern relacionado?
- Que fonte de verdade será afetada?
- Que arquivos/testes provavelmente importam?
- O que explicitamente não deve mudar?
- Qual agente/Skill é melhor executor?
- Qual o menor contexto que evita decisão errada?

Se uma resposta material estiver desconhecida, instruir o executor a **auditar** em vez de preencher por suposição.

## Progressive disclosure

Não copiar Base Mestra, Second Brain ou documentos inteiros para o prompt.

Preferir:

~~~text
CONTEXT_MANIFEST
required:
- docs/04-CRM.md
- apps/sistema-og/services/company-360-service.js
- scripts/test_company_360.mjs
conditional:
- docs/incidents/BUGBOOK.md se a auditoria reproduzir regressão conhecida
do_not_load:
- documentação de OG técnico não relacionada
~~~

Carregar contexto variável da conta/cliente somente em runtime e apenas se a missão precisar dele.

## Estrutura do Execution Prompt

Usar somente seções relevantes ao nível escolhido:

- `# MISSION`
- `# WHY`
- `# CURRENT STATE`
- `# TARGET STATE`
- `# CONTEXT MANIFEST`
- `# SOURCE OF TRUTH`
- `# PRE-FLIGHT`
- `# SCOPE`
- `# OUT OF SCOPE`
- `# EXECUTION PLAN`
- `# REUSE FIRST`
- `# UX / BUSINESS RULES`
- `# TECHNICAL CONSTRAINTS`
- `# DO NOT`
- `# FAILURE HISTORY`
- `# DATA SAFETY`
- `# ACCEPTANCE CRITERIA`
- `# TEST PLAN`
- `# DEFINITION OF DONE`
- `# FINAL REPORT`

Ver `docs/prompts/architect/PROMPT-ARCHITECTURE.md` e `EXECUTION-CONTRACT.md`.

## Economia de tokens

Aplicar `docs/prompts/architect/TOKEN-ECONOMY.md`.

Regras essenciais:

- referência por caminho > cópia de conteúdo;
- contexto por domínio > repositório inteiro;
- não repetir a mesma regra em várias seções;
- não ensinar fundamentos a agente especialista;
- exemplos somente quando eliminarem ambiguidade;
- L0/L1 para tarefa pequena;
- contexto histórico somente se mudar a decisão atual;
- fatos dinâmicos ficam fora de Skills/prompt global.

## Guardrails DUTRA

Carregar `docs/prompts/architect/DUTRA-GUARDRAILS.md` quando a missão tocar produto/código real.

Nunca gerar prompt que, sem revisão explícita:

- reescreva o DUTRA OS do zero;
- crie segunda fonte de verdade;
- duplique motor técnico/score/CRM;
- invente suporte técnico ou fato de cliente;
- trate memória de deploy como estado live;
- faça migração destrutiva sem checkpoint/rollback;
- declare teste/deploy como PASS sem evidência.

## Integração AIOX

Quando a execução usar AIOX:

1. Prompt Architect define o **contrato da missão**.
2. Se houver task/agent AIOX existente, delegar empacotamento final ao `SubagentPromptBuilder` em vez de duplicar definição completa de persona/task/checklists.
3. Para story end-to-end, respeitar `full-sdc` e seu preflight; não reconstruir o payload depois do gate.

## Feedback loop

Após uma execução relevante, avaliar:

- faltou contexto?
- houve ambiguidade?
- executor saiu do escopo?
- houve regressão?
- contexto ficou grande demais?
- alguma instrução virou padrão reutilizável?

Aprendizado durável retorna ao Builder Brain/Second Brain; não inflar esta Skill com história específica.

## Saída esperada

Entregar:

1. classificação (`TYPE`, `LEVEL`, `EXECUTOR`);
2. contexto a carregar;
3. Execution Prompt pronto para copiar/executar;
4. lacunas que exigem validação, se houver;
5. opcionalmente caminho do prompt registrado quando for padrão reutilizável.

## Stop conditions

Parar e pedir decisão/validação quando houver conflito com ADR ativo, fonte de verdade ambígua, risco de perda de dados, regra técnica não confirmada, ação externa não autorizada ou escopo L3 sem objetivo/critério de sucesso compreensível.
