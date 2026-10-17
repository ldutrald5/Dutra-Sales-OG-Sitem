# CI-121 — remediação isolada de dependências

Status: remediação parcial validada localmente; **segurança BLOQUEADA** por Braces sem patch. Pacote preparado para Draft separado; nenhum aceite de risco concedido.

## Pedido e baseline

Entrada: `PLANO_CORRECAO_CI_121.md`, fornecido pelo usuário. Corrigir em branch independente, sem alterar o PR #121, sem force, downgrade automático de AIOX, redução do audit, merge, deploy ou alteração de dados comerciais.

Checkout separado: `/workspace/Dutra-Sales-OG-Sitem-ci121`.
Branch: `fix/ci-121-dependency-audit`.
Base preservada: `d06411f2164ef88a6f035063e2f41389d3d51efe`, inicialmente CLEAN. O PR de remediação deve ser Draft contra `chore/og-marketing-skills-integration`; o PR #121 e sua base permanecem intactos até decisão explícita posterior.

## Defeito comprovado

O [run 38952045582](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/actions/runs/38952045582) passou instalação, validação, Brain e segurança, mas falhou em `npm audit --audit-level=high`: 9 high e 1 critical. O passo seguinte foi ignorado. `package.json`, lockfile e workflows não foram alterados pela V1, portanto o problema também está na base anterior ao pacote.

## Plano mínimo

- [x] Verificar o PR, logs e identidade dos checkouts.
- [x] Preservar baseline e abrir branch/worktree separados.
- [x] Consultar versões e advisories oficiais.
- [x] Reproduzir instalação sem lifecycle scripts e audit antes.
- [x] Atualizar somente resoluções compatíveis de Handlebars e Wrangler/Miniflare/Sharp.
- [x] Revisar diff e preservar AIOX/overrides/política de audit.
- [x] Verificar instalação limpa/reproduzível, lifecycle scripts e binários necessários.
- [x] Testar renderer AIOX, Sharp, esbuild, workerd, Wrangler e Miniflare sem provider/rede externa.
- [x] Executar gates existentes e contratos das 12 skills sem dados reais.
- [x] Registrar antes/depois e bloqueio residual, sem fingir zero vulnerabilidades.
- [x] Preparar entrega para commit e Draft PR separados; não modificar/mesclar PR #121. O SHA/link efetivos devem ser conferidos no handoff de publicação.

## Fontes e limites técnicos

- [Handlebars — unsafe inline embedding](https://github.com/advisories/GHSA-xw65-4hp5-5hc7), [AST type confusion](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [own property bypass](https://github.com/advisories/GHSA-p8wg-vrv2-v86f): versão corrigida publicada `4.7.10`, dentro de `^4.7.8` do AIOX.
- [Sharp/librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w): versão corrigida `0.35.5`. Wrangler `4.151.1` publica Miniflare `5.20261012.1-beta` com esse Sharp. Node 24 satisfaz os engines; alpha→beta exige smoke.
- [Braces DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): nenhuma versão corrigida publicada; npm latest `3.0.3`, advisory sem `first_patched_version`. [Issue upstream](https://github.com/micromatch/braces/issues/70) aberta. AIOX oficial permanece `5.4.1`, com Chokidar 3 e Fast-glob/Micromatch dependentes de Braces.

Não forçar Chokidar 4/5: mudam suporte a glob/API/ESM e não eliminam a cadeia Micromatch. Não substituir Braces por fork nem remover AIOX sem autorização estrutural. Dependência dev pode executar em build/CLI/CI; não é isenta de risco.

## Isolamento e reprodução

Primeira instalação: `npm ci --ignore-scripts --include=optional`, em sandbox com somente o novo worktree e cache dedicado montados, sem credenciais/providers/volumes reais; proxy e certificados da sessão preservados. O root `prepare` muda configuração Git, portanto nunca executar a instalação normal no worktree compartilhado.

Reprodução da instalação normal e regressões: cópia descartável sem `.git`, `.env` ou `.data`; lifecycles inspecionados, ambiente sem segredos. Durante os testes bloquear rede externa, mantendo loopback para fixtures. Não herdar `OG_DATA_DIR` nem `OG_HOST` pela suíte completa: cada fixture precisa controlar seus próprios diretório e semântica de acesso. O contrato isolado recebe seu diretório temporário.

Não executar `og:assets` sobre os assets versionados nem `og:cloud:deploy`. Smokes de imagem usam pixels sintéticos em memória; CLI/bundling usa worker sintético e diretório temporário.

## Critério de aceite

Zero high/critical **ou bloqueio explícito**. Não existe exceção aprovada nesta missão. Não alterar workflow/threshold, esconder a falha ou apresentar a remediação parcial como liberação para merge/deploy.

## Resultados executados

- Baseline: audit **FALHOU, 9 high / 1 critical**. Candidato: **FALHOU, 6 high / 0 critical**; mesmo advisory Braces propagado em seis entradas de pacotes, sem waiver.
- Instalações sem scripts e instalação normal offline em snapshot descartável: **PASSOU**, lock SHA-256 `483a97fcfdd991bf452712e18d961dbc9e55ffce204660d3d8125e7394c24080` inalterado.
- Lint, suíte completa **83/83**, Brain **209 registros**, security baseline e release gate locais: **PASSOU**. Esses gates não substituem o audit global, que permanece bloqueado.
- Contratos das 12 skills: **21 verificações PASSOU**; smokes dos consumidores reais: **6/6 PASSOU**, inclusive worker sintético Miniflare. Não equivale a aceitação em Cursor/VS Code ou operação de providers.
- Revisão independente: **PASSOU** no escopo; 64 entradas existentes do lock, sem adição/remoção, resoluções oficiais e nenhum lifecycle novo. AIOX/Undici/cadeia Braces idênticos ao baseline. Somente Linux/glibc testado.
- Dois checkouts anteriores preservados CLEAN em `d06411f`. PR #121 reconferido OPEN/Draft com head/base intactos; main/integração sem alteração. Nenhum dado real, preço, auth, provider ou deploy tocado.

Relatório: [CI_121_DEPENDENCY_REMEDIATION.md](../audits/CI_121_DEPENDENCY_REMEDIATION.md).

## File list

- `package-lock.json`: resoluções corrigidas e binários associados; `package.json` intacto.
- `scripts/test_ci_dependency_compatibility.mjs`: regressão sintética dos consumidores reais.
- `docs/audits/CI_121_DEPENDENCY_REMEDIATION.md`: fontes, antes/depois, lifecycle, gates, limites e rollback.
- `docs/stories/CI-121-DEPENDENCY-REMEDIATION.md`: checkpoint desta missão.
- `CHANGELOG.md`, `tasks/TODO.md`, `tasks/DONE.md`: remediação parcial e bloqueio pendente.
- `docs/second-brain/sources.jsonl`, `incidents.jsonl`, `cycles.jsonl`: uma fonte, incidente OPEN e ciclo STANDARD com gate_blocked.
- `docs/second-brain/BRAIN_INDEX.md`, `BRAIN_METRICS.md`: regenerados pelo comando canônico, sem edição manual.

## Evidências e rollback

Artefatos brutos e runners isolados fora do Git: `/workspace/artifacts/DUTRA-OS-CI121-REMEDIATION-20261016/`. Nenhum segredo/dado comercial incluído.

Após publicação do commit, usar `git revert <SHA_DO_COMMIT_DA_REMEDIACAO>` com revisão e testes isolados; não resetar/rebasear ou alterar o PR #121. Reverter o lockfile reintroduz versões vulneráveis, portanto não é liberação de segurança. Não remover storage/caches/dados dos usuários.

Próxima decisão: corrigir Braces por versão oficial compatível comprovada ou obter decisão explícita e delimitada de risco. Não criar automaticamente waiver, não baixar threshold nem executar a etapa comercial seguinte nesta missão.
