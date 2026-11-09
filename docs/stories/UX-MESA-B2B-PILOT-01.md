# UX-MESA-B2B-PILOT-01

Status: Ready for Review — piloto local sobre `64caafb089dff29ab15f45bdc4de7e3b5b2384c5`. Sem push ou deploy.

## Objetivo

Dar hierarquia profissional à Mesa Comercial existente, deixando explícitas a conta em foco, a próxima ação e o registro de resultado. Preservar os owners de fila, identidade, Sales Execution, persistência, cotação e proposta.

## Escopo entregue

- Conta selecionada marcada na fila com `aria-current` e rótulo textual “Em foco”.
- Painel da conta reorganizado para mostrar empresa e próxima ação antes das ações auxiliares.
- “Registrar resultado” como única ação visual primária; contato, ficha, Call AI, proposta e aplicação permanecem secundárias.
- Cliente normalizado continua abrindo a revisão Sales Execution existente, com rota explicada na interface.
- Filtros da Mesa continuam acessíveis no mobile em faixa rolável, sem alterar a fila canônica.
- Service worker versionado para atualizar os assets locais quando o pacote vier a ser publicado por missão própria.

## Não escopo

Sem novo CRM, modelo, serviço, score, fila, biblioteca, framework, endpoint, migration ou mudança em Company 360°. Nenhum envio externo. Sem alteração de cotação, proposta, motor técnico ou preço.

## Aceite

- [x] Empresa e próxima ação visíveis com hierarquia explícita.
- [x] Ação primária e secundárias distinguíveis por texto e aparência.
- [x] Seleção, busca e contexto preservados ao abrir/fechar a ficha.
- [x] Registro legado usa o fluxo atual; cliente normalizado usa a revisão Sales Execution atual.
- [x] Mobile e desktop sem overflow nos viewports exigidos.
- [x] Foco e teclado preservados; controles recorrentes com pelo menos 44 px.
- [x] Offline/reconnect/409 e identidade continuam cobertos pelos testes existentes executados nesta branch.
- [x] Evidências reais de navegador antes/depois produzidas com dados sintéticos.

## Arquivos

- `apps/sistema-og/app.js`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/components/ui-components.js`
- `apps/sistema-og/service-worker.js`
- `scripts/test_sales_desk.mjs`
- `scripts/test_meu_dia_browser.mjs`
- `docs/stories/UX-MESA-B2B-PILOT-01.md`

## Rollback

O piloto é um commit local isolado. Não incorporá-lo mantém a integração oficial em `64caafb`. Se incorporado futuramente, reverter somente o commit visual; nenhum dado ou schema precisa ser restaurado.
