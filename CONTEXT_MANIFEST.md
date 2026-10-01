# Context Manifest — DUTRA OS 2026-10-01

## Escopo

O projeto possui duas linhas executáveis relacionadas:

1. **Core Sistema OG** — `main`, aplicação brownfield madura em `apps/sistema-og/`.
2. **Shell V3 Premium** — `dutra-os-ui-v3-premium`, experiência nova em `preview-v2/` que reutiliza o core/motores existentes.

Não confundir “core canônico atual” com “experiência V3 atual”. A estratégia é reintegração incremental, não substituição big-bang.

## Hierarquia de verdade

Use `docs/intelligence/README.md`. Resumo:

1. confirmação atual;
2. código testado;
3. documentação atual;
4. decisão vigente;
5. Second Brain;
6. relatórios de recuperação;
7. histórico antigo;
8. hipótese/ideia.

Para runtime, Railway/GitHub ao vivo vence documentação estática.

## Contexto inicial por tarefa

1. `AGENTS.md`;
2. `docs/intelligence/CONTEXT_ROUTER.md`;
3. Skill da área;
4. código/testes afetados;
5. registros específicos do `docs/second-brain/BRAIN_INDEX.md`.

Não carregar toda a base histórica.

## Fatos arquiteturais atuais

- frontend principal permanece Vanilla JS/CSS/HTML;
- `state.leads` continua camada operacional de compatibilidade;
- contratos canônicos Company/Contact/Opportunity/Activity/Task existem;
- smart views são projeções da base central, não bancos independentes;
- V3 usa bridge para ler/gravar o core sem duplicar CRM;
- connection state + IndexedDB/outbox/mutations/idempotência estão implementados; aceite manual offline/reconnect ainda é pendência P0;
- motor técnico compartilhado foi extraído para `preview-v2/technical-application-core-v3.js`; convergência total ainda está em andamento;
- proposta V3 ainda usa ponte/embedded legado; proposta totalmente nativa é pendente;
- Supabase migrations/Auth pilot existem, mas Supabase não foi validado como verdade live deste shell;
- IA de pesquisa/Call passa por Review Gate antes de gravar inferências.

## Regras de reintegração

- V3 é a experiência única;
- legado pode fornecer motor interno durante migração;
- nenhum novo score, CRM, agenda ou tabela técnica paralela;
- automação sempre preserva override/manual quando necessário;
- aplicação incerta = VALIDAR.

## Runtime

Consultar `docs/runtime/DUTRA_OS_RUNTIME.md` e `dutra-runtime-operator`.

No momento da auditoria 2026-10-01:

- core `main`: commit `f4c2b3c68d747b6477410ffff50521d8788f8d62`, Railway SUCCESS;
- V3: commit `0d3d766726c1980297553e684663d11a6bb8bced`, Railway SUCCESS.

Esses hashes são fotografia histórica; verificar live antes de afirmar estado atual.

## Proibições

- big-bang rewrite;
- React/Next rewrite sem evidência;
- segunda fonte de verdade;
- technical mapping inventado;
- force merge silencioso;
- segredo em Git/browser persistent storage;
- dado dinâmico de cliente em Skill;
- feature “concluída” sem gate/teste;
- afirmar deploy saudável apenas por memória.

## Próxima dependência técnica

1. fechar aceite manual do P0 offline/reconnect;
2. concluir motor técnico único;
3. Multi-Veículos V3;
4. proposta V3 nativa;
5. pedidos;
6. somente depois consolidar persistência/auth canônica remota.
