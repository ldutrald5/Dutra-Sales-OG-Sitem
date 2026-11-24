# OG-20 — Biblioteca oficial e atualização do DUTRA OS

## Status

Ready for Review

## História

**Como** usuário do DUTRA OS, **quero** consultar o acervo oficial da Olho de Gato pela Biblioteca Comercial e atualizar a instalação pelo próprio sistema, **para** encontrar materiais de vendas e manter o aplicativo atualizado com os dados locais preservados.

## Critérios de aceite

- [x] A aba Biblioteca Comercial mostra o acervo público de [www.olhodegato.com](https://www.olhodegato.com/) na interface nativa do DUTRA OS, pois o site oficial bloqueia a incorporação da página por iframe.
- [x] O catálogo contém as galerias oficiais de fotos, vídeos, segmentos e regiões, com busca, filtros e acesso ao OGW Frotas. Conferir na fonte os totais de referência de 79 fotos, 36 vídeos, 11 segmentos e 5 regiões.
- [x] O catálogo oficial é somente leitura. A substituição da aba visível preserva os materiais anteriormente cadastrados, seus metadados e os anexos existentes.
- [x] A opção de atualização no desktop local consulta a branch `main` do repositório oficial do DUTRA OS no GitHub e permite aplicar a versão disponível com confirmação do usuário. O fluxo funciona em instalações inicializadas por download, além das cópias Git.
- [x] A atualização local mantém CRM, anexos e configurações e informa o resultado. Falhas deixam a instalação e os dados operacionais utilizáveis.
- [x] No PWA hospedado, a opção verifica e carrega uma nova versão já publicada quando disponível. O PWA usa o mecanismo de atualização da publicação.

## Validação

- [x] Conferir a cobertura do catálogo e testar busca, filtros e acesso aos materiais em desktop e celular.
- [x] Verificar atualização local em uma cópia com dados de teste, incluindo instalações baixadas, e confirmar preservação dos dados.
- [x] Testar o fluxo de atualização do PWA e executar `npm run lint`, `npm test` e `npm run og:check`.

## Resultado

- Acervo conferido com as 79 fotos e 36 vídeos oficiais. As 115 prévias são servidas pelo DUTRA OS e os arquivos originais permanecem na fonte.
- Chromium em desktop e celular confirmou filtros, paginação, prévias, teclado e atualização do service worker.
- Em uma instalação de teste sem Git, o botão atualizou o SHA servido no mesmo endereço e preservou a configuração, a revisão do CRM, os arquivos de dados e os anexos IndexedDB.
- Validado o pacote real gerado pelo GitHub para a `main` e a reversão após falha de inicialização com dados de teste.
- A execução do inicializador em um PC Windows físico permanece pendente.

## CodeRabbit

Revisar no pull request a validação da origem da atualização, a preservação dos dados locais e a recuperação em caso de falha.

## File List

- `apps/sistema-og/modules/official-library/` e `apps/sistema-og/assets/official-library/`
- `apps/sistema-og/{index.html,app.js,styles.css,service-worker.js,.assetsignore}`
- `apps/sistema-og/modules/desktop-update.js`
- `apps/sistema-og/{server.mjs,server-desktop-update.mjs}`
- `INICIAR-SISTEMA-OG.cmd` e `scripts/start-og-desktop.mjs`
- `scripts/{test_official_library.mjs,test_desktop_update.mjs,test_final_candidate_ux.mjs,validate.mjs}`
- `.gitignore` e `package.json`
- `README.md`, `CHANGELOG.md`, `DUTRA_OS_CONTEXT.md`, `ROADMAP.md`, `AI_HANDOFF.md` e `docs/01-ARQUITETURA.md`
- `tasks/TODO.md`, `tasks/DONE.md` e esta story
