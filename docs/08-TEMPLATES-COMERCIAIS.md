# Templates comerciais

## Arquitetura

```text
Template base + Variáveis + Contexto selecionado do cliente + IA opcional
```

O caminho padrão não usa IA. O usuário escolhe o modelo, revisa os campos preenchidos e decide entre **Usar template** e **Personalizar com IA**.

## Contrato proposto

- `id`, nome, versão e status;
- canal e objetivo comercial;
- segmentos e estágios aplicáveis;
- corpo com variáveis `{{variavel}}`;
- campos obrigatórios e opcionais;
- instruções de revisão;
- data, autor e fonte;
- variante de documento/PDF quando aplicável.

## Variáveis seguras iniciais

`{{primeiro_nome}}`, `{{empresa}}`, `{{vendedor}}`, `{{telefone_vendedor}}`, `{{proxima_acao}}`, `{{data_follow_up}}`. Produto, valor, prazo, garantia, ganho e condições só podem aparecer quando vierem de fonte confirmada da conta ou do catálogo oficial.

## Regras

- Variável obrigatória vazia bloqueia o estado `ready`.
- A prévia mostra exatamente o conteúdo a copiar/exportar.
- Personalização com IA recebe somente template, objetivo e contexto necessário.
- IA não altera números, condições ou alegações protegidas.
- Modelos têm versão; documentos gerados registram qual versão usaram.
- Dez modelos de mensagem e dez de PDF permanecem placeholders até conteúdo aprovado.

## Categorias planejadas

Primeiro contato, decisor, não atendeu, pós-ligação, apresentação, orçamento, follow-up, recuperação, preço, redução de custos, fechamento, pós-venda e indicação.

Conteúdo comercial ainda não fornecido deve permanecer `[CONHECIMENTO PENDENTE]`.
