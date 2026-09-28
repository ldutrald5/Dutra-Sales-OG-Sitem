# DUTRA-CORE-01 — Command Core Foundation

## Objetivo
Criar contratos executáveis mínimos para o futuro sistema multiagente sem acoplar provedores externos nem alterar o fluxo comercial atual.

## Escopo
- Agent Registry.
- Integration Registry.
- Mission Router determinístico.
- níveis de autonomia;
- criação de pedido de aprovação para ações externas/irreversíveis;
- teste de contrato.

## Fora do escopo
- executar LLM;
- pesquisar web automaticamente;
- enviar mensagens;
- alterar produção;
- substituir Automation Engine atual.

## Critérios de aceite
- "day.prepare" roteia para Account Analyst;
- capacidade desconhecida falha de forma segura;
- integrações expõem operações permitidas;
- ações externas exigem aprovação;
- módulo funciona em Node e browser;
- teste dedicado passa.

## Próximo
DUTRA-CORE-02: Execution Log, Approval Queue persistível e adapter contract.
