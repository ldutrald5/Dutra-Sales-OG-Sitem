# UXR-03 — Fluxo comercial de uma mão só

Status: **incorporado à main pelo RC2; fluxo contato → resultado → próxima ação → avançar está em produção. QA físico final permanece no gate da 1.0.**

## Objetivo

Transformar o ciclo diário em uma sequência contínua:

> cliente → contato → registrar resultado → definir próximo passo → próximo cliente

Sem obrigar o vendedor a voltar para a fila, abrir vários painéis ou salvar informações em etapas separadas.

## Entregas

- o cliente ativo aparece antes da fila no celular;
- tocar em um cliente da fila leva automaticamente ao painel ativo;
- o resultado começa sem opção pré-selecionada, evitando registro acidental;
- resultado e próxima ação são salvos em uma única operação de interface;
- novo CTA primário **Salvar e próximo cliente →**;
- CTA secundário **Salvar e ficar**;
- resultados que limpam próxima ação, como **Sem interesse**, respeitam a regra canônica e não recriam tarefa silenciosamente;
- o próximo cliente é escolhido pelo motor canônico da Mesa de Vendas, excluindo a conta atual;
- quando não há outra conta ativa, o sistema informa explicitamente que a fila terminou;
- o botão principal fica acessível perto do polegar no mobile sem alterar a lógica de dados;
- filtros detalhados da fila ficam fora da primeira camada no celular.

## Regras de segurança

- nenhum contato é marcado como realizado só porque o usuário abriu telefone ou WhatsApp;
- nenhuma próxima ação é criada sem confirmação pelo botão de salvar;
- nenhum resultado vem selecionado por padrão;
- nenhuma recomendação de IA é tratada como fato;
- mudança de UX não altera schema, sync, persistência ou identidade de lead;
- `sem_interesse` continua encerrando a próxima ação conforme `interaction-service.js`.

## Critérios de aceite

1. O usuário consegue registrar resultado + próxima ação e avançar com um único botão.
2. O próximo cliente nunca pode ser o mesmo cliente recém-concluído.
3. Uma fila com somente uma conta encerra de forma explícita.
4. Resultado vazio bloqueia o salvamento.
5. Próxima ação obrigatória bloqueia salvamento quando ausente.
6. `Sem interesse` não exige nem recria follow-up.
7. No celular, cliente ativo aparece antes da fila.
8. CI e `test_sales_desk.mjs` passam antes de merge.
