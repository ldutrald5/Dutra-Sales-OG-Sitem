# OG-10 — Evolução operacional do Sistema OG 2026

## Resultado

Unificar a entrada de clientes e preparar a evolução de transportadoras, vendas, ROI, modelos comerciais e árvore técnica sem criar dados comerciais ou técnicos falsos.

## Entrega 1 — implementada

- [x] Cadastro rápido compartilhado em Meu Dia, Leads/Transcrição e Call AI.
- [x] Novo cliente salvo no mesmo CRM e imediatamente disponível em todas as telas.
- [x] Call AI explica quais recursos aparecem depois de preparar o roteiro.
- [x] ROI passa a calcular pneus usando vida útil atual de 18 meses e ganho de 20%.
- [x] Micro-ônibus e vans adicionados como segmentos comerciais.
- [x] Mapa de produto e prompt mestre documentados.

## Entregas seguintes

- [ ] Galeria de até dez modelos de mensagem, com prévia e estados rascunho/publicado.
- [ ] Galeria de até dez modelos de PDF, com prévia e estados rascunho/publicado.
- [ ] Transportadoras com site, telefones, cobertura estruturada, fontes e mapa do Brasil.
- [ ] Central de Vendas com ferramentas por segmento, além da calculadora.
- [ ] Árvore de ônibus, micro-ônibus e vans após validação da folha oficial de peças.

## Critérios da entrega 1

- O cadastro exige empresa e aceita contato, telefone, cidade, segmento, prioridade, próxima ação e retorno.
- A origem Call AI mantém o usuário no Call AI e já seleciona o novo cliente.
- A origem CRM abre a ficha do novo cliente.
- A origem Meu Dia atualiza a fila sem criar um registro paralelo.
- O ROI anual de pneus compara o custo anual do ciclo de 18 meses com o ciclo de 21,6 meses.
- Nenhum código de suporte para van ou micro-ônibus é criado sem a fonte oficial.

## Arquivos

- `apps/sistema-og/index.html`
- `apps/sistema-og/app.js`
- `apps/sistema-og/data.js`
- `apps/sistema-og/service-worker.js`
- `docs/architecture/sistema-og-product-map.md`
- `docs/prompts/PROMPT-MESTRE-EVOLUCAO-SISTEMA-OG.md`
- `docs/stories/OG-10-evolucao-operacional-2026.md`

