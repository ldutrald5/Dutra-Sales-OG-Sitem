# PLAYBOOK-01A — Ficha de Ataque pré-contato

Status: **implementado em branch; aguardando validação/merge**

## Objetivo

Transformar o briefing pré-ligação existente em uma preparação comercial acionável para cada conta, sem criar nova base, sem gravar inferências e sem depender de IA.

## Escopo desta fatia

A Ficha de Ataque é derivada somente de fatos já presentes no lead e em eventos operacionais. Ela mostra:

- momento comercial registrado: primeiro contato, retomada, interesse, proposta, negociação, cliente ou sem interesse;
- nível de conhecimento da Olho de Gato somente quando houver campo explícito; caso contrário, “Não confirmado no CRM”;
- objetivo recomendado para a conversa;
- abertura sugerida conforme o momento;
- preparação técnica mínima antes de argumentar ou cotar.

## Guardrails

- “Primeiro contato” não significa automaticamente que o cliente desconhece a OG.
- Conhecimento do produto não é inferido de notas ou do estágio.
- Aplicação/suporte técnico continua exigindo veículo, eixo, pressão e regra OG confirmados.
- ROI/economia não vira promessa.
- A ficha é somente leitura e não muda estágio, próxima ação ou fatos do CRM.

## Integração

A primeira superfície é o briefing pré-ligação do Call AI, reutilizando `sales-brief-service.js`.

## Próximas fatias

1. Registrar explicitamente o nível de conhecimento OG de forma revisável.
2. Variar mensagens/abordagens por perfil de cliente e canal.
3. Ligar a Ficha de Ataque ao Account 360 e Mesa de Vendas.
4. Preparação técnica contextual usando Technical Brain validado.
5. Fechar o ciclo com Diário Inteligente pós-contato.
