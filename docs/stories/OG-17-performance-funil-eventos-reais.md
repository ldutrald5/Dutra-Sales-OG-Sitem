# OG-17 — Performance e Funil com eventos reais

## Status

Ready for Review

## História

**Como** vendedor e gestor comercial,  
**quero** enxergar atividade, funil e negócios parados com fórmulas transparentes,  
**para que** eu tome decisões usando registros reais sem confundir preparação, envio, venda, faturamento e comissão.

## Resultado entregue

A Central de Performance & Operações possui filtros, indicadores auditáveis, funil acessível, comparação de atividade e radar de negócios parados. Cada indicador informa fórmula e fonte. Vendas, faturamento e comissão permanecem indisponíveis até existirem entidades próprias, sem transformar clientes marcados como fechados em faturamento fictício.

## Critérios de aceite

- [x] Filtros por período, segmento, etapa, estado, vendedor e origem.
- [x] Indicadores exibem fórmula, período implícito no seletor e fonte.
- [x] Atividade conta interações registradas e envios de materiais confirmados.
- [x] Abrir WhatsApp, copiar conteúdo ou preparar roteiro não conta atividade concluída.
- [x] Funil exibe Novo, Contatado, Diagnóstico, Proposta, Negociação, Venda e Pós-venda.
- [x] O funil é fotografia do CRM e não altera etapas.
- [x] Conversão evita divisão por zero e informa base pequena.
- [x] Vendas e faturamento usam somente `Sale`; comissão usa somente `Commission`.
- [x] Ausência de `Sale` ou `Commission` aparece como dados insuficientes.
- [x] Negócios sem contato há 14 dias aparecem para ação sem mudança automática.
- [x] O gráfico do funil possui alternativa textual em `aria-label`.
- [x] Mudanças futuras de etapa, ligações salvas e interações geram `ActivityEvent`.
- [x] Comparação de atividade usa o período imediatamente anterior.

## Fórmulas

- **Atividade:** interações confirmadas no CRM + `MaterialShare` com confirmação explícita.
- **Oportunidades:** clientes filtrados, excluindo Perdido/Standby.
- **Conversão:** clientes em Venda ou Pós-venda ÷ oportunidades.
- **Receita:** soma de `Sale.totalCents` no período.
- **Comissão:** soma de `Commission.amountCents` no período.
- **Parado:** oportunidade aberta sem contato registrado há 14 dias ou mais.

## Limites transparentes

- O modelo atual ainda não possui histórico retroativo completo de mudanças de etapa; por isso, tempo por etapa aparece indisponível até acumular eventos reais.
- Produto e parceiro ainda não possuem dados suficientes ligados às oportunidades; os filtros serão ativados quando essas entidades entrarem no fluxo operacional.
- Um status “Venda Fechada” participa da conversão do funil, mas não cria receita, faturamento ou comissão.

## Validação

- `npm run og:performance:test`
- `npm run og:packages:test`
- `npm run og:library:test`
- `npm run og:ops:test`
- `npm run og:check`
- `npm run og:product:test`
- `npm run og:call-ai:test`
- `npm run aiox:config-check`
- revisão visual desktop e responsiva

## File List

- `apps/sistema-og/performance-engine.js`
- `apps/sistema-og/app.js`
- `apps/sistema-og/index.html`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/service-worker.js`
- `scripts/test_performance_dashboard.mjs`
- `package.json`
- `docs/stories/OG-17-performance-funil-eventos-reais.md`
- `docs/stories/OG-14-roadmap-fases-2-a-9.md`

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 1.0 | Performance, funil, filtros, fórmulas e estados insuficientes implementados | Codex |
