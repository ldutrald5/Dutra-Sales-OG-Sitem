# ADR SEC-GLOB-02 - Remover a cadeia braces nas ferramentas AIOX

Data: 2026-10-15. Status: implementada em branch, validacao Linux/PR pendente.
Revisao: @architect, aprovacao condicionada aos contratos observados/testes.

## Contexto

SEC-DEPS-01 removeu a critica Handlebars e o alerta Sharp. Restaram seis pacotes
afetados pelo mesmo advisory braces, sem versao corrigida publicada.
Nao basta trocar identificacao/versionamento ou suprimir o audit.

Inventario do snapshot e pacote npm AIOX5.4.1 encontrou quatro consumidores de
fast-glob, todos `.sync`: ToolResolver, VariableElicitation, populate-entity-registry
e enterprise-upgrader (instalador npm). Chokidar aparece apenas em RegistryUpdater,
que observa diretorios concretos existentes, com ignored function e eventos de arquivo.

## Decisao

- Preservar AIOX5.4.1 e os quatro consumidores. Usar adapter original DUTRA
  `tools/fast-glob-compat`, identificado como @dutra/fast-glob-compat1.0.2,
  sem copiar o parser braces ou alegar versao oficial corrigida fast-glob.
- Adapter suporta somente `.sync` e opcoes inventariadas/documentadas, delegando
  de verdade para glob10.5.0 ja presente. Defaults: onlyFiles=true, dot=false,
  followSymbolicLinks=true; resultados unicos e precedencia BFS/lexical testada.
- Dependencia local direta `fast-glob=file:tools/fast-glob-compat` e override
  scoped no core com referencia `$fast-glob`; Chokidar scoped4.0.3. Manifesto
  standalone aponta para a mesma fonte local. install-links=true copia o pacote,
  evitando depender da resolucao de glob no diretorio ancestral.
- Opcoes nao suportadas falham explicitamente. Guardas lineares restringem
  patterns/ignore a4096caracteres/32grupos simultaneos no total, com contadores
  independentes por tipo; nao prometem
  seguranca de expressoes glob arbitrarias nao confiaveis.
- Testes de referencia gerados usando fast-glob3.3.3 em instalacao externa,
  sem manter dependencia vulneravel nas arvores finais; testes reais de watcher
  e consumidores, auditorias root e nested e instalacoes limpas.

## Alternativas rejeitadas

- Downgrade AIOX: mantem a cadeia antiga.
- Alias fast-glob->glob sem adapter: defaults e APIs diferentes.
- Chokidar major override sem inventario: remover suporte a globs pode quebrar
  consumidores; aqui a aprovacao depende da evidencia de diretorios concretos.
- Fork braces: manutencao de parser e APIs AST fora do objetivo deste pacote.
- Ocultar devDependencies/findings no gate: nao corrige a dependencia.

## Limites e manutencao

Compatibilidade limitada ao AIOX5.4.1 observado, nao substituto universal fast-glob.
Instalacao standalone certificada aqui e a do adapter/glob; RegistryUpdater usa
Chokidar disponivel via raiz. O manifesto nested continua sem declarar Chokidar,
como antes; nao certificamos todos scripts core em isolamento sem a raiz.
ToolResolver usa candidates[0], portanto comparar somente conjuntos e insuficiente.
Glob10 esta deprecado pelo mantenedor; auditoria atual deve ser verificada sem
inferir ausencia de risco futuro. Biblioteca existente nao foi ampliada de major.

Instalador upstream pode copiar seu proprio manifesto para .aiox-core e executar
npm install, reintroduzindo fast-glob3.3.3. Nao certificamos instalacoes globais ou
rebootstrap upstream. Reaplicar manifestos revisados e executar os dois audits e
o gate glob-compat apos reinstalar/atualizar AIOX. Teste detecta reintroducao no lock
e na arvore instalada. Nunca editar manualmente node_modules como solucao.

## Evidencia, reversao e operacao

Auditoria: `docs/audits/2026-10-15-glob-compat-validation.md`.
Reverter commits e npm ci nas duas arvores restaura comportamento anterior e
tambem a vulnerabilidade anterior. Nenhum dado/migracao de produto envolvido.
Sem merge/deploy; PR empilhado sobre a branch do PR119 para revisao focada.
