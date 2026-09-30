# PLAYBOOK-01 — Ficha de Ataque contextual

Status: **em revisão**

## Objetivo

Colocar na Mesa de Vendas uma preparação comercial curta antes de cada contato, reutilizando o briefing determinístico existente e sem criar um segundo CRM.

## Escopo desta primeira fatia

A Ficha de Ataque deriva somente de fatos já registrados:

- situação/conversation stage;
- status comercial;
- eventos confirmados de proposta;
- próxima ação;
- frota registrada;
- lacunas do briefing PRECALL-01.

Ela classifica o momento comercial em seis perfis conservadores:

1. primeiro contato — conhecimento da OG não confirmado;
2. já houve contato;
3. interesse registrado;
4. proposta/orçamento;
5. negociação;
6. cliente/pós-venda.

Para cada perfil, a Mesa mostra:

- objetivo da conversa;
- abertura sugerida;
- foco da abordagem;
- três perguntas-chave;
- checklist técnico;
- primeiro guardrail “NÃO DIGA AINDA”.

## Regras

- zero IA;
- zero mutação do CRM;
- nenhum estágio muda automaticamente;
- “primeiro contato” não significa que o cliente desconhece a OG; a interface diz que o conhecimento não foi confirmado;
- proposta enviada não significa proposta visualizada;
- aplicação/código/suporte OG permanece **Não determinado / Necessária validação técnica** sem fonte oficial;
- o mesmo `OG_SALES_BRIEF` atende Call AI e Mesa de Vendas.

## Fora desta fatia

- biblioteca completa de mensagens;
- tratamento estruturado de objeções;
- geração automática de proposta;
- aplicação técnica por veículo;
- diário pós-contato;
- IA generativa.

Esses itens entram em incrementos posteriores para evitar big bang.

## Arquivos

- `apps/sistema-og/services/sales-brief-service.js`
- `apps/sistema-og/app.js`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/service-worker.js`
- `scripts/test_sales_brief.mjs`

## Critérios de aceite

1. perfis são derivados sem inferir fatos ausentes;
2. primeiro contato mantém “conhecimento da OG não confirmado”;
3. cliente/proposta/negociação recebem abordagem própria;
4. Mesa exibe a Ficha de Ataque antes do registro da conversa;
5. check técnico nunca inventa aplicação;
6. mobile empilha o conteúdo;
7. regressão PRECALL-01 continua coberta;
8. CI completo precisa passar antes de merge.
