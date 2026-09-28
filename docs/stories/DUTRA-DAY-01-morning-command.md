# DUTRA-DAY-01 — Morning Command

Status: **concluído no código; aguardando merge/release**

## Objetivo

Fazer o DUTRA OS responder de forma operacional ao comando **“Dutra, começa meu dia”** usando os mesmos fatos, score, sinais e automações já existentes.

## O que o briefing mostra

- retornos vencidos;
- retornos de hoje;
- sinais comerciais;
- automações sugeridas;
- pós-venda/expansão;
- próxima missão;
- contas/sinais mais relevantes;
- status da agenda externa.

## Contratos reutilizados

O Morning Command não cria novos scores nem filas:

- fila: `OG_SALES_DESK`;
- score: `OG_LEAD_INTELLIGENCE`;
- sinais/missão: `OG_SIGNAL_CENTER`;
- rotinas: `OG_AUTOMATION_ENGINE`;
- roteamento: `OG_COMMAND_CORE`;
- auditoria: `OG_COMMAND_EXECUTION`.

## Auditoria

Cada execução cria:

1. `command.mission.started`;
2. briefing somente leitura;
3. `command.mission.completed` com contagens e próxima conta, ou `failed` em erro.

Nenhum lead é alterado ao gerar o briefing.

## Agenda

A integração externa de agenda **não é simulada**. Enquanto um adapter de Calendar não estiver conectado ao runtime, o briefing exibe explicitamente que a agenda externa não está conectada. O restante do Morning Command funciona integralmente com o CRM local/canônico.

## UX

- novo CTA **DUTRA, COMEÇA MEU DIA** no Meu Dia;
- Command Center/Ctrl+K reconhece o mesmo atalho;
- painel responsivo com resumo e próxima missão;
- sinais e rotinas abrem a conta mestre;
- botão da próxima missão preserva o Mission Control existente.

## Segurança / custo

- zero chamada de IA;
- zero chamada externa;
- nenhum envio;
- nenhuma mutação comercial;
- log passa pela redaction do Command Core.

## Testes

`og:morning-command:test` cobre contagens, agenda não conectada, agenda fornecida explicitamente, imutabilidade dos leads, dependências canônicas e wiring do shell/PWA.

## Rollback

Remover o painel/serviço não altera os fatos comerciais. Os eventos `command.mission.*` podem permanecer como histórico auditável.
