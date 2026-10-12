# Auditoria de continuidade — 2026-10-11 (leitura parcial)

## Evidência verificada
- GitHub: repositório `ldutrald5/Dutra-Sales-OG-Sitem`; branch `main` e documentação `AGENTS.md`, `README.md`, `DUTRA_OS_CONTEXT.md`, `AI_HANDOFF.md`, `ROADMAP.md`, `CHANGELOG.md` lidas.
- Skills existentes: `.codex/skills/dutra-builder-brain/SKILL.md` e `.codex/skills/dutra-runtime-operator/SKILL.md`. Evitar duplicação.
- Supabase `og-proposal-engine` (ref `hlyffyguxqxmgxlevfeq`): projeto ACTIVE_HEALTHY; 34 tabelas no schema public, todas listadas com RLS habilitado; 25 migrations listadas. RLS habilitado **não prova** políticas corretas.
- Supabase Edge Functions: listagem retornou funções ativas, inclusive `proposal-engine`, `whatsapp-ingest`, `sales-execution-gateway`. Algumas mostram `verify_jwt:false`: **revisar autorização interna e validação de token**, sem concluir que estão expostas indevidamente.
- Railway: projeto `Dutra Sales OG`, ambiente `production`, serviços `sistema-og` e `restore-sistema-og-state`. Último deploy retornado do serviço principal: SUCCESS em 2026-10-01, commit `f4c2b3c68d747b6477410ffff50521d8788f8d62`. Isso não comprova saúde HTTP atual, nem alinhamento com o HEAD de `main`.
- Arena upstream: fonte `Jakeschincariol/arena-skill`, arquivos `SKILL.md`, `bracket.py`, `strategies.json`, `rubric.md` e `test_bracket.py` copiados para a branch de integração. O código da Arena é **externo e ainda não auditado integralmente**.
- `.gitignore` da branch passou a ignorar `.arena/` e `**/.arena/`.

## Bloqueios de validação
1. Testes Python upstream ainda não executados: sem checkout executável no ambiente atual; não declarar aprovação.
2. Verificar licença MIT e preservar aviso de licença/copyright no pacote integrado.
3. Auditar scripts Python, subprocessos, escrita em disco e instruções de subagentes antes do merge.
4. Verificar `/arena` no Claude Code real. No ChatGPT, somente a metodologia de revisão está disponível.
5. Comparar migrations e Edge Functions remotas com o Git atual. Incidente `INC-SUPABASE-DRIFT-001` continua relevante.
6. Confirmar URL/health, persistência, commit do deploy Railway e HEAD GitHub antes de qualquer publicação.
7. Rodar gates `npm run lint`, `npm test`, `npm run og:brain:check` e `npm run release:gate` se o escopo de release exigir.

## Decisão
Manter PR #118 em rascunho até gates concluídos. Não fazer merge nem deploy de código de terceiros sem testes e revisão de segurança. Nenhuma mutação no Supabase/Railway foi realizada.
