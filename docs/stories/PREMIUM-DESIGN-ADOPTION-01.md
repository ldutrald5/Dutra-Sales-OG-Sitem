# PREMIUM-DESIGN-ADOPTION-01

Status: Ready for Review — implementação experimental local; publicação não autorizada.

## Objetivo

Adotar Precision Workspace na Mesa existente sobre o piloto `a47df3d`, cujo pai é a baseline `64caafb`. Fila, identidade, registro, cotação e sync continuam nos owners atuais. Pacote de recuperação permanece em worktree separado.

## Aceite

- [x] Git/worktrees e handoff reconciliados sem reconstrução.
- [x] Tokens semânticos escopados à Mesa, sem nova stack.
- [x] Fila legível, conta em foco, ação destacada e registro contextual.
- [x] Mobile com duas vistas do mesmo estado; busca e seleção preservadas.
- [x] Chromium real em oito viewports e inspeção visual antes/referência/depois.
- [x] Selecionar, registrar, salvar/avançar, ficha, cotação/retorno e homônimos.
- [x] Offline/reconnect/503/409/outbox e regressões pertinentes.
- [x] Contraste computado, tipografia, teclado, reflow320/720 e ausência de overflow. Zoom nativo e leitor de tela não testados.
- [x] Lint, npm test85/85, Brain214/0warnings e release gate executados.
- [x] Commit local, árvore limpa, evidências e rollback preparados para entrega.

## Arquivos

- `apps/sistema-og/components/precision-workspace.css`
- `apps/sistema-og/index.html`
- `apps/sistema-og/app.js`
- `apps/sistema-og/components/ui-components.js`
- `apps/sistema-og/service-worker.js`
- `scripts/test_meu_dia_browser.mjs`
- `scripts/test_precision_workspace_browser.mjs`
- `scripts/test_commercial_identity_browser.mjs`
- `docs/design/PRECISION_WORKSPACE_V1.md`
- `docs/03-DESIGN-SYSTEM.md`
- `docs/second-brain/sources.jsonl`, `decisions.jsonl` e índices gerados
- `CHANGELOG.md`, `tasks/TODO.md`, `tasks/DONE.md`
- Esta story.

## Limites e rollback

Sem auth/backend/recuperação/migrations, dados reais, dependências novas ou publicação. Company 360 completa, Prospecção e shell global ficam para outros lotes. Reverter o commit desta story remove stylesheet/markup/adaptações de apresentação sem restaurar dados. Não reverter o piloto anterior nem a persistência.

## Evidências atuais

Pasta privada `/workspace/artifacts/PREMIUM-DESIGN-ADOPTION-01-20261109/`: comparação A piloto/B referência/C implementação; capturas reais nas três vistas, logs e execução por comando. Mesmo conjunto QA no comparativo piloto/depois; a composição do handoff é referência conceitual com valores fictícios próprios. Chromium headless, não aparelhos físicos. Testes em Bubblewrap com fonte read-only, filesystem/rede/PID privados, ambiente por allowlist e loopback sem uplink. Nenhum resultado atual é inferido de CI antigo.

A suíte comercial ampliada teve uma execução com17 casos PASS e timeout na espera do preview após delete/import; uma execução do piloto anterior passou19/19. A rodada delimitada com diagnósticos adicionais passou19/19 no candidato. Logs da ocorrência preservados; não houve modificação do importer, aumento de timeout, nova tentativa interna ou asserção enfraquecida. A causa histórica não foi demonstrada pelo simples desaparecimento do sintoma; permanece ressalva intermitente para acompanhamento próprio. Precision final inclui também as seções de apoio expandidas, fluxo de atalhos e teclado; PASS em todos os cenários.
