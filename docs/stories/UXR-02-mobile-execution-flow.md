# UXR-02 — Fluxo móvel de execução comercial

Status: **implementado na branch de preview; aguardando validação visual**

## Problema observado

Mesmo após reduzir a navegação, a rotina principal ainda mostrava informação demais ao mesmo tempo. No Meu Dia, o vendedor via ações, formulário de resultado, próxima ação, mensagens, histórico, sinais e automações em uma única sequência. Na ficha do cliente, todos os campos avançados apareciam de uma vez.

## Regra de UX

> Primeiro: quem é o cliente, o que fazer agora e como registrar o resultado. Todo o restante aparece sob demanda.

## Entregas

- Meu Dia destaca um único bloco **AGORA** com a próxima ação;
- ações principais ficam em Ligar, WhatsApp e Call AI;
- Ficha completa vira ação secundária;
- registro de conversa/retorno passa a ser expansível;
- mensagens e histórico ficam recolhidos por padrão;
- Signal Center / Automation Engine deixam de ocupar a primeira camada no celular;
- lista de Clientes vira cards móveis com apenas cliente, prioridade, situação, próxima ação e botão Abrir ficha;
- Contexto, Origem e seleção em massa deixam de disputar espaço no celular;
- ficha do cliente começa mostrando somente identidade, contato e dados operacionais essenciais;
- classificação, código OG, CNPJ, e-mail, campos avançados, telefones extras, indicações, histórico e Company 360 ficam atrás de **Mostrar dados completos**;
- nenhuma informação foi removida do modelo; apenas a apresentação foi reorganizada.

## Guardrails

- sem alteração de schema;
- sem migração de dados;
- sem alteração no significado de status, prioridade ou score;
- WhatsApp aberto continua diferente de mensagem enviada;
- resultado e próxima ação continuam exigindo ação explícita;
- produção não é alterada antes da validação do preview.

## Critérios de aceite

1. No celular, o cliente atual mostra uma próxima ação clara antes de formulários.
2. Registrar conversa exige no máximo um toque para expandir.
3. Histórico não aparece aberto por padrão.
4. Lista de clientes não vira tabela horizontal no celular.
5. Abrir ficha mostra primeiro os campos essenciais.
6. Dados avançados continuam acessíveis em um toque.
7. Desktop continua com acesso completo.
8. CI, Sales Desk e Client Sheet tests passam.
