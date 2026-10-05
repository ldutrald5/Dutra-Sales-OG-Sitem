# DUTRA OS — BUGBOOK

Registro de falhas que devem virar prevenção permanente. Estado live sempre precisa ser confirmado; este arquivo registra causa/aprendizado.

## BUG-V3-001 — Tela preta / shell não renderiza

**STATUS:** RESOLVED / regression protected<br>
**SINTOMA:** V3 abre em tela escura ou demora a apresentar conteúdo utilizável.<br>
**CONTEXTO:** primeiros deploys V3/mobile.<br>
**CAUSA_RAIZ:** HTML truncado em uma ocorrência; carregamento bloqueante/pesado em outra fase.<br>
**SOLUÇÃO:** corrigir HTML, renderizar shell primeiro, usar `defer`, lazy loading, fontes/ícones não bloqueantes e timeout de rede.<br>
**ARQUIVOS:** `preview-v2/index.html`, `feature-loader-v3.js`, `server.mjs`.<br>
**COMMIT REFERÊNCIA:** `409e2677...` para o HTML; melhorias posteriores de performance.<br>
**COMO_DETECTAR:** first paint ausente, console/HTML incompleto, teste de performance falhando.<br>
**COMO_PREVENIR:** Home não pode depender do carregamento de módulos pesados.<br>
**TESTE:** `preview-v2/test-performance-shell.mjs`.

## BUG-TECH-001 — “0 configurações OG”

**STATUS:** RESOLVED<br>
**SINTOMA:** configurador técnico informa nenhuma configuração apesar da base possuir regras.<br>
**CAUSA_RAIZ:** `OG_DATA` não estava carregado antes do configurador.<br>
**SOLUÇÃO:** carregar `/core/data.js` antes dos módulos técnicos.<br>
**COMO_PREVENIR:** dependência de dados deve estar explícita no bootstrap.<br>
**TESTE:** `preview-v2/test-technical-center-ui.mjs`.

## BUG-TECH-002 — Busca técnica literal demais

**STATUS:** RESOLVED<br>
**SINTOMA:** frases como “Scania com cubo redutor traçado” não encontravam configuração.<br>
**CAUSA_RAIZ:** match dependia demais de texto literal.<br>
**SOLUÇÃO:** normalização por termos, opções, marca, aplicação, perguntas e hints; preservar fallback manual.<br>
**REGRA:** busca humana pode ser fuzzy, decisão técnica não.<br>
**COMO_PREVENIR:** se o match não determina aplicação com segurança, retornar seleção/VALIDAR, não inventar.

## BUG-METRIC-001 — Fechamento 48400%

**STATUS:** RESOLVED / regression protected<br>
**SINTOMA:** taxa de fechamento acima de 100%.<br>
**CAUSA_RAIZ:** vendas históricas do CRM eram divididas por propostas de um universo filtrado diferente.<br>
**SOLUÇÃO:** atribuir vendas somente a leads/propostas pertencentes à mesma população e limitar a taxa lógica.<br>
**COMO_PREVENIR:** numerador e denominador sempre representam a mesma população/período/filtro.<br>
**TESTES:** `preview-v2/test-sales-execution.mjs`, `test-reintegration-v3.mjs`.

## BUG-SYNC-001 — “Base desconectada” sem certeza de save

**STATUS:** IMPLEMENTED / manual acceptance pending<br>
**SINTOMA:** usuário não sabe se mudança foi perdida quando a rede/core falha.<br>
**CAUSA_RAIZ:** conexão e persistência eram apresentadas como um único estado binário.<br>
**SOLUÇÃO:** `CONNECTING|CONNECTED|OFFLINE|SYNCING|ERROR`, feedback de save, IndexedDB, outbox, mutation IDs, idempotência e conflict review.<br>
**COMO_PREVENIR:** HTTP 5xx não deve ser rotulado automaticamente como offline; conflito não pode sobrescrever local silenciosamente.<br>
**TESTES:** sync bridge, conflict, V3 P0; ainda falta aceite manual real desligando/religando rede.

## BUG-QUOTE-001 — Cotação abre “outro sistema”

**STATUS:** TRANSITIONAL FIX<br>
**SINTOMA:** vendedor sai da V3 para concluir cotação no legado.<br>
**CAUSA_RAIZ:** handoff via nova aba.<br>
**SOLUÇÃO ATUAL:** abrir Proposta no shell V3 e embutir motor legado same-origin durante migração.<br>
**DÍVIDA:** iframe/proxy não é estado final.<br>
**REGRA:** V3 é a experiência única; legado pode ser motor interno.<br>
**PRÓXIMO:** proposta V3 nativa.

## BUG-TECH-003 — Dois cérebros de aplicação

**STATUS:** PARTIALLY RESOLVED<br>
**SINTOMA/RISCO:** V3 e legado podem produzir suportes diferentes.<br>
**CAUSA:** lógica foi recriada em `supportDecision()` apesar de `resolveVehicleSupports()` já existir.<br>
**SOLUÇÃO ATUAL:** `technical-application-core-v3.js` extraído do legado e consumido pelo quote service; parity tests.<br>
**REGRA:** uma única regra técnica por combinação.<br>
**PRÓXIMO:** remover fallback duplicado; combinação não coberta = `VALIDAR`.

## BUG-BRANCH-001 — Contexto/documentação de branch ficou desatualizado

**STATUS:** RESOLVED IN INTELLIGENCE COMPILER V1<br>
**SINTOMA:** arquivos de contexto diziam que `main` era a única linha atual enquanto V3 tinha branch/runtime separados e evolução posterior.<br>
**CAUSA:** contexto estático não acompanhou a trilha V3.<br>
**SOLUÇÃO:** Context Manifest e Runtime Manifest distinguem core `main` de shell V3; runtime exige verificação live.<br>
**REGRA:** documentação localiza; GitHub/Railway ao vivo comprovam estado atual.
