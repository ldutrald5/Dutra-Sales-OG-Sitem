# Arquitetura — Sistema OG Copiloto Comercial

## Decisão

Manter a aplicação local, sem backend obrigatório, e estender o modelo de leads já persistido em `localStorage`. A cotação continua sendo o núcleo operacional; o CRM passa a guardar contexto e a tela Meu Dia organiza a rotina.

```text
Leads importados/OCR ─┐
Notas pós-ligação ────┼─> lead comercial ─> Meu Dia
Cotações salvas ──────┘         │             │
                                ├─> CRM/ficha │
                                └─> Cotação <─┘
```

## Modelo de dados adicionado ao lead

- `priority`: `alta | media | baixa`
- `fleetSize`: número de veículos conhecido
- `pain`: dor confirmada ou hipótese explicitamente registrada
- `decisionMaker`: decisor conhecido
- `nextAction`: próximo passo
- `followUpAt`: data e hora ISO local
- `lastContactAt`: data e hora da última interação registrada
- `interactions[]`: histórico de notas com data e tipo

## Limites

- Dados continuam restritos ao navegador atual; backup e sincronização em nuvem ficam para uma story posterior.
- Sugestões são regras determinísticas e exibidas como perguntas, nunca como fatos.
- WhatsApp abre uma mensagem revisável; o sistema não confirma envio nem lê respostas.

## Evolução prevista

1. Backend local/servidor com autenticação e banco persistente.
2. Sincronização explícita com CRM.
3. Resumos por IA com consentimento, deltas e limite de custo.
4. Telemetria de funil e conversão baseada em eventos reais.
