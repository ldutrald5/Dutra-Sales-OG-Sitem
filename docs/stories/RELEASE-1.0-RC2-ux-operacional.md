# DUTRA OS 1.0 RC2 — UX operacional do Meu Dia

## Objetivo
Reduzir atrito no ciclo diário do vendedor sem criar novas entidades nem novas regras comerciais.

Fluxo alvo:

`selecionar conta → ligar/WhatsApp → registrar resultado → definir próxima ação → salvar e avançar`

## Mudanças
- ação **Registrar** visível no Cliente Atual;
- clicar em **Ligar** deixa o formulário de resultado pronto para o retorno da chamada;
- quatro resultados rápidos apenas preenchem o resultado escolhido; nada é salvo automaticamente;
- registro aberto é preservado durante o fluxo da mesma conta;
- botões de salvar são bloqueados ao iniciar a gravação para reduzir duplicidade por clique repetido;
- atalho `R` abre o registro no Meu Dia;
- orientação visual em três passos;
- cache PWA atualizado para entregar a UX nova.

## Integridade
- abrir o discador não cria contato nem resultado;
- somente `recordResult()` grava resultado confirmado;
- próxima ação continua usando `setNextAction()`;
- avanço continua usando `OG_SALES_DESK.nextLead()`;
- nenhuma alteração destrutiva em CRM, histórico ou storage.

## Aceite
- mobile permite chegar ao registro em um toque;
- desktop mantém teclado e fluxo rápido;
- nenhum resultado é pré-selecionado;
- CI completo precisa ficar verde antes do merge.
