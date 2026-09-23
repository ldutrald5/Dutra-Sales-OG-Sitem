# Story OG-1 — Copiloto comercial integrado ao Sistema OG

## Objetivo

Transformar a Versão Top do Sistema OG em uma central diária de vendas que reúna cotação, CRM e orientação comercial sem exigir um segundo aplicativo.

## Requisitos

- FR-1: Exibir uma tela "Meu Dia" com retornos vencidos, retornos de hoje, oportunidades prioritárias e registros sem próximo passo.
- FR-2: Permitir registrar, por cliente, dor, decisor, frota, prioridade, próxima ação, follow-up e histórico de interações.
- FR-3: Exibir perguntas sugeridas e alertas comerciais derivados somente dos dados registrados.
- FR-4: Abrir o cliente selecionado no CRM e reaproveitar seus dados na cotação existente.
- FR-5: Não considerar a abertura do WhatsApp como contato realizado.
- FR-6: Persistir os dados localmente e migrar leads antigos sem perda.
- FR-7: Funcionar em desktop e telas menores, com navegação por teclado e estados vazios claros.

## Critérios de aceite

- [x] A tela Meu Dia calcula indicadores a partir da base real de leads.
- [x] Um lead pode receber dados comerciais e uma nota de interação.
- [x] Follow-ups vencidos e do dia são identificados corretamente.
- [x] Sugestões não inventam ROI, necessidade ou decisor.
- [x] Abrir WhatsApp não altera automaticamente o status.
- [x] Leads preexistentes continuam carregando após a migração.
- [x] A interface não depende de API ou chave para funcionar.
- [x] JavaScript passa por verificação sintática.

## File List

- `apps/sistema-og/index.html`
- `apps/sistema-og/app.js`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/README.md`
- `docs/architecture/sistema-og-copiloto.md`
- `docs/design/sistema-og-design-system.md`

## Status

Ready for Review
