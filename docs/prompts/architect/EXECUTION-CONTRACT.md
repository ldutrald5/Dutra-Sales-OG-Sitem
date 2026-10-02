# DUTRA Prompt Architect — contrato de execução

## Contrato entre Architect e executor

O Execution Prompt deve permitir que outro agente responda quatro perguntas antes de editar:

1. **O que precisa mudar?**
2. **O que não pode mudar?**
3. **Que evidência define sucesso?**
4. **Que fonte de verdade deve governar a implementação?**

## Pre-flight do executor

Antes de escrever código:

- ler os itens `required` do Context Manifest;
- buscar implementação equivalente;
- confirmar source of truth;
- localizar teste/bug/ADR relacionado;
- registrar divergência entre prompt e realidade antes de improvisar.

## Durante a execução

- fazer a menor mudança reversível;
- reutilizar contratos/componentes/serviços existentes;
- manter alterações fora do escopo intocadas;
- adicionar teste para regra nova/regressão reproduzível;
- não transformar UNKNOWN em requisito inventado;
- preservar dados e segredos.

## Conclusão

Não usar “concluído” como opinião. Reportar evidência:

~~~text
STATUS: PASS | PARTIAL | BLOCKED | FAIL
FILES_CHANGED:
TESTS_RUN:
TEST_RESULTS:
ACCEPTANCE_EVIDENCE:
RISKS_REMAINING:
DECISIONS_OR_LEARNING:
~~~

Se teste não foi executado, registrar `NOT RUN` ou `BLOCKED`.

## Delegação AIOX

Quando já existir agent/task AIOX, o prompt gerado deve conter o contexto e contrato específico da missão, e deixar o empacotamento de persona/task/checklists para o `SubagentPromptBuilder`/workflow. Não duplicar milhares de tokens de definição estática.
