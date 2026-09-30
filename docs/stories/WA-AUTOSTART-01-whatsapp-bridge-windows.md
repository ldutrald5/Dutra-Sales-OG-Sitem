# WA-AUTOSTART-01 — AutoStart Windows do Bridge Kaption

## Objetivo

Eliminar a necessidade de abrir terminal manualmente para manter o Bridge WhatsApp/Kaption rodando no computador do vendedor.

## Escopo

- Registrar uma tarefa do Windows no logon do usuário.
- Iniciar `npm run og:whatsapp:bridge` automaticamente.
- Reiniciar automaticamente se o processo encerrar.
- Gravar logs locais fora do Git.
- Expor comandos de instalação, status e remoção.
- Não armazenar segredos em Task Scheduler, Git ou argumentos de linha de comando.
- Resolver o caminho do repositório dinamicamente a partir do próprio script.
- Não exigir alteração manual de caminho absoluto.
- Falhar fechado se `.env` ou as credenciais do Bridge estiverem ausentes.

## Critérios de aceite

- [x] Story criada antes da implementação.
- [x] Launcher PowerShell implementado.
- [x] Instalador de Scheduled Task implementado.
- [x] Comando de status implementado.
- [x] Desinstalador implementado.
- [x] Logs ficam em `apps/sistema-og/.data/logs/`.
- [x] Processo usa `.env` local já existente.
- [x] Task inicia no logon e tenta reiniciar em caso de queda.
- [x] Scripts não contêm segredo.
- [x] Comandos npm registrados.
- [x] Documentação/handoff atualizados.
- [ ] CI completo passa.

## File List

- `scripts/run-whatsapp-bridge.ps1`
- `scripts/install-whatsapp-bridge-autostart.ps1`
- `scripts/status-whatsapp-bridge-autostart.ps1`
- `scripts/uninstall-whatsapp-bridge-autostart.ps1`
- `INSTALL_WHATSAPP_AUTOSTART.cmd`
- `REMOVE_WHATSAPP_AUTOSTART.cmd`
- `scripts/test_whatsapp_autostart_contract.mjs`
- `package.json`
- `docs/stories/WA-AUTOSTART-01-whatsapp-bridge-windows.md`
- `AI_HANDOFF.md`
- `CHANGELOG.md`
