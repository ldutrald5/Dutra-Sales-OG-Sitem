# P0-CRM-PERSISTENCE-RECOVERY-01

Status: Ready for Review — implementação e QA locais concluídos; não publicada. Implementação local autorizada em P0-A-REMOTE-INTEGRATION-03. Base: `7519e4a1330cea9bccd983f4fb1cebb40a4dc982`, agora publicada na integração; sem deploy. Backlog visual e seus documentos não entram neste pacote.

## Escopo

Proteger a fronteira JSON existente contra vazio falso e sobrescrita após corrupção/I/O; manter cópia anterior recuperável e demonstrar export/restore explícito em diretório isolado. Reutilizar OG_DATA_SAFETY e owners atuais. Sem novo CRM, banco, dependências, auth, fórmula ou alteração produtiva.

## Aceite

- [x] RED em HTTP real com fixtures sintéticas, antes da correção.
- [x] Ausência legítima distinta de estado corrompido/ilegível/desaparecido.
- [x] Erro de armazenamento retorna falha sanitizada; não publica vazio nem confirma escrita.
- [x] Escrita atômica e backup anterior validado; falhas de I/O preservam o último arquivo e IDs/histórico.
- [x] Export/restore somente por escolha explícita, sem sobrescrever destino existente; repetição idempotente.
- [x] Recuperação em nova pasta após indisponibilizar a origem; reinício preserva revisão, IDs e documentos.
- [x] Outbox, 503/409 e conflitos preservados.
- [x] Gates e diff revisados; Brain/checkpoint/limites/rollback registrados.

## Evidências

Em execução no sandbox Bubblewrap comprovado. Arquivos de dados temporários e fictícios; fonte read-only durante QA. Evidências locais fora do Git; nenhuma prova de recuperação independente do Railway é inferida de fixture.

## File list

- `apps/sistema-og/server.mjs`: delegação de leitura/escrita e HTTP503 sanitizado; regras de autenticação e sincronização preservadas.
- `apps/sistema-og/server-state-store.cjs`: fronteira de filesystem, backup anterior v1/checksum, export e restore explícito; não é novo owner CRM.
- `scripts/crm-state-recovery.mjs`: comando local com caminhos explícitos, confirmação e recusa em ambiente hospedado.
- `scripts/test_state_storage_http.mjs`, `scripts/test_state_storage_recovery.mjs`: 12 casos HTTP/CLI/restart +19 casos de falha/backup/restore.
- `scripts/test_sync_reconnect_browser.mjs`: novo caso de corrupção real503 sem enfraquecer os cinco casos existentes.
- `package.json`, `scripts/validate.mjs`: sintaxe e gate focado, sem dependências.
- `docs/02-BANCO-DE-DADOS.md`, esta story, checkpoint, changelog, contexto/handoff, tarefas e Brain (fonte/incidente/índices): contrato/limites e evidência.

## Resultado executado

RED no servidor original: **4 PASS / 7 FAIL**, incluindo sobrescrita efetiva de bytes sintéticos corrompidos por PUT0. Patch final: **31/31 casos focados PASS**; `npm test`: **85/85 command gates PASS**; lint PASS; browser comercial19/19 e sync6/6 PASS. O browser comercial gerou/reabriu PDF sintético e manteve identidade/valores. Nova rodada completa após corrigir timestamp explicitamente nulo no restore; nenhuma asserção enfraquecida. A primeira tentativa de runner não executou a aplicação porque `.git` em worktree é arquivo; montagem adaptada e probes de isolamento passaram antes dos testes.

Código executado em `7519e4a` mais diff local, posteriormente congelado em commit local; registrar SHA exato pelo Git/manifesto, sem campo auto-referencial. Logs e fixtures portáteis: `/workspace/artifacts/P0-CRM-PERSISTENCE-RECOVERY-01-20261108/`. Incidente: `INC-CRM-STATE-READ-EMPTY-001`. Não atribui a falha histórica de delete/import a corrupção de arquivo.

## Limites

Uma cópia anterior no mesmo volume não é backup independente. A prova de separação é entre diretórios temporários, com origem indisponível e novo processo, não Railway/off-host. O JSON preserva referências de mídia, mas não exporta blobs IndexedDB, segredos de autenticação ou `public-proposals.json` separado. Checksum da fronteira/CLI não substitui assinatura/autenticidade nem altera o merge legado do navegador. Não há serialização entre múltiplos processos escritores, garantia de power loss ou detecção de exclusão externa de toda a evidência; legado sem marcador só registra evidência durável no primeiro write protegido. Backup anterior pode estar uma revisão atrás. Destino de restore é novo ou exatamente igual, nunca o servidor ativo.

## Rollback

Reverter somente o commit local desta correção quando autorizado, após conferir estado válido e backup; o código antigo volta a ter o fallback inseguro, então não reativá-lo sobre armazenamento corrompido. não apagar backups/marcadores nem restaurar dados antigos automaticamente. Não há runtime desta missão publicado para desfazer.
