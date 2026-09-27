# OG-18 — Fila Inteligente de Leads & Transcrição

## Objetivo

Transformar a aba **Leads & Transcrição** em uma fila comercial legível por situação da conversa, origem e importância, sem criar bases paralelas de clientes.

## Decisão de produto

O cliente continua único em `state.leads`. Três dimensões permanecem separadas:

1. **Status comercial** — novo, contatado, proposta, negociação, fechado/standby.
2. **Situação da conversa** — primeiro contato, já conversei, não respondeu, aguardando resposta, interessado, proposta, negociação, cliente, cliente fidelizado, sem interesse.
3. **Origem/lista** — arquivo/lote/canal de onde o registro veio.

Prioridade, temperatura, potencial e prazo alimentam uma pontuação determinística de ordenação. A pontuação serve para ordenar; não altera o estágio comercial automaticamente.

## Escopo

- chips de situação com contadores;
- filtros por origem e prioridade;
- ordenação automática por importância;
- cores semânticas e cartões responsivos;
- ficha do cliente com situação, prioridade, temperatura, potencial e origem;
- campos novos aditivos no lead legado;
- teste determinístico do motor de priorização;
- preparação segura para importação do CRM Master real.

## Não escopo

- transcrição automática de áudio;
- IA decidindo estágio ou prioridade;
- migração automática para Company/Contact;
- importação de dados reais para Git;
- sobrescrita silenciosa de registros já trabalhados.

## Critérios de aceite

- listas são visões do mesmo `state.leads`;
- prioridade e situação da conversa podem coexistir;
- lead urgente/vencido aparece antes de lead comum;
- filtros de situação/origem/prioridade combinam entre si;
- mobile apresenta cartões com contexto e próxima ação;
- ficha permite revisar situação sem confundir com status comercial;
- dados legados sem campos novos continuam funcionando por fallback;
- testes e release gate passam antes de merge/deploy.
