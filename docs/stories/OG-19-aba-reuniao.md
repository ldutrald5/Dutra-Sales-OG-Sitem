# OG-19 — Aba REUNIÃO

## Status

Ready for Review

## História

**Como** vendedor usando o DUTRA OS, **quero** conduzir a apresentação comercial em uma aba REUNIÃO com o visual do sistema, **para** diagnosticar a frota, simular economia e registrar anotações durante a conversa.

## Critérios de aceite

- [x] A aba REUNIÃO abre a apresentação de 19 telas pela navegação do DUTRA OS e permite retornar às demais abas pelo mesmo menu.
- [x] A apresentação usa os padrões visuais do DUTRA OS e oferece controles de navegação por teclado e toque em desktop (1440 px) e celular (390 px).
- [x] O diagnóstico, o modo apresentação, o conteúdo demonstrativo e o quadro com desenho e anotações permanecem disponíveis.
- [x] Os simuladores de pneus e diesel recalculam ao alterar entradas e reproduzem os exemplos de R$ 252.000 e R$ 630.000 por ano, respectivamente.
- [x] Respostas, parâmetros e anotações ficam no navegador, sem gravações no CRM ou alterações de schema.

## Validação

- [x] Testar acesso pela navegação, troca de telas, ambos os simuladores e persistência local em desktop (1440 px) e celular (390 px).
- [x] Executar `npm run lint`, `npm test` e `npm run og:check`.
- [x] Confirmar abertura offline da aba pelo service worker após o primeiro carregamento do sistema.

## Entrega

Revisão pelo GitHub. O escopo termina no repositório, sem publicação em produção.

O rascunho usa `sessionStorage` e acompanha a sessão daquela aba. Os vídeos públicos do material de referência exigem conexão e carregam mediante clique.

## File List

- `apps/sistema-og/index.html`
- `apps/sistema-og/app.js`
- `apps/sistema-og/service-worker.js`
- `apps/sistema-og/modules/meeting/{meeting.js,meeting.css,content.js,simulators.js,board.js,icons.js}`
- `package.json`
- `scripts/{validate.mjs,test_meeting.mjs,test_final_candidate_ux.mjs}`
- `CHANGELOG.md`, `DUTRA_OS_CONTEXT.md`, `ROADMAP.md`
- `tasks/TODO.md`, `tasks/DONE.md`
- `docs/stories/OG-19-aba-reuniao.md`
