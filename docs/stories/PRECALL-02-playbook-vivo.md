# PRECALL-02 — Ficha de Ataque + Playbook Vivo

Status: **concluído no código; aguardando merge/release**

## Objetivo

Transformar o briefing pré-ligação em uma orientação operacional específica para o momento comercial real da conta, sem criar uma segunda fonte de verdade e sem gravar sugestões como fatos.

## Entrega

O Call AI passa a mostrar uma **Ficha de Ataque** determinística com:

- momento do cliente;
- objetivo da conversa;
- como chegar;
- abertura de ligação;
- mensagem inicial de WhatsApp;
- preparação técnica antes de propor;
- resultado mínimo esperado da conversa;
- perguntas para descobrir;
- guardrails “NÃO DIGA AINDA”.

## Momentos comerciais cobertos

- primeiro contato;
- já conversei / retomada;
- não respondeu;
- aguardando resposta;
- interessado;
- proposta enviada;
- negociação;
- cliente;
- cliente fidelizado;
- sem interesse registrado.

O momento é derivado apenas de campos já existentes (`conversationStage`, `status`, `operationalStatus` e evidência de interações). O playbook não altera estágio, prioridade, dor, frota ou decisão.

## Preparação técnica

A ficha só considera dado técnico confirmado quando o lead já possui informação registrada. Na ausência, orienta a confirmar:

- marca/modelo/ano/configuração;
- pressão de trabalho;
- eixo/posição/aplicação;
- escala da frota.

Aplicação OG desconhecida permanece como **Necessária validação técnica**. Nenhum suporte, código, libragem ou ROI é inventado.

## Mensagens

As aberturas e mensagens são templates determinísticos de orientação. Abrir, copiar ou visualizar um texto não registra envio.

## Fonte de verdade

`apps/sistema-og/services/sales-brief-service.js` continua lendo somente o lead e eventos operacionais confiáveis. A interface apenas projeta o resultado no Call AI.

## Testes

`og:sales-brief:test` cobre:

- primeiro contato;
- proposta enviada;
- negociação;
- cliente;
- preparação técnica conhecida/desconhecida;
- wiring da Ficha de Ataque na interface.

## Próxima evolução

Conectar o mesmo playbook à Conta 360/Mesa e adicionar o Diário Inteligente Revisável para fechar o ciclo pré-contato → contato → pós-contato.
