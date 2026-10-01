# DUTRA Intelligence — arquitetura de conhecimento operacional

## Propósito

Esta camada transforma histórico útil do DUTRA OS em conhecimento recuperável sem criar uma segunda fonte de verdade. O repositório já possui a estrutura correta:

- `docs/second-brain/` = evidência, fatos duráveis, decisões, padrões, anti-patterns, perguntas e ciclos;
- `.codex/skills/` = procedimentos compactos para agentes;
- `knowledge/` = conhecimento comercial/técnico da Olho de Gato, sempre com status e fonte;
- `docs/` = arquitetura, produto, playbooks, incidentes e contratos;
- `tasks/` e `docs/stories/` = execução e aceite;
- CRM/banco = dados dinâmicos de contas, contatos, propostas, tarefas e reuniões.

Não criar uma pasta de “memória” paralela nem copiar a Base Mestra inteira para cada Skill.

## Hierarquia da verdade

Quando houver conflito, usar nesta ordem:

1. dado atual explicitamente confirmado;
2. código atual funcionando e teste correspondente;
3. documentação atual ligada ao código;
4. decisão arquitetural vigente;
5. registro ativo em `docs/second-brain/`;
6. Base Mestra / relatório de recuperação;
7. histórico antigo;
8. hipótese;
9. ideia.

Conflitos não são resolvidos silenciosamente. Registrar a divergência como decisão, pergunta aberta ou item de validação.

## Estável x dinâmico

### Conhecimento relativamente estável

Pode virar Skill, contexto, decisão, padrão, playbook ou teste:

- arquitetura;
- princípios do produto;
- UX;
- regras de domínio;
- regras técnicas já presentes em código;
- procedimentos;
- anti-patterns;
- heurísticas;
- bugs e prevenção;
- playbooks comerciais.

### Informação dinâmica

Permanece no CRM/banco/registro operacional:

- cliente atual;
- última conversa;
- preço negociado;
- proposta atual;
- próxima ação;
- reunião;
- estoque;
- status de negociação;
- tarefa;
- dados pessoais/contatos.

Nunca congelar esses dados em Skills globais.

## Taxonomia

O Second Brain continua sendo o armazenamento canônico de conhecimento durável. Use as coleções existentes:

- source;
- knowledge;
- pattern;
- decision;
- idea;
- experiment;
- open_question;
- anti_pattern;
- cycle.

Quando um conceito histórico precisar de classificação mais específica (BUG, BUG_FIX, PLAYBOOK, PROMPT, PROCEDURE), mantenha o registro operacional no documento dedicado e relacione-o ao tipo canônico mais próximo no Second Brain.

## Status e confiança

Ciclo recomendado:

- `active/validated/implemented` = utilizável;
- `candidate/planned` = não tratar como regra;
- `deprecated/superseded` = preservar histórico, não usar como vigente;
- `open/deferred` = depende de evidência/decisão.

Confiança:

- `high` = código/teste ou fonte atual forte;
- `medium` = documentação/relatório consistente sem validação completa;
- `low` = hipótese, memória histórica ou evidência incompleta.

Não converter confiança em “verdade” sem olhar a hierarquia acima.

## Roteamento de contexto

Comece em `docs/intelligence/CONTEXT_ROUTER.md`.

Carregue somente os contextos necessários à tarefa. Skills apontam para referências; não repetem dezenas de páginas.

## Protocolo de aprendizado contínuo

Depois de uma mudança STANDARD/STRUCTURAL, perguntar:

1. Houve decisão nova?
2. Houve bug/causa/solução nova?
3. Surgiu regra, padrão ou anti-pattern reutilizável?
4. Um playbook mudou?
5. Um conhecimento anterior foi substituído?
6. Existe teste de regressão possível?
7. A origem está registrada?

Se sim:

1. registrar no local canônico;
2. adicionar proveniência;
3. atualizar Skill/contexto afetado apenas se necessário;
4. usar `supersedes`/status em vez de apagar história;
5. atualizar changelog;
6. adicionar teste quando determinístico;
7. executar `npm run og:brain:refresh` e `npm run og:intelligence:test`.

## Pre-flight anti-amnésia

Antes de uma alteração relevante:

- procurar implementação existente;
- consultar `BRAIN_INDEX.md`;
- consultar a Skill da área;
- procurar decisão relacionada;
- procurar bug semelhante no BUGBOOK;
- localizar testes;
- verificar se a mudança cria uma segunda fonte de verdade;
- verificar se está recriando motor já existente.

Antes de afirmar “não existe”, pesquisar o repositório.

## Segurança

Nunca armazenar em Skills, docs, Second Brain ou prompts:

- valores de tokens;
- API keys;
- senhas;
- cookies;
- bearer tokens;
- credenciais;
- dumps privados desnecessários.

Nomes de variáveis podem ser documentados; valores permanecem em secret managers.

## Princípios permanentes

1. Não reconstruir o DUTRA OS do zero sem necessidade.
2. Reaproveitar inteligência madura antes de reescrever.
3. A V3 deve ser a experiência única do usuário.
4. O legado pode fornecer motores durante a migração, não uma segunda experiência.
5. O vendedor deve gastar tempo conversando com clientes, não administrando CRM.
6. CRM é base central; listas são coleções operacionais.
7. Automação deve acelerar sem bloquear exceções reais.
8. O sistema sugere; o vendedor decide.
9. Aplicação técnica incerta retorna VALIDAR; nunca inventar código.
10. Dados comerciais precisam de origem e estado.
11. Cliente existente não é lead frio.
12. Pipeline e relacionamento são dimensões diferentes.
13. Performance percebida é funcionalidade.
14. Shell principal carrega antes de módulos pesados.
15. Trabalho offline não pode desaparecer.
16. Conflito de sync não apaga alteração local.
17. Métricas usam populações consistentes.
18. Bug resolvido gera prevenção/teste quando possível.
19. Decisão importante permanece rastreável.
20. Conhecimento novo relevante retorna à Base de Inteligência.
