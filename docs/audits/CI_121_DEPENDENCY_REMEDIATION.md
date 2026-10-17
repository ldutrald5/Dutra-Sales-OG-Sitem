# CI #121 — remediação isolada de dependências

Consulta upstream iniciada em 16/10/2026; execução concluída em 17/10/2026. Status: **remediação parcial; segurança BLOQUEADA, sem aceite de risco**.

Story de execução: [CI-121-DEPENDENCY-REMEDIATION.md](../stories/CI-121-DEPENDENCY-REMEDIATION.md). Este documento separa proveniência oficial, testes executados e o bloqueio residual de segurança. Não é aprovação de merge ou deploy.

## Escopo e baseline preservado

- Base: `d06411f2164ef88a6f035063e2f41389d3d51efe`, branch `chore/og-marketing-skills-integration`.
- Remediação: branch separada `fix/ci-121-dependency-audit`, em checkout isolado; o PR separado deverá permanecer **Draft**, com base na branch de marketing.
- O [PR #121](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/pull/121) e sua base não devem ser alterados por esta remediação.
- O [run 38952045582](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/actions/runs/38952045582), job `117145566284`, registrou falha de `npm audit --audit-level=high`: **10 vulnerabilidades, sendo 9 high e 1 critical**. Isso é evidência do run anterior, não medição do lockfile candidato.
- O diff `ea63126 d06411f -- package.json package-lock.json .github/workflows` é vazio: a integração das skills V1 não introduziu a mudança de dependências responsável pela falha.
- Código de CRM, dados, autenticação, preços, aplicação técnica, workflows, política de auditoria e runtime não fazem parte deste diff.

Nenhuma vulnerabilidade se torna inofensiva apenas por estar em `devDependencies`: CI, CLIs, processamento de assets e builds executam essas bibliotecas. Em particular, `scripts/optimize-og-assets.mjs` importa Sharp diretamente; não executar esse script sobre assets versionados durante os smokes.

## Versões: baseline e candidato observado no lockfile

As versões foram conferidas no lockfile e na instalação limpa. A cobertura real de compatibilidade está delimitada na tabela de resultados; não equivale a homologação de deploy.

| Pacote | Baseline `d06411f` | Candidato | Justificativa / limite |
|---|---|---|---|
| `aiox-core` | `5.4.1` | `5.4.1` | Última versão oficial publicada consultada; preservada. |
| `@aiox-squads/core` | `5.4.1` | `5.4.1` | Wrapper `aiox-core@5.4.1` depende exatamente desta versão. |
| `handlebars` | `4.7.9` | `4.7.10` | Patch oficial; satisfaz `^4.7.8` do AIOX. |
| `wrangler` | `4.135.0` | `4.151.1` | Atualização dentro de `^4.135.0`, que traz a cadeia corrigida de Sharp. |
| `miniflare` | `5.20260918.0-alpha` | `5.20261012.1-beta` | Dependência publicada do Wrangler candidato; alpha → beta exige smoke. |
| `sharp` | `0.35.4` | `0.35.5` | Miniflare candidato depende exatamente da versão corrigida. |
| `workerd` | `1.20260918.1` | `1.20261012.1` | Dependência alinhada ao Wrangler/Miniflare candidato; testar binário sem provider. |
| `esbuild` | `0.28.1` | `0.28.2` | Dependência do Wrangler candidato; testar transformação sintética. |
| `braces` | `3.0.3` | `3.0.3` | **Sem versão oficial corrigida publicada.** |
| `chokidar` | `3.6.0` | `3.6.0` | AIOX exige `^3.5.3`; contém Braces. |
| `fast-glob` | `3.3.3` | `3.3.3` | Última versão oficial consultada; contém Micromatch/Braces. |
| `micromatch` | `4.0.8` | `4.0.8` | Última versão oficial consultada; exige `braces:^3.0.3`. |

O `package.json` deve permanecer intacto, inclusive `aiox-core:5.4.1`, `wrangler:^4.135.0`, engines Node `>=24 <25` / npm `>=11` e override existente de Undici. Rever as resoluções, integridades e dependências transitivas do lockfile; quantidade de linhas não substitui revisão semântica.

## Proveniência oficial dos advisories

### Handlebars

| Advisory oficial | Severidade informada | Intervalo vulnerável | Primeira versão corrigida |
|---|---|---|---|
| [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj) — AST type confusion em `compile` | critical | `>=4.0.0 <=4.7.9` | `4.7.10` |
| [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f) — own-property check bypass | critical | `>=3.0.0 <=4.7.9` | `4.7.10` |
| [GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7) — precompiled template inline em HTML | medium | `>=4.0.0 <=4.7.9` | `4.7.10` |

As pré-condições diferem: AST não confiável, acesso a protótipos ou embedding inline não devem ser tratados como equivalentes. Corrigir o pacote não demonstra que a aplicação era explorável, e a ausência de exploração reproduzida não elimina o advisory. O registro oficial de `4.7.10` declara Node `>=0.4.7`; Node 24 satisfaz esse requisito. Testar templates legítimos do AIOX, sem executar payload de RCE.

Fontes complementares: [release v4.7.10](https://github.com/handlebars-lang/handlebars.js/releases/tag/v4.7.10), [metadados npm de 4.7.10](https://registry.npmjs.org/handlebars/4.7.10).

### Sharp / librsvg

[GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) informa severidade **high**, versões Sharp `<0.35.5`, primeira corrigida `0.35.5`, com librsvg `2.63.2` nos binários oficiais. Condições específicas de runtime em Linux/glibc podem permitir RCE ao decodificar SVG.

O advisory apresenta como mitigação bloquear `VipsForeignLoadSvg` e usar Node compilado como PIE. Isso não substitui atualização nem autoriza alterar comportamento da aplicação nesta remediação. Para librsvg global, é necessário verificar a versão global; atualizar apenas o pacote não comprova essa condição.

Metadados oficiais consultados:

- [Sharp 0.35.5](https://registry.npmjs.org/sharp/0.35.5): Node `>=20.9.0`.
- [Wrangler 4.151.1](https://registry.npmjs.org/wrangler/4.151.1): Node `>=22.0.0`; depende de `miniflare:5.20261012.1-beta`.
- [Miniflare 5.20261012.1-beta](https://registry.npmjs.org/miniflare/5.20261012.1-beta): Node `>=22.0.0`, `sharp:0.35.5` e `workerd:1.20261012.1`.

Node 24 atende aos engines publicados. Isso não dispensa testar Sharp, esbuild e workerd realmente instalados, o avanço alpha → beta e o uso de binários opcionais por plataforma.

### Braces — bloqueio residual sem patch oficial

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), consultado via API oficial do GitHub, informa **high**, versões `<=3.0.3` e `first_patched_version:null`. O risco é esgotamento de pilha por padrões de chaves profundamente aninhados. O limite de caracteres existente não limita adequadamente a profundidade.

A [issue upstream #70](https://github.com/micromatch/braces/issues/70) permanece aberta na consulta; sugere limitar profundidade/tamanho de padrões não confiáveis antes dos walkers. Isso é mitigação de exposição, não uma correção publicada nem uma justificativa para reduzir o audit.

```text
aiox-core@5.4.1
└── @aiox-squads/core@5.4.1
    ├── chokidar@3.6.0
    │   └── braces@3.0.3
    └── fast-glob@3.3.3
        └── micromatch@4.0.8
            └── braces@3.0.3
```

O [registro Braces](https://registry.npmjs.org/braces) publica `latest:3.0.3`; o [registro Micromatch](https://registry.npmjs.org/micromatch) publica `latest:4.0.8`; o [registro Fast-glob](https://registry.npmjs.org/fast-glob) publica `latest:3.3.3`. O [registro aiox-core](https://registry.npmjs.org/aiox-core), o [registro @aiox-squads/core](https://registry.npmjs.org/@aiox-squads%2fcore) e a [release oficial AIOX v5.4.1](https://github.com/SynkraAI/aiox-core/releases/tag/v5.4.1) não apresentam atualização oficial que elimine a cadeia.

**Decisão técnica desta remediação: manter o bloqueio explícito se o audit continuar high/critical.** Não existe waiver aprovado. Não usar `--force`, downgrade de AIOX, fork não auditado, pacote substituto, alteração de threshold, supressão de alertas ou exclusão artificial de devDependencies para obter verde.

Forçar Chokidar 4/5 muda contratos: a versão 4 remove suporte a glob, e a versão 5 também muda para ESM. Além do risco de quebrar AIOX, isso não elimina a segunda cadeia via Micromatch. Uma substituição estrutural exige outra missão e autorização.

## Execução isolada e lifecycle scripts

Instalações baixam e podem executar código: inspecionar `scripts` dos pacotes antes da instalação normal. O `prepare` do projeto chama `scripts/setup-git-hooks.mjs`, que altera configuração Git; não executar automaticamente no checkout original ou na worktree compartilhada.

1. Primeira reprodução em sandbox dedicada, com cache temporário, sem `.env`, credenciais, dados reais ou volumes produtivos: `npm ci --ignore-scripts --include=optional`.
2. Inspecionar lifecycle scripts efetivamente resolvidos. `--ignore-scripts` não comprova instalação operacional de binários nativos/opcionais; não apresentar esse passo como homologação de Sharp/esbuild/workerd.
3. Reproduzir instalação normal somente em cópia descartável sem `.git` e com configurações de usuário isoladas. Não copiar segredos nem `.data` do checkout original.
4. Durante gates/smokes, negar rede externa, permitindo loopback apenas para fixtures. Nenhum login de provider, scraping, publicação ou deploy.
5. Testes isolados devem controlar diretórios temporários. Não apontar `OG_DATA_DIR` para dados reais e não herdar `OG_HOST` da máquina. A suíte completa tem fixtures próprias; inspecionar se uma variável global substitui a semântica esperada antes de defini-la para todos os processos.

## Comandos de reprodução e artefatos esperados

Os comandos abaixo são roteiro; sua presença aqui não significa que foram executados. Rodar na sandbox descrita, com saída de auditoria em diretório privado externo ao Git. `npm audit` consulta o registry; não pode ocorrer depois do bloqueio de rede usado nos testes offline.

```bash
git status --porcelain=v1
git rev-parse HEAD
node --version
npm --version
npm ci --ignore-scripts --include=optional
npm explain handlebars
npm explain sharp
npm explain braces
npm outdated
npm audit --json
npm audit --audit-level=high
```

Atualização direcionada compatível, sem `--force`, deve revisar somente as resoluções necessárias e ser reproduzível com o lockfile. Registrar comando realmente usado no relatório final; não executar `npm audit fix --force` nem scripts de reconstrução de diretórios.

Após revisão do lifecycle e instalação normal isolada:

```bash
npm run lint
npm test
npm run og:brain:check
npm run og:security:test
npm run release:gate
node scripts/test_marketing_skills_contract.mjs
```

Os contratos das skills devem receber um `OG_DATA_DIR` temporário quando aplicável. O smoke de imagem deve usar pixels sintéticos em memória; transformação/CLI devem usar dados sintéticos e diretórios temporários. Não rodar `og:assets`, deploy ou acesso a contas reais como teste.

Preservar fora do Git os relatórios `audit-before.json`, `audit-after.json`, `npm explain`, instalação limpa, versões/binários, revisão de lifecycle, gates e hashes do lockfile. Um teste aprovado comprova somente sua própria cobertura; não equivale à operação online nem à aceitação de risco residual.

## Resultados executados em 17/10/2026

Ambiente: Node **24.19.0**, npm **11.9.0**, Linux/glibc. `packageManager` declarado permanece `npm@11.19.0`; não foi instalado outro npm. Os requisitos efetivos do gate são Node 24 e npm 11+.

| Verificação | Resultado | Evidência / alcance |
|---|---|---|
| Instalação inicial e candidata com `--ignore-scripts` | PASSOU | Cache dedicado; registry via proxy/CA da sessão; sem credenciais de providers. |
| `npm explain handlebars sharp braces` e `npm outdated --json` | PASSOU como diagnóstico | Exit 1 de outdated informa Wrangler desatualizado; não é falha de transporte. |
| Audit baseline | FALHOU, reproduzido | **9 high / 1 critical**, 10 entradas de pacotes; exit 1. |
| Audit candidato | FALHOU, residual explícito | **6 high / 0 critical**, exit 1; todas as entradas propagam o mesmo advisory Braces. |
| Instalação normal, scripts habilitados e rede negada | PASSOU | `npm ci --offline --include=optional --no-fund --audit=false`, após inspeção de lifecycle; .git e dados privados ausentes. |
| Lockfile reproduzível | PASSOU | SHA-256 antes/depois `483a97fcfdd991bf452712e18d961dbc9e55ffce204660d3d8125e7394c24080`. |
| `npm run lint` | PASSOU | Checagem sintática existente. |
| `npm test` | PASSOU | **83/83 gates**, zero falhas, inclusive contratos de dados, identidade, persistência e sync. |
| Brain refresh/check | PASSOU | **209 registros**, zero warnings. |
| `npm run og:security:test` | PASSOU | Baseline do produto; não substitui audit de dependências. |
| `npm run release:gate` | PASSOU | Gate local existente; não significa CI global verde nem autorização de release. |
| Contratos das 12 skills | PASSOU | **21 verificações**, incluindo 33 skills anteriores preservadas e rollback em fixture. Não é teste de inferência/discovery em hosts. |
| Smoke dos consumidores reais | PASSOU | **6/6**: renderer AIOX/Handlebars, pixels Sharp→PNG/WebP, transformação esbuild, workerd/Wrangler --version e Miniflare com worker sintético/dispatchFetch local; nenhum provider. |
| Diff semântico / revisão independente | PASSOU | 64 entradas de pacote existentes, sem adição/remoção; todas dentro das cadeias-alvo/binários. Registry oficial e SHA-512; nenhum lifecycle novo. |
| Zero high/critical / liberação de merge | BLOQUEADO | Não há versão corrigida de Braces nem exceção aceita. |
| Cursor, VS Code, inferência real, provedores, piloto/produção | NÃO TESTADO | Não fazem parte desta remediação. Nenhuma ativação/envio/deploy. |

`--audit=false` foi usado **somente nas instalações**, para separar o download da auditoria registrada. A auditoria global foi executada explicitamente com `npm audit --json --audit-level=high --ignore-scripts`, sem `--omit=dev`, thresholds menores ou supressão. Seu exit 1 permanece reportado.

As seis entradas residuais são `braces`, `chokidar`, `micromatch`, `fast-glob`, `@aiox-squads/core` e `aiox-core`. São entradas diretas/transitivas do mesmo advisory, não seis novas falhas independentes.

### Alteração reproduzida e lifecycle auditado

```bash
npm update handlebars wrangler --package-lock-only --ignore-scripts --no-fund --audit=false
npm ci --ignore-scripts --include=optional --no-fund --audit=false
npm audit --json --audit-level=high --ignore-scripts
node scripts/test_ci_dependency_compatibility.mjs
```

Na instalação normal isolada, esbuild/workerd encontram os binários opcionais de plataforma, verificam versão e criam links/arquivos locais de pacote. Seus fallbacks de download foram inspecionados; a rede estava negada, portanto nenhum fallback externo poderia completar. O `prepare` raiz detectou ausência de `.git` e não alterou hooks/configuração compartilhada. Sharp não possui lifecycle de instalação nesta versão. Scripts `build`, `test`, `docs-publish` e similares dos fornecedores não foram invocados.

Hashes dos scripts revisados:

- esbuild `install.js`: `612294e278914443bdcf81cb17f54afec34dbdd2ebd999a6ee187912320cc315`.
- workerd `install.js`: `d54ab450c824eb145726059f4a114fe52b36f4bc60ae63b434b1ca1e694bdbdd`.
- root `scripts/setup-git-hooks.mjs`: `b4167a2c8b0374a2424058e33329b2cff953dcd3dbd66024e8771d55c829af12`.

Os metadados gerados removem seletores `libc` em entradas Sharp atualizadas. O smoke Linux/glibc não comprova suporte musl, macOS, Windows ou outras arquiteturas. O smoke adicional de Miniflare inicialmente falhou por opções legadas do próprio harness; foi corrigido conforme `MiniflareOptionsSchema` da versão instalada e reexecutado: 6/6 PASSOU. Nenhuma alteração na aplicação foi necessária. Não foi executado bundle/deploy Cloudflare nem alterado `compatibility_date` da aplicação.

### Evidências preservadas e fronteiras

Artefatos fora do Git: `/workspace/artifacts/DUTRA-OS-CI121-REMEDIATION-20261016/`. Contêm baseline, `audit-before.json` / `audit-after.json` (JSON bruto, também em `.log`), `explain-before.log` / `explain-after.log`, `outdated-before.log`, instalação/gates/smokes, resultados JSON, revisão semântica e os runners de isolamento. Não contêm credenciais ou dados comerciais. Relatórios públicos resumem somente pacotes, versões e resultados sintéticos.

Registros duráveis: `SRC-CI121-DEPENDENCIES-20261017`, incidente **OPEN** `INC-CI-UNPATCHED-TRANSITIVE-001` e ciclo `CYCLE-CI121-20261017`. Skills, políticas de segurança e arquitetura não foram modificadas. Os testes comerciais fictícios A/B/C do anexo continuam etapa seguinte; não são alegados como executados nesta remediação.

## Aceite, publicação do diagnóstico e rollback

O pacote pode documentar uma redução comprovada de vulnerabilidades e seguir como **Draft de remediação parcial**, sem liberar merge/deploy. O critério continua: zero high/critical **ou decisão explícita de bloqueio**, sem mascarar a falha. O relatório final deve incluir a contagem realmente medida, advisories residuais, resultados dos gates e limitações.

Após existir commit da remediação, o rollback é `git revert <SHA_DO_COMMIT_DA_REMEDIACAO>`, com revisão do diff, reinstalação limpa e gates na sandbox. Não inserir SHA inexistente. Reverter reintroduz as versões vulneráveis anteriores e exige registrar essa consequência; não tocar em dados, `main`, PR #121, piloto ou produção. Não usar reset/rebase/force push, limpeza de caches de usuários ou remoção de volumes.
