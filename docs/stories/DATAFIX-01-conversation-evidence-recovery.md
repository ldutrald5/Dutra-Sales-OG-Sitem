# DATAFIX-01 — Recuperação de situação da conversa por evidência

Status: **implementado em branch; sem mutação automática de dados**

## Sintoma

Clientes históricos de pós-venda apareciam em massa como **Cliente** na "Situação da conversa", mesmo quando a planilha continha observações como "Não atende", "Recusou chamada", "Está em reunião, entrar em contato mais tarde" ou notas de conversa já realizada.

Também aparecia "Venda Fechada" junto de uma situação atual como "Não respondeu", o que confundia relacionamento histórico com estado atual da conversa.

## Causa raiz

O sistema misturava duas dimensões:

1. `status=fechado` — fato comercial/histórico: já é cliente OG;
2. `conversationStage` — estado operacional da conversa atual.

Quando não existia `conversationStage` explícito, `lead-intelligence.js` transformava qualquer `status=fechado` em `customer` antes de olhar evidências de contato.

Além disso, o importador preservava `OBS` como observação protegida, mas não derivava uma situação de conversa a partir dessas anotações.

## Correção

- `fechado` deixa de forçar `customer` como situação de conversa;
- evidência explícita continua tendo precedência;
- resultado/interação recente passa a ter precedência;
- `accountSummary` e `observacoes` passam por regras determinísticas e conservadoras;
- qualquer observação válida sem sinal mais específico significa `talked`;
- cliente histórico sem evidência de conversa nesta rotina fica em `first_contact`;
- importações futuras recuperam estágio a partir de OBS quando não existe coluna explícita;
- o card mostra **Cliente OG** para `status=fechado`, evitando a impressão de que a venda acabou de fechar;
- filtros de situação com contagem zero deixam de ocupar a primeira camada.

## Regras determinísticas de evidência

- "não atende", "não atendeu", "recusou chamada", "sem resposta" → `no_reply`;
- "em reunião", "entrar em contato mais tarde", "retornar", "aguardando resposta" → `waiting_response`;
- "proposta enviada", "orçamento enviado" → `proposal`;
- "em negociação", "negociando", "contraproposta" → `negotiation`;
- "interessado", "demonstrou interesse" → `interested`;
- "sem interesse", "não tem interesse", "não quer continuar/comprar" → `not_interested`;
- outra observação não vazia → `talked`.

## Guardrails

- não reescrever observações;
- não inventar data de retorno;
- não criar interações retroativas automaticamente;
- não alterar `status` comercial;
- não transformar frases genéricas com "não" em "sem interesse";
- estágio explícito válido continua prevalecendo;
- nenhum dado do cliente é incluído em fixtures ou documentação pública.

## Aceite

1. Cliente histórico sem contato atual não aparece como "Cliente" na situação da conversa.
2. "Não atende" resulta em "Não respondeu".
3. "Está em reunião, entrar em contato mais tarde" resulta em "Aguardando resposta".
4. Nota de conversa como "Ainda não instalou..." resulta em "Já conversei".
5. `status=fechado` continua preservado e apresentado como "Cliente OG".
6. Reimportar planilha com OBS recupera a situação sem sobrescrever observação protegida.
7. CI, import tests e lead-intelligence tests passam.
