# SEC-DEPS-01 - Auditoria e remediacao de dependencias (2026-10-15)

## Escopo e baseline

Autorizacao: continuar a remediacao dos bloqueios do PR #118 em PR dedicado, sem deploy ou alteracao de producao. Branch `chore/security-deps-20261015`, criada de `origin/main` em `5255dc5d432850dfeebe0a523402a1902b1d3a52`.

Lidos AGENTS, Constitution, AI_HANDOFF, DUTRA_OS_CONTEXT, EXECUTION_CONTEXT, ROADMAP, CHANGELOG, router, incidentes/anti-patterns relevantes e story SEC-DEPS-01. Seguidos DUTRA Dev, Builder Brain e QA Guardian. Nenhum arquivo de sources/ alterado.

Ambiente local: Windows x64, Node 24.21.0, npm 11.19.0. `npm ci --ignore-scripts` reproduziu 10 ocorrencias (9 high, 1 critical) da linha principal. A auditoria da arvore declarada com `npm audit --omit=dev` retornou zero; isso nao certifica exposicao/saude da producao nem elimina risco das ferramentas executadas em desenvolvimento/CI.

## Mudancas minimas aplicadas

| Cadeia | Antes | Depois | Justificativa |
| --- | --- | --- | --- |
| AIOX -> @aiox-squads/core -> Handlebars | 4.7.9 | 4.7.10 no lockfile | Patch oficial dentro do range existente ^4.7.8 |
| Wrangler -> Miniflare -> Sharp | 0.35.4 | 0.35.5 | Override restrito a `miniflare.sharp`, pois Miniflare fixa 0.35.4 exato |
| Sharp binarios por plataforma | 0.35.4 / libvips packages 1.3.3 | 0.35.5 / 1.3.4 | Atualizados pelo npm com integridade no lockfile |
| AIOX / Wrangler / Miniflare / Undici | 5.4.1 / 4.135.0 / 5.20260918.0-alpha / 7.30.0 | Mantidos | Evitar alteracao desnecessaria de framework, CLI e runtime |

Comparacao mecanica do lockfile confirmou que mudaram somente Handlebars, Sharp e seus pacotes `@img/sharp*`. Nenhuma dependencia direta nova, fork, tarball local ou alias de substituicao. Adicionado `og:dependency-security:test` a suite validate; gate audit original preservado.

Fontes verificadas:

- [Handlebars own-property bypass, corrigido em 4.7.10](https://github.com/advisories/GHSA-p8wg-vrv2-v86f).
- [Handlebars AST injection, corrigido em 4.7.10](https://github.com/advisories/GHSA-8r5x-fm3f-whwj).
- [Release notes Handlebars 4.7.10](https://github.com/handlebars-lang/handlebars.js/blob/v4.7.10/release-notes.md).
- [Sharp/librsvg advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) e [release Sharp 0.35.5](https://github.com/lovell/sharp/releases/tag/v0.35.5).

Licencas preservadas pelos pacotes npm: Handlebars MIT, Sharp Apache-2.0; binarios nativos Sharp incluem Apache-2.0 AND LGPL-3.0-or-later. Sem copia/vendorizacao de biblioteca externa nesta entrega. Dependencias de ferramentas continuam devDependencies.

## Regressao relevante

`scripts/test_dependency_security.mjs` resolve as bibliotecas pelos consumidores reais:

- TemplateRenderer AIOX renderiza helpers/each; escaping padrao de Handlebars permanece funcional.
- Um AST invalido com probe limitado a boolean em memoria e rejeitado antes de gerar/executar codigo. Na instalacao baseline 4.7.9, a mesma entrada executou o probe; em 4.7.10 recebeu `Invalid AST` e nao executou. Nenhum shell, arquivo, rede externa ou dado do produto no payload.
- Sharp resolvido por Miniflare e pelo otimizador do app e a mesma instancia 0.35.5; SVG sintetico -> resize/WebP -> crop/PNG roda inteiramente em memoria, com dimensoes/formato conferidos.
- Miniflare/Workerd iniciam e respondem a dispatch local; usados conversor V4 e compatibilityDate 2026-09-19, igual a configuracao do repositorio. Data atual 2026-10-15 nao e suportada pelo binario antigo (max 2026-09-25); nao se alterou a data do produto.

## Validacoes

| Check | Resultado |
| --- | --- |
| npm ci (com prepare existente) | PASS, exit 0, SHA256 do lockfile inalterado |
| npm ls handlebars sharp braces --all | PASS; 4.7.10, 0.35.5 overridden, 3.0.3 residual |
| Regressao de dependencias | PASS, inclusive na suite completa; Handlebars4.7.10 / Sharp0.35.5 / libvips8.18.7 |
| npm exec -- wrangler --version | PASS, 4.135.0, sem deploy |
| npm run lint / npm test | PASS, exit 0; 63 checks na suite validate |
| npm run og:brain:refresh/check | PASS, 97 registros, 10 colecoes, zero warnings |
| npm run og:intelligence:test | PASS apos novos registros |
| npm run release:gate | PASS, Node24.21.0/npm11.19.0 (isolado e dentro de validate) |
| npm audit --json / --audit-level=high | FAIL, exit 1; 6 high / 0 critical; cadeia braces residual |
| npm audit --omit=dev --json | PASS, zero ocorrencias na arvore declarada de producao |
| typecheck / build | NOT APPLICABLE: scripts inexistentes; nao inventados |
| CodeRabbit | NOT RUN: revisao automatizada nao confirmada; parecer @qa separado |
| Deploy / migrations / CRM / merge | NOT RUN, proibidos neste incremento |

`npm ci` avisou glob@10.5.0 deprecated e dois scripts de instalacao nao aprovados pelo npm (esbuild e workerd). Nao foram ampliadas aprovacoes; carregamento nativo Sharp e boot local Workerd devem passar nos testes. O prepare existente configura os hooks locais ja versionados.

## Bloqueio residual - nao declarar resolucao completa

Apos as correcoes disponiveis, auditoria permanece FAIL com seis pacotes high: `braces`, `micromatch`, `fast-glob`, `chokidar`, `@aiox-squads/core`, `aiox-core`. Sao propagacoes do mesmo advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), nao seis vulnerabilidades independentes. O registry retorna braces latest 3.0.3 e o advisory nao apresenta patched version em 2026-10-15.

- Caminhos reais: AIOX5.4.1 -> core5.4.1 -> chokidar3.6.0 -> braces3.0.3; e core -> fast-glob3.3.3 -> micromatch4.0.8 -> braces3.0.3.
- Npm sugere AIOX5.0.8; consultado seu manifesto publicado, ele tambem depende chokidar3/fast-glob3. Downgrade nao demonstra correcao genuina.
- [Discussao upstream](https://github.com/micromatch/braces/issues/70) inclui contestacao do mantenedor. Isso nao autoriza suprimir o finding ou declarar risco inexistente.
- Parecer @architect: remediar patches oficiais, manter gate e bloqueio residual. Fork de parser exigiria manutencao/suite upstream e guardas de APIs com AST; trocar por file dependency e zerar audit nao prova correcao. Overrides de majors incompatíveis de chokidar/micromatch rejeitados.
- Nao reduzido audit-level, excluidas devDependencies do gate original, criada allowlist nem usado `npm audit fix --force`.

## Publicacao, producao e rollback

DevOps conferiu em 2026-10-15 que a nova branch nao tem deployment GitHub nem servico Railway conectado entre os acessiveis. Producao segue source/main e sem staged changes; previews observados usam outras branches, com patch antigo intocado. Isso permite propor somente o PR, sem presumir que merge nao dispara deploy.

A [documentacao oficial Railway](https://docs.railway.com/deployments/github-autodeploys) descreve botao Disable em Source/Service Settings para parar autodeploy mantendo repositorio conectado. Somente identificada a opcao, sem aciona-la: e mudanca de configuracao de producao, fora da autorizacao atual. Wait for CI controla quando publicar, nao garante ausencia de deploy. Sem usar mensagens de skip para burlar validacoes.

Manter este PR e #118 sem merge enquanto o gate falhar e enquanto nao houver prova de ausencia de autodeploy. Nao alterar producao para contornar o bloqueio. A integracao Arena nao pertence a esta branch.

Rollback: reverter commits SEC-DEPS-01 e reinstalar com npm ci. Isso restaura versoes vulneraveis antigas e nao e solucao de seguranca. Nenhuma migracao ou dado alterado.

Logs locais fora do Git, no diretorio pai: `security-audit-before.json`, `security-audit-after.json`, `security-audit-production.json`, `security-ci.log`, `security-lint.log`, `security-validate.log`. Sem segredos no relatorio. Proximo passo: acompanhar correcao oficial/upstream da cadeia braces ou avaliar substituicao arquitetural em escopo proprio, com regressao completa. Nao liberar merge por excecao silenciosa.

Aprendizado duravel: SRC-SEC-DEPS-20261015-001 e DEC-SEC-DEPS-20261015-001 no Builder Brain. Indices/metricas atualizados. Este pacote nao altera protocolo comercial, dono de dados ou arquitetura do produto; contexto/handoff canonicos permanecem validos, e a continuidade especifica esta nesta auditoria/story.

Parecer independente @qa: PASS limitado aos patches/regressao, sem aprovacao de merge. Reexecutou a regressao com sucesso, confirmou a mesma instancia Handlebars no renderer/core e verificou diff semantico de 28 entradas de lockfile, todas restritas a Handlebars/Sharp/@img. Nenhum novo bug acionavel identificado. Nao certifica outras plataformas nativas nem saude de producao. Story atualizada com Ready for Review parcial, AC5 aberto, 63 checks PASS e brain97.
