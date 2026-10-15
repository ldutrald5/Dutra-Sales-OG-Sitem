# SEC-GLOB-02 — Substituir a cadeia vulnerável de glob/braces com contratos preservados

Status: **Ready for Review - gates locais PASS, CI/publicacao pendentes**
Data: 2026-10-15  
Classificação: **STRUCTURAL — ferramentas de desenvolvimento**  
Responsáveis: @sm prepara; @architect revisa a solução; @dev implementa; @qa valida; @devops publica o PR.

## Objetivo e origem

Como mantenedor do DUTRA OS, quero remover a cadeia vulnerável de `braces` usada pelas ferramentas AIOX sem perder os comportamentos reais de busca de arquivos e observação de diretórios, para que a correção de segurança seja verificável e mantenha o fluxo CLI operacional.

Origem: autorização do usuário para investigar o uso real do AIOX e executar a menor substituição compatível. Base informada: `1a42ad9`, trabalho relacionado ao PR #119; confirmar SHA completo e relação entre branches antes de implementar. Esta story não presume que uma substituição específica já tenha sido aprovada ou demonstrada compatível.

## Restrições e alternativas em investigação

- Inventariar tanto o pacote AIOX instalado quanto o código vendorizado em `.aiox-core/`; manifesto alterado sem correspondência nos consumidores reais não comprova correção.
- Preservar APIs e CLIs efetivamente usadas, incluindo opções, formatos de retorno e tratamento de erros relevantes.
- Investigar `chokidar` 4 com diretórios concretos e o adaptador de `fast-glob` para `glob` 10 já existente. São alternativas sob revisão de @architect, não decisões desta story.
- Não criar fork de `braces`, mascarar `npm audit`, enfraquecer gates ou declarar equivalência por simples instalação bem-sucedida.
- Não executar atualização forçada ou downgrade cego do framework.
- Não alterar produção, Railway, dados locais, credenciais ou automações de publicação; não fazer merge nem deploy.
- Se uma incompatibilidade impedir a remoção segura, registrar o bloqueio e manter a entrega incompleta em vez de afirmar conclusão.

## Critérios de aceitação

- [x] AC1 — Confirmar base/branch, Node/npm e baseline de segurança; identificar versões instaladas e todas as cadeias que mantêm `braces` vulnerável.
- [x] AC2 — Inventariar consumidores instalados e vendorizados, com caminhos, imports/requires, APIs/CLI, padrões e opções reais de `fast-glob`, `chokidar` e ancestrais relevantes. Distinguir código em uso, código vendorizado e dependências não alcançadas no escopo examinado.
- [x] AC3 — Submeter a @architect a comparação das alternativas, incluindo limitações de `chokidar` 4 com glob e compatibilidade do adaptador existente; registrar a decisão e sua proveniência antes de concluir a substituição.
- [x] AC4 — Implementar a menor mudança compatível aprovada, preservando contratos reais e garantindo que instalação limpa reproduza qualquer adaptação necessária. Não depender de edição manual não versionada em `node_modules`.
- [x] AC5 — Criar testes diferenciais com fixtures e comparar resultados antigos/novos para padrões positivos/negativos, expansão de braces, arquivos dot, caminhos absolutos e todas as opções encontradas nos consumidores reais. Documentar diferenças de ordenação, erros ou semântica que afetem os contratos.
- [x] AC6 — Exercitar watcher real em diretório temporário: inicialização/ready, criação (`add`), modificação (`change`) e remoção (`unlink`), isolamento de arquivos ignorados, encerramento e ausência de recursos pendentes. Cobrir criação posterior em subdiretório quando usada pelos consumidores.
- [x] AC7 — Executar os consumidores core afetados em cenários seguros de desenvolvimento, comprovando suas APIs/CLI reais. Testar o adaptador isoladamente não basta para certificar o consumidor.
- [x] AC8 — Demonstrar `npm ci` reproduzível, lockfile íntegro e árvore coerente. Rodar auditoria da raiz; se manifesto/lockfile de `.aiox-core/` for alterado, validar sua instalação e auditoria próprias e explicar o alcance de cada árvore.
- [x] AC9 — Executar `npm run og:dependency-security:test`, `npm run lint`, `npm test`, `npm run og:brain:check` e `npm run release:gate`, além dos testes específicos novos; registrar códigos de saída e resultados reais. Scripts `typecheck`/`build` e revisão automatizada devem ser executados se disponíveis, ou explicitamente registrados como ausentes/indisponíveis.
- [x] AC10 — Registrar auditoria final e não declarar a cadeia removida enquanto findings ou consumidores incompatíveis permanecerem; distinguir falha preexistente de regressão com evidência reproduzível.
- [x] AC11 — Revisar licenças e notices dos pacotes/adaptadores alterados, documentar riscos residuais e rollback; atualizar story, documentação e evidências com os arquivos efetivos.
- [ ] AC12 — Obter veredito de @qa, registrar revisão arquitetural e encaminhar somente publicação de PR a @devops, sem merge/deploy.

## Plano e acompanhamento

- [x] Capturar baseline e mapear consumidores nas duas árvores.
- [x] Validar alternativas com @architect e registrar decisão.
- [x] Implementar mudança mínima reproduzível e fixtures diferenciais.
- [x] Verificar watcher e consumidores core reais.
- [x] Reinstalar, auditar e executar gates pertinentes.
- [ ] Consolidar evidências, revisão de licença e rollback; solicitar revisão de @qa.

## Evidências e rollback

Registrar em auditoria dedicada os SHAs, ambientes, inventário, advisories/fontes, decisão arquitetural, comandos, códigos de saída, comparação de contratos e resultados. O teste diferencial deve poder ser repetido sem introduzir novamente dependência vulnerável na árvore final. Não registrar segredos ou dados comerciais.

Rollback: reverter os commits da substituição e reinstalar com os manifestos/lockfiles restaurados. O rollback recupera o comportamento anterior, mas também pode recuperar vulnerabilidades e não constitui solução de segurança. Não há migração de dados ou alteração de produção autorizada.

## CodeRabbit Integration / revisão

Foco: semântica dos padrões, opções silenciosamente ignoradas, eventos duplicados/perdidos do watcher, caminhos Windows, recursos abertos, reprodutibilidade das adaptações e integridade das árvores instaladas/vendorizadas. Revisão automatizada indisponível deve ser registrada como não executada; somente @qa emite o veredito de qualidade.

## File List

Lista inicial prevista; substituir possibilidades por caminhos reais na conclusão:

- `docs/stories/SEC-GLOB-02-substituicao-cadeia-braces.md` — critérios e acompanhamento.
- `package.json`, `package-lock.json` — somente resolução/gates necessários.
- `.aiox-core/package.json` e eventual lockfile correspondente — somente se a decisão aprovada exigir mudança na árvore vendorizada.
- Adaptador existente e consumidores core identificados pelo inventário — discriminar caminhos exatos antes de concluir; nenhum novo módulo é presumido.
- `scripts/test_dependency_security.mjs` e testes específicos de glob/watcher — somente mudanças necessárias aos contratos demonstrados.
- Auditoria dedicada em `docs/audits/` e decisão arquitetural vinculada — registrar caminhos finais.
- `CHANGELOG.md`, `tasks/TODO.md`, `tasks/DONE.md` — mudança e status.
- `docs/second-brain/` — somente aprendizado durável com proveniência e refresh/check aplicáveis.

Arquivos efetivos adicionais: `.npmrc`, `.aiox-core/.npmrc`,
`tools/fast-glob-compat/{package.json,index.cjs,LICENSE,README.md}`,
`scripts/test_glob_compat.mjs`, `scripts/fixtures/glob-compat-baseline.json`,
`scripts/validate.mjs`, `.github/workflows/glob-compat-ci.yml`,
`docs/architecture/ADR-SEC-GLOB-02.md`,
`docs/audits/2026-10-15-glob-compat-validation.md`,
`docs/01-ARQUITETURA.md`, `AI_HANDOFF.md`, `DUTRA_OS_CONTEXT.md`, `ROADMAP.md`,
e `docs/second-brain/{sources.jsonl,decisions.jsonl,BRAIN_INDEX.md,BRAIN_METRICS.md}`.

## Registro de preparação

- 2026-10-15 — @sm criou a story a partir da autorização recebida e das regras de `AGENTS.md`/Constitution. Nenhum pacote alterado, teste executado ou solução arquitetural certificada nesta preparação.
