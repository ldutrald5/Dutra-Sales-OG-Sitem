# P0-CRM-PERSISTENCE-RECOVERY-01

Status: revisão P0-CRM-PERSISTENCE-REVIEW-02 concluída com correções locais; GO condicionado para revisão de incorporação, sem publicação. O candidato original 84aeb31 foi reprovado nos casos adversariais descritos abaixo. Implementação local autorizada em P0-A-REMOTE-INTEGRATION-03. Base: `7519e4a1330cea9bccd983f4fb1cebb40a4dc982`, agora publicada na integração; sem deploy. Backlog visual e seus documentos não entram neste pacote.

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


## P0-CRM-PERSISTENCE-REVIEW-02 — 2026-11-09

A implementação recuperada em `84aeb31735071a64ce9c0defa4b74619aafbdbd3` é filha direta de `7519e4a1330cea9bccd983f4fb1cebb40a4dc982`. Os 20 hashes do manifesto anterior conferiram e a árvore estava limpa. Revisão limitada ao delta; sem reconstrução de frontend ou implementação do backlog visual.

### Defeitos reproduzidos e correções autorizadas

- **F01 / ALTO:** depois da checagem de destino vazio, uma criação concorrente de estado era substituída pelo rename do restore. Uma troca de diretório por symlink no mesmo ponto também sobrescrevia outra fixture. Publicação exclusiva por hardlink de temporário sincronizado agora recusa nomes existentes; checagem de identidade/realpath do diretório detecta a troca demonstrada. Testes usam interceptação determinística de filesystem, não sleeps ou retries.
- **F02 / MÉDIO:** CLI recusava IDs Railway e NODE_ENV production, mas aceitava RAILWAY_PUBLIC_DOMAIN/OG_PUBLIC_DOMAIN, que o próprio servidor usa para reconhecer hospedagem. Guarda alinhada a todos esses sinais, sem modificar auth. Esta guarda previne execução acidental; não é barreira contra um operador que controla o shell e apaga variáveis.
- **F03 / BAIXO:** apagar stateUpdatedAt explicitamente nulo mantinha o checksum válido e fazia o restore usar createdAt. Backup selado agora exige a propriedade, mantendo o algoritmo e os backups v1 selados válidos. Backups legados sem checksum continuam aceitos explicitamente, sem autenticidade presumida.

### Evidência atual e reutilizada

- [x] Regressão anterior: **4 FAIL / 2 PASS**, contra o código original84, antes das correções.
- [x] **19/19** cenários existentes de falhas/CLI e **12/12** HTTP reais reexecutados após a correção.
- [x] **7/7** regressões de revisão: destino concorrente, symlink tardio, todos os sinais hospedados reais, remoção de timestamp, guardas/confirm-local, falha de hardlink e permissões0700/0600. Falha na publicação do estado mantém marcador e impede vazio falso no próximo read.
- [x] Gates estáticos/Brain/release e integridade do delta registrados no relatório da revisão.
- [x] **85 gates, 19 comerciais e 6 sync são evidência histórica homologada da implementação84**, não resultados reexecutados nesta revisão. Sem mudanças em frontend, servidor HTTP, regras de revisão/409/outbox, preços ou fórmulas.

Execução atual em Bubblewrap com fonte read-only, filesystem/processos privados, variáveis permitidas explicitamente, capabilities zeradas e rede externa ENETUNREACH; loopback funcional. Nenhum dado real, credencial produtiva ou operação externa. Evidências: `/workspace/artifacts/P0-CRM-PERSISTENCE-REVIEW-02-20261109/`. Branch local `fix/crm-persistence-review-02`; commit final identificado pelo Git/manifesto, sem SHA auto-referencial nesta story.

### Limites e decisão

**NO-GO para incorporar84 isoladamente. GO condicionado para revisão e incorporação conjunta de84 + correção desta revisão**, mantendo o escopo de um processo escritor e recuperação offline em diretório privado confiável. Não autoriza push ou deploy. Backup independente/off-host e restore do volume real continuam não comprovados. Múltiplos escritores, adversário local com controle do mesmo UID/parent paths e power loss continuam fora das garantias. Restore precisa de hardlinks no filesystem; falha sem fallback destrutivo se indisponíveis. Somente Linux testado. Não apagar marcador/resíduos para insistir em um destino parcialmente restaurado; preservar evidência e escolher novo destino. JSON legado válido e backups sem checksum permanecem cobertos pelos testes existentes.

File list adicional: `server-state-store.cjs`, `crm-state-recovery.mjs`, `test_state_recovery_review.mjs`, `package.json`, contrato de dados, esta story, checkpoint, changelog e registros/índices do Brain. Nenhum lockfile, migration, auth, catálogo, preço, marketing, design ou dado operacional alterado.

Rollback local por reversão do commit de revisão, após autorização e análise; isso reintroduz os três defeitos. Para abandonar apenas a tentativa de revisão, retornar à branch anterior preserva84 e a evidência. Não restaurar dados nem apagar backups/marcadores automaticamente. Não há deploy desta revisão para desfazer.
