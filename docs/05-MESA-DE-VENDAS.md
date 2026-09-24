# Mesa de Vendas

## Objetivo

A Mesa de Vendas será a principal interface diária: uma fila de trabalho com conta ativa, histórico e ações rápidas no mesmo contexto. Ela deve reduzir a administração entre uma conversa e a próxima.

## Rotina alvo

| Bloco | Uso principal |
|---|---|
| 09:00–11:00 | Prospecção e ligações pela fila priorizada |
| 11:00 | Revisão de resultados, notas e próximos passos |
| Pós-almoço | Novo bloco comercial e follow-ups |
| 17:00–17:30 | CRM, pendências, resumo e planejamento seguinte |

## Estrutura proposta

- Esquerda: fila de hoje, atrasados, prioridades e pesquisa.
- Centro: conta atual, contatos, estágio, próxima ação e timeline.
- Direita: painel contextual com Call AI, comunicação, cotação e materiais.
- Cabeçalho: prospect rápido, busca global e comandos frequentes.

No celular, as três áreas viram navegação sequencial preservando a conta ativa.

## Ações rápidas

WhatsApp, Ligação, Não atendeu, Pós-ligação, Apresentação, Orçamento, Follow-up, Retomar negociação, Indicação, E-mail, Proposta Premium e Call AI. Cada ação informa qual fato será registrado e nunca presume envio ou atendimento.

## Prospect rápido

Cadastro mínimo:

1. Empresa.
2. Telefone.
3. Nome do contato, opcional.

Entrada natural futura:

> Rodolog 4499999999 falei com João frota grande ligar quinta

A extração deve mostrar os campos reconhecidos para confirmação. Pode usar regras locais primeiro e IA econômica apenas para texto ambíguo.

## Reuso obrigatório

- Fila e priorização de Meu Dia.
- `state.leads` e ficha atual do CRM.
- links de WhatsApp e telefone existentes.
- modal de cadastro rápido existente.
- eventos e projeções de Performance.
- Call AI, cotação e Biblioteca como painéis contextuais.

## Critérios de sucesso

- Cadastrar e inserir um prospect na fila sem abandonar a mesa.
- Registrar resultado, nota e próxima ação em uma passagem curta.
- Abrir ficha, WhatsApp, ligação ou Call AI mantendo a conta selecionada.
- Funcionar offline e sincronizar depois.
- Não criar uma segunda base de clientes.
