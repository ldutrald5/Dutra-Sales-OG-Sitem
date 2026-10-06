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


## Whisper local fallback

Quando a transcrição principal não puder concluir a chamada, o Railway pode usar um worker CPU com `faster-whisper`.

Fluxo:

`OpenAI → falha/quota → Whisper local → transcript externo confiável → métricas → revisão`.

- O worker não recebe chave do Supabase e não acessa o CRM.
- O worker recebe somente uma URL temporária assinada do áudio privado.
- O host do áudio é limitado ao projeto Supabase configurado.
- A URL expira em 15 minutos.
- O worker usa autenticação por token interno entre serviços.
- O modelo inicial é `base` em CPU/int8 para equilibrar português, memória e velocidade.
- Jobs são assíncronos; se o worker reiniciar durante uma transcrição, o áudio permanece no Storage e o job pode ser refeito.
- O resultado volta pelo Edge gateway como provider `faster-whisper`.
- Extrações continuam revisáveis e não escrevem fatos no CRM automaticamente.
- “Local/gratuito” significa sem cobrança por minuto da OpenAI; o processamento ainda consome recursos do Railway.


### Implantação Railway atual

O plano atual não permite provisionar mais um serviço. Por isso o worker roda **no mesmo container do `sistema-og`**, em `127.0.0.1:8765`, sem exposição pública. O container usa `Dockerfile.whisper`, com Node 24 para o Sistema OG e Python/faster-whisper para o fallback.

O limite observado do serviço é 1 GB de memória e 2 vCPU. O modelo inicial permanece `base`/CPU/int8; se uso real mostrar pressão de memória ou latência excessiva, o primeiro downgrade seguro é `tiny`, sem mudar o contrato do Call Intelligence.


## CONVERGENCE-01 Stage5 — uso no shell único

Selecione uma conta do CRM. Texto importado é uma entrada manual transitória; áudio exige gravação e upload explícitos. Transcrição literal e sugestões permanecem separadas. A orientação atual utiliza OG_AI_SERVICE com modo local identificado quando nenhum provider estiver conectado. “Revisar sugestão” abre campos editáveis, nunca confirma frota/estágio automaticamente; o resultado só é registrado por aprovação humana. Solicitar proposta não comprova envio.

Troca/reset/discard invalida respostas antigas. Falha normalizada mantém a revisão para retry da mesma sessão; ACK seguido de erro durável mantém campos confirmados bloqueados para concluir a gravação. Offline permite revisão local suportada e explica indisponibilidade remota. Histórico/CRM/follow-up/Meu Dia usam os owners atuais. [Checkpoint e limites de validação](handoffs/V3_UNIFICATION_CHECKPOINT.md).
