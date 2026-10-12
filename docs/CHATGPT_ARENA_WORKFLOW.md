# ChatGPT-first e Arena — protocolo DUTRA OS

## Escopo e fontes
O GitHub é a fonte de código; CRM/runtime é a fonte de dados operacionais. Antes de mudar qualquer código, ler `AGENTS.md`, `DUTRA_OS_CONTEXT.md`, `AI_HANDOFF.md`, `ROADMAP.md`, `CHANGELOG.md` e `docs/second-brain/CONTEXT_ROUTER.md`. Depois consultar somente módulos, incidentes e skills relevantes. Nunca inferir que GitHub, ZIP, banco e Railway estejam sincronizados.

## ChatGPT como orquestrador
1. Investigar a solicitação e classificar MICRO, STANDARD ou STRUCTURAL conforme `.codex/skills/dutra-builder-brain/SKILL.md`.
2. Para código, usar leitura do GitHub, comparação de mudanças, branch isolada e PR revisável. Verificar a base real e as regras de `AGENTS.md`.
3. Para banco e runtime, consultar Supabase/Railway em modo leitura antes de afirmar estado live. Alterações sensíveis exigem autorização e plano de rollback.
4. Não afirmar execução de testes, deploy, sincronização ou envio de mensagens sem evidência. Não copiar dados sensíveis de clientes para tarefas públicas.
5. Preservar fluxo comercial, dados persistidos, RLS, segredos, autenticação, contratos e intervenção humana.
6. Registrar evidências, pendências e próximo passo. Evitar duplicar a inteligência já presente em `.codex/skills/` e `docs/second-brain/`.

## Arena — quando e como
Origem: https://github.com/Jakeschincariol/arena-skill (MIT). Arquivos upstream copiados em `.claude/skills/arena/`, com testes em `.claude/tests/test_bracket.py`. Essa é uma integração para Claude Code, **não** uma skill nativa executável no ChatGPT.

- Invocação **somente sob solicitação** do usuário; nunca iniciar torneios automaticamente.
- Antes de rodar, mostrar custo estimado e pedir confirmação. Para uso econômico, começar com 8 agentes (43 chamadas de subagentes no README upstream); 16 agentes: 91 chamadas; 100 agentes: 595 chamadas. Não confundir chamadas com tokens cobrados.
- Para problemas simples, preferir revisão direta ou 2–3 hipóteses concorrentes sem criar torneio.
- Não incluir tokens, chaves, segredos, transcrições privadas ou dados pessoais no task file `.arena/`.
- Os participantes propõem soluções; não executam deploys, migrações, escrita no CRM ou ações externas.
- Antes de aplicar uma solução vencedora: revisão humana, testes, evidência e rollback. Vitória no torneio não prova correção.
- Manter `.arena/` fora do Git e remover artefatos sensíveis de acordo com política de retenção aprovada.
- Para Claude Code, comando de verificação: `python3 -m unittest discover -s .claude/tests -v`; confirmar suporte real a `/arena` no ambiente Claude Code antes de anunciar que funciona.
- Para ChatGPT, aplicar a rubrica e revisão adversarial como **método de análise**, sem alegar execução do plugin Claude.

## Auditoria de continuidade — próximos gates
A. Inventariar código, skills, testes, CI e dependências; identificar duplicidades.
B. Comparar schema/migrations/Edge Functions Git versus Supabase remoto sem alterar dados.
C. Comparar commit de produção Railway versus GitHub e validar saúde/persistência.
D. Priorizar riscos de segurança, integridade e vendas; produzir plano incremental e PRs pequenos.
E. Executar testes relevantes em ambiente apropriado e registrar evidência.

## Estado desta integração
Arquivos adicionados apenas em branch de proposta. **Sem execução verificada dos testes upstream, sem deploy e sem ativação do comando Claude.** Revisão de segurança e compatibilidade pendente antes de merge.
