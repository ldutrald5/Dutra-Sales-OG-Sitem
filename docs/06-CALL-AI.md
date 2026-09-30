# Call AI

## Estado atual

O Call AI seleciona uma conta real do CRM, define objetivo, prepara roteiro em oito etapas, recebe notas e permite revisar alterações antes de gravar. O Sales Brain local é consultado sob demanda; sem ele, o fluxo continua com contexto do CRM e perguntas seguras. A gravação começa somente por ação explícita. Depois de encerrada, o vendedor pode mantê-la local ou enviá-la explicitamente para o cofre privado do Call Intelligence.

## Visão

O Call AI será o **Centro de Inteligência Comercial da conta**, atendendo ligação, diagnóstico, objeções, negociação, fechamento, follow-up, comunicação, expansão e indicação.

## Contexto permitido por sessão

- empresa, segmento, contato e cargo;
- estágio, oportunidade e objetivo;
- resumo do histórico e última interação;
- dores confirmadas e hipóteses claramente marcadas;
- objeções, propostas, valores e produtos registrados;
- próxima ação e prazo;
- trechos relevantes e rastreáveis da base OG.

Não enviar o banco completo. O montador de contexto seleciona somente campos e trechos ligados ao objetivo atual.

## Saídas

- resumo curto da conta;
- perguntas de diagnóstico com motivo;
- roteiro adaptado ao objetivo;
- tratamento de objeção sem inventar prova;
- próximos passos sugeridos;
- rascunho de follow-up;
- proposta de atualizações do CRM para revisão.

## Guardrails

- Separar fato, hipótese e sugestão.
- Não prometer preço, garantia, economia ou aplicação técnica sem fonte.
- Não salvar conclusão de IA como fala do cliente.
- Não iniciar gravação, transcrição, envio ou edição de CRM sem ação explícita.
- Informar ausência de conhecimento com `[CONHECIMENTO PENDENTE]`.
- Gravação local não equivale a transcrição; descarte e retenção precisam de regra própria.

## Evolução incremental

1. Consolidar contexto compacto da conta.
2. Reutilizar Call AI dentro da Mesa de Vendas.
3. Produzir resumo e extrações revisáveis como IA econômica.
4. Reservar análise estratégica profunda para solicitação explícita.

## Central integrada — TASK-008

- A Mesa e o Modo Prospecção abrem a mesma Central com a conta ativa.
- Onze intenções comerciais compartilham contexto, prompts e serviço de IA centralizados.
- Abrir a tela, selecionar uma conta ou usar template não chama IA; geração ocorre somente após ação explícita.
- O contexto limita histórico, omite telefone/CNPJ quando desnecessários e troca integralmente ao mudar de conta.
- Sem provedor configurado, respostas seguras locais mantêm a operação disponível e informam que não houve chamada externa.
- Respostas são estruturadas e só viram nota, próxima ação ou alteração de CRM após confirmação do vendedor.
- A personalização de templates reutiliza o mesmo motor e sempre retorna para uma prévia editável.


## Call Intelligence V1

A gravação passa a ter um ciclo durável e auditável:

`captura local → revisão → upload privado → transcrição opcional → métricas → vínculo com call_attempt`.

- Microfone mede atividade da voz do vendedor.
- Em **Áudio do PC + microfone**, os canais são medidos separadamente antes da mixagem, permitindo estimar tempo de fala do vendedor, tempo do cliente e sobreposição.
- O áudio remoto fica no bucket privado `call-recordings`.
- A transcrição automática é server-side e depende de um provedor configurado no Edge runtime.
- Sem provedor, o áudio continua armazenável e uma transcrição colada manualmente pode alimentar as métricas.
- Métricas incluem duração, cobertura de transcrição, palavras, perguntas, objeções, palavras-chave e menções numéricas.
- Extrações da conversa são **candidatos revisáveis**; não viram frota, dor, preço, estágio, reunião ou outro fato canônico sem confirmação.
- Quando o resultado da ligação entra no Sales Execution, a gravação pode ser vinculada ao `call_attempt` e à oportunidade.
- O Call AI exibe também um resumo agregado dos últimos 30 dias.
