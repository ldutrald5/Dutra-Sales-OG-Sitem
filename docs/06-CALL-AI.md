# Call AI

## Estado atual

O Call AI seleciona uma conta real do CRM, define objetivo, prepara roteiro em oito etapas, recebe notas e permite revisar alterações antes de gravar. O Sales Brain local é consultado sob demanda; sem ele, o fluxo continua com contexto do CRM e perguntas seguras. A gravação usa APIs do navegador e permanece local.

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
