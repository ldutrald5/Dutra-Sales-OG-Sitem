# DUTRA Prompt Architect — arquitetura do Execution Prompt

## Pipeline

~~~text
INTENÇÃO DE LUCAS
  ↓
CLASSIFICAR TYPE + LEVEL
  ↓
CONTEXT ROUTER
  ↓
PRE-FLIGHT (estado, decisões, bugs, reuso, testes)
  ↓
CURRENT STATE → TARGET STATE
  ↓
SCOPE / OUT OF SCOPE
  ↓
EXECUTION PLAN + GUARDRAILS
  ↓
ACCEPTANCE + TEST PLAN + DoD
  ↓
PROMPT LINT
  ↓
EXECUTOR ESPECIALIZADO
  ↓
QA / LEARNING LOOP
~~~

## Template canônico

~~~text
# MISSION
[resultado em uma frase]

# WHY
[problema/valor]

# CURRENT STATE
[fatos comprovados; UNKNOWN quando necessário]

# TARGET STATE
[comportamento visível e verificável]

# CONTEXT MANIFEST
required:
- ...
conditional:
- ...
do_not_load:
- ...

# SOURCE OF TRUTH
- ...

# PRE-FLIGHT
1. auditar...
2. procurar reuso...
3. checar decisão/bug/teste...

# SCOPE
- ...

# OUT OF SCOPE
- ...

# EXECUTION PLAN
1. ...

# REUSE FIRST
- ...

# TECHNICAL / UX / BUSINESS CONSTRAINTS
- somente o que afeta a missão

# DO NOT
- ...

# FAILURE HISTORY
- bug/causa/prevenção relacionados, se houver

# DATA SAFETY
- se aplicável

# ACCEPTANCE CRITERIA
- [ ] observável/verificável

# TEST PLAN
- comando/teste real existente ou teste a criar

# DEFINITION OF DONE
- ...

# FINAL REPORT
Retornar: arquivos alterados, decisões, testes executados, resultado, riscos e pendências.
~~~

## Regras de escrita

- escrever resultado desejado, não “faça algo melhor”;
- separar fato de hipótese;
- mandar auditar o desconhecido;
- critérios de aceite descrevem comportamento, não intenção;
- arquivo provável não é permissão para editar fora do escopo;
- `do_not_load` é proteção de contexto, não proibição arquitetural;
- não obrigar todas as seções em L0/L1 se não agregarem decisão.
