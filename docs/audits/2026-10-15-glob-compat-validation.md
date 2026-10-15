# SEC-GLOB-02 - Validacao da substituicao glob (2026-10-15)

## Fonte, escopo e inventario

Branch chore/security-glob-20261015, base1a42ad9a0930381cbde3d66ff2b41883e78ea9e4
(PR119). Main nao alterada. Autorizacao: investigar/substituir cadeia vulneravel
preservando contratos; sem merge, deploy ou mudanca de producao.

Lidos AGENTS/Constitution, contexto/handoff, router/skills DUTRA Dev/Brain,
auditoria SEC-DEPS-01 e story SEC-GLOB-02. Nenhum arquivo sources/ alterado.

Pesquisa `rg --hidden` no snapshot e pacote instalado @aiox-squads/core5.4.1:

| Consumidor | Contrato efetivamente usado |
| --- | --- |
| .aiox-core/infrastructure/scripts/tool-resolver.js | sync, arquivos YAML, candidates[0] e ordem de searchPaths |
| .aiox-core/product/templates/engine/elicitation.js | sync com cwd, max numero de documento +1 |
| .aiox-core/development/scripts/populate-entity-registry.js | sync, onlyFiles/absolute, 15 padroes de scan |
| npm core/packages/installer/src/enterprise/enterprise-upgrader.js | sync, cwd/dot/onlyFiles/unique; resultado ordenado |
| .aiox-core/core/ids/registry-updater.js | Chokidar.watch de diretorios existentes, ignoreInitial/ignored/followSymlinks/awaitWriteFinish; add/change/unlink/close |

O pacote npm contem copias dos tres primeiros consumidores; tambem foram
inventariadas. Instalador tem smoke de require.resolve('fast-glob'), preservado
pelo nome da dependencia local. Nao se editou codigo em node_modules.

## Implementacao e fontes

Decisao revisada por @architect: `docs/architecture/ADR-SEC-GLOB-02.md`.
Adapter DUTRA original1.0.2 implementa so.sync usando glob10.5.0 existente;
rejeita opcoes desconhecidas, unique:false, ignore nao-array e entradas fora
dos limites documentados. Nao e um fast-glob oficial novo, fork do parser ou
allowlist da auditoria. Chokidar4.0.3 scoped substitui o3.6.0 somente no core.

- [Chokidar4.0.3: CJS/ESM, sem suporte a glob e sem antiga cadeia](https://github.com/paulmillr/chokidar/blob/4.0.3/README.md).
- [glob10.5.0 upstream](https://github.com/isaacs/node-glob/tree/v10.5.0).
- [Advisory original braces, sem patched version](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Adapter possui MIT original; glob/Chokidar preservam licencas ISC/MIT dos pacotes.
Nao foi copiado codigo de biblioteca, alem de fixtures de resultado produzidas
por execucao. Fonte baseline3.3.3 esta identificada no golden JSON. O nome npm
fast-glob resolve localmente para @dutra/fast-glob-compat, sem publicacao npm.

## Evidencias locais

Windows x64, Node24.21.0/npm11.19.0.

- QA gerou33goldens contra fast-glob3.3.3 instalado fora desta branch, incluindo
 15 conjuntos do registry real (contagem/hash), padroes com braces, negativos,
 dotfiles, absoluto/cwd, duplicatas, ausentes, diretorios e symlinks.
- Encontrada divergencia de ordem em arrays; corrigida para precedencia BFS/lex.
 ToolResolver nao mudou a primeira ferramenta nas fixtures concorrentes.
- Exercitados ToolResolver real, getNextNumber real, enterprise.expandEntryPaths
 real e resolucao dos quatro consumidores; registry real apenas comparado por scan,
 sem executar gerador ou gravar entity-registry.
- RegistryUpdater real sobre repo temporario: ready, add/change/unlink, ignored,
 close e ausencia de eventos posteriores/arquivo de registry gravado.
  Reexecucao QA final tambem cobriu subdiretorio novo criado apos ready, com arquivo
  dois niveis abaixo e ciclo add/change/unlink completo (PASS).
- Guardas:4097caracteres,33niveis curly/paren e delimitadores mistos, ignore/
 negativos, tipos/flags nao suportados e escapes. QA detectou cancelamento de
 depth por delimitadores de tipo diferente; corrigido com contadores independentes.
- Bytes e versao instalados conferidos contra fonte root/nested. Bump da versao
 local foi necessario durante desenvolvimento para npm renovar a copia local.
- Root e .aiox-core npm ci PASS, exit0, SHA256 de ambos lockfiles inalterados.
 Root usou prepare existente; nested --ignore-scripts, como workflow dedicado.
- Root audit/instalacao: zero ocorrencias; nested audit/instalacao: zero ocorrencias.
 Ausencia de braces/micromatch conferida nos dois lockfiles E arvores instaladas.
- npm avisa glob10.5.0 deprecado. Audit atual zero nao e garantia de ausencia
 de vulnerabilidade desconhecida. Nao trocamos major glob sem testes adicionais.
- Lint PASS e validate completo PASS (64 checks), incluindo dependencia/AST/imagens,
 glob/consumidores/watcher, seguranca, config AIOX e release gate.
- Brain refresh/check PASS,99registros/10colecoes/zero warnings.
- Parecer arquitetural final: aprovado para revisao no contrato observado; QA local
 PASS restrito Windows. Certificacao standalone e adapter/glob: RegistryUpdater
 depende Chokidar da raiz, pois o manifesto nested nao o declarava antes.
- CI Linux final: registrar no fechamento abaixo.
- CLI `npm run aiox:version` PASS,5.4.1. Diff semantico lock root alterou somente
  entrada raiz,Chokidar,adapterfastglob e readdirp; removeu21pacotes antigos da cadeia.

## Gates e limites

`og:glob-compat:test` integra validate. Workflow AIOX glob compatibility instala
root/nested, exige resolucao standalone e audita ambas arvores em Linux.
Sem dependencia baseline vulneravel no job; somente goldens versionados.
Guardas nao tornam glob arbitrario nao confiavel universalmente seguro.
Compatibilidade e dos consumidores AIOX5.4.1 observados, nao de todas APIs fast-glob.

O instalador upstream pode sobrescrever o manifesto nested. Apos rebootstrap,
reaplicar arquivos revisados e rodar audits/gates; a dependencia global AIOX nao
esta corrigida por este PR. Sem ignorar alertas ou baixar audit-level.

Sem mudancas de app, dados, banco, producao, Railway, secrets, merge ou deploy.
Rollback: reverter commits e npm ci nas duas arvores (reintroduz vulnerabilidade).
Logs locais fora do Git: security-glob-install/ci-root/ci-nested/validate/audit.
CodeRabbit nao executado; typecheck/build ausentes. QA local limitado Windows;
Linux e checks remotos serao explicitados, sem inferir aprovacao de producao.
