# SEC-DEPS-01 — Corrigir dependências vulneráveis que bloqueiam o CI

Status: **Ready for Review - remediacao parcial, merge bloqueado**

Data: 2026-10-15  
Classificação: **STANDARD**  
Preparação: **@sm**; implementação: **@dev**; veredito: **@qa**; push/PR: **@devops**.

## Objetivo e origem

Como mantenedor do DUTRA OS, quero corrigir as vulnerabilidades npm preexistentes que bloqueiam a validação do PR #118 (Arena), preservando os contratos atuais e permitindo revisão independente da integração Arena.

Origem: autorização do usuário para prosseguir com a correção dos bloqueios em PR separado. Base informada: `main` em `5255dc5`; confirmar SHA completo no início da execução. O relato anterior registra 9 vulnerabilidades altas e 1 crítica; esses totais são **baseline a reproduzir**, não resultado certificado desta story.

## Escopo e restrições

- Investigar `braces`, `handlebars`, `sharp` e suas cadeias ancestrais reais no lockfile/audit.
- Selecionar as menores correções compatíveis, justificadas por versões, advisories e usos reais.
- Preservar AIOX `5.4.1` e contratos existentes salvo evidência documentada que exija outra solução; não fazer downgrade cego do framework.
- Não executar `npm audit fix --force`; não mascarar findings, reduzir severidade do gate nem remover validações para obter aprovação.
- Não alterar dados locais, produção, configuração Railway, deploy, credenciais ou automações de publicação.
- Entregar PR separado. Esta story **não autoriza merge nem deploy**. A verificação de deploy automático e a integração Arena permanecem em seus próprios escopos.

## Critérios de aceitação

- [x] AC1 — Confirmar base/branch e registrar Node/npm efetivamente usados, respeitando `engines` e `packageManager` do projeto.
- [x] AC2 — Reproduzir e guardar o audit inicial, listando severidade, advisory, pacote instalado, ancestral e classificação runtime/desenvolvimento; explicar qualquer divergência dos 9 altos/1 crítico relatados.
- [x] AC3 — Documentar alternativas e aplicar a menor alteração compatível no manifesto/lockfile, sem atualização forçada, downgrade cego ou mudanças funcionais fora do escopo.
- [x] AC4 — Demonstrar `npm ci` reproduzível a partir dos arquivos versionados e árvore instalada coerente; registrar limitações de plataforma ou pacotes nativos.
- [ ] AC5 — Executar `npm audit` e o gate de severidade pertinente ao CI. Não deixar finding alto/crítico sem correção e não declarar desbloqueio enquanto o gate falhar.
- [x] AC6 — Aprovar `npm run lint`, `npm test`, `npm run og:brain:check` e `npm run release:gate`; registrar comando, resultado e evidência, incluindo falhas/avisos reais.
- [x] AC7 — Verificar scripts `typecheck`/`build` e revisão automatizada exigidos pela Constitution: executar se disponíveis; registrar explicitamente ausência/indisponibilidade sem inventar scripts ou aprovação.
- [x] AC8 — Validar regressões dos consumidores de dependências significativamente alteradas, sobretudo processamento de imagens (`sharp`), templates (`handlebars`) e expansão de padrões (`braces`), conforme usos encontrados. Adicionar teste somente quando proteja contrato relevante.
- [x] AC9 — Revisar compatibilidade/licenças das alterações relevantes e registrar riscos residuais, proveniência e rollback na auditoria.
- [x] AC10 — Atualizar checklist/File List desta story, auditoria, changelog e tarefas; atualizar Second Brain apenas para aprendizado durável, com proveniência e refresh/check quando aplicável.
- [ ] AC11 — Obter revisão/veredito de @qa e encaminhar a @devops para PR separado; registrar link e SHA final sem merge/deploy.

## Plano de execução

- [x] Capturar baseline e identificar os consumidores reais antes de escolher versões/overrides.
- [x] Aplicar uma correção pequena por cadeia e inspecionar o diff do lockfile.
- [x] Reinstalar com `npm ci`, repetir audit e testar consumidores afetados.
- [x] Executar gates do repositório e registrar evidências que possam ser repetidas.
- [ ] Consolidar documentação, revisar e publicar somente o PR de correção.

## Evidências e rollback

Auditoria planejada: `docs/audits/2026-10-15-dependency-security-validation.md`. Deve conter baseline/final, justificativas de versões, advisories/fontes, comandos, códigos de saída, regressões verificadas e pendências. Não incluir segredos, dados comerciais ou alegações de saúde de produção.

Rollback: reverter os commits desta story e executar `npm ci` com o manifesto/lockfile restaurados. Isso restaura também as versões vulneráveis anteriores e, portanto, não constitui resolução de segurança. Não há migração nem alteração de dados ou produção autorizada.

## CodeRabbit Integration / revisão de qualidade

- Foco: integridade do lockfile, alcance dos overrides, compatibilidade de dependências transitivas, licença, consumo nativo de `sharp` e ausência de enfraquecimento dos gates.
- @qa confere evidências reproduzíveis e riscos antes do veredito.
- Se CodeRabbit não estiver disponível, registrar **não executado** e realizar revisão explícita; ausência não equivale a aprovação.

## File List

Inicial, prevista; confirmar os arquivos realmente alterados na conclusão:

- `docs/stories/SEC-DEPS-01-auditoria-dependencias.md` — story e checklist.
- `package.json` — override transitivo restrito e comando de regressao.
- `package-lock.json` — resolução reproduzível das versões corrigidas.
- `scripts/test_dependency_security.mjs` — regressao AST/renderer, Sharp e Miniflare reais.
- `scripts/validate.mjs` — integracao do gate de regressao (63 checks).
- `docs/audits/2026-10-15-dependency-security-validation.md` — evidências e rollback.
- `CHANGELOG.md`, `tasks/TODO.md`, `tasks/DONE.md` — status e mudança entregue.
- `docs/second-brain/sources.jsonl`, `decisions.jsonl`, `BRAIN_INDEX.md`, `BRAIN_METRICS.md` — fonte/decisao e superficies geradas.

## Registro de preparação

- 2026-10-15 — @sm criou a story a partir da autorização recebida, de `AGENTS.md`, da Constitution, do Context Router e dos comandos existentes em `package.json`. Nenhum teste executado ou pacote alterado na preparação.
- 2026-10-15 — Patches oficiais disponiveis aplicados; npm ci/lint/63checks/release/brain PASS. AC5 permanece aberto: braces sem patched version, seis pacotes high na cadeia. Arquiteto rejeitou downgrade/fork improvisado e supressao de gate. Nao declarar story concluida ou CI verde.
