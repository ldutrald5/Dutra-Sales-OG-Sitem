# DUTRA OS — decisões de inteligência e reintegração

Formato ADR compacto. Decisões duráveis também devem possuir registro correspondente no Second Brain.

## ADR-INT-001 — Inteligência em nível de sistema, não “treino de modelo”

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** conhecimento estava distribuído entre chats, código, docs e memória humana.<br>
**DECISÃO:** manter inteligência por Skills, Second Brain, context routing, playbooks, testes e dados canônicos. Não alegar alteração de pesos/modelo.<br>
**MOTIVO:** rastreabilidade, revisão, atualização e uso seletivo de contexto.<br>
**CONSEQUÊNCIA:** histórico relevante precisa ser compilado para estruturas duráveis; conversa bruta não vira dependência operacional.

## ADR-INT-002 — Second Brain continua sendo a memória durável canônica

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** já existe Builder Brain com JSONL, index, métricas e checker.<br>
**DECISÃO:** estender `docs/second-brain/` em vez de criar outro banco de memória. Documentos de inteligência são superfícies operacionais e apontam para o Second Brain.<br>
**CONSEQUÊNCIA:** novos fatos/decisões/padrões precisam de IDs, proveniência, status e confiança.

## ADR-UX-001 — V3 é a experiência única

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** V3 tem UX superior; legado possui motores maduros.<br>
**DECISÃO:** V3 é o shell. Legado pode executar internamente durante migração, mas não deve virar segunda experiência.<br>
**MOTIVO:** preservar inteligência sem obrigar o vendedor a alternar entre sistemas.<br>
**CONSEQUÊNCIA:** iframe/proxy é transição, não destino.

## ADR-DATA-001 — CRM central, listas operacionais

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** prospecting lists precisam reutilizar empresas existentes.<br>
**DECISÃO:** Account/Company é identidade central; lista é membership/coleção operacional.<br>
**MOTIVO:** deduplicação, histórico único e continuidade comercial.<br>
**CONSEQUÊNCIA:** uma empresa pode estar em várias listas sem ser duplicada.

## ADR-TECH-001 — Um único motor técnico + fallback VALIDAR/manual

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** V3 criou lógica paralela à do consultor legado.<br>
**DECISÃO:** extrair/reutilizar motor maduro e convergir consumidores para uma fonte. Se a aplicação não for determinável, retornar `VALIDAR`; manual continua disponível.<br>
**MOTIVO:** evitar códigos divergentes e permitir exceções reais.<br>
**CONSEQUÊNCIA:** regras técnicas novas exigem teste de paridade; UI não deve inventar mapeamento.

## ADR-AI-001 — IA sugere; fatos comerciais exigem revisão

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** pesquisa e Call AI podem inferir informações.<br>
**DECISÃO:** outputs de IA ficam em `REVIEW_REQUIRED` antes de alterar CRM quando não forem fatos já confirmados.<br>
**MOTIVO:** não transformar inferência em fala/verdade do cliente.<br>
**CONSEQUÊNCIA:** Review Gate é parte do contrato de IA.

## ADR-METRIC-001 — Métricas usam o mesmo universo

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** fechamento chegou a 48400% por misturar vendas históricas e propostas filtradas.<br>
**DECISÃO:** numerador e denominador devem compartilhar população, filtro e atribuição compatíveis.<br>
**CONSEQUÊNCIA:** regressões de taxa precisam falhar em teste.


## ADR-INT-003 — Prompt Architect é camada de missão, não novo Builder

**DATA:** 2026-10-01<br>
**STATUS:** ACCEPTED<br>
**CONTEXTO:** Builder Brain governa método/evidência/aprendizado, Context Router decide o que carregar e `SubagentPromptBuilder` empacota definições AIOX. Faltava uma camada explícita para converter a intenção atual do usuário em missão delegável, proporcional e testável.<br>
**DECISÃO:** criar `dutra-prompt-architect` para classificar tipo e nível L0–L3, recuperar contexto mínimo, definir `CURRENT_STATE → TARGET_STATE`, escopo, guardrails, critérios de aceite e testes. Não cria memória paralela, não duplica agentes/tasks AIOX e não executa a feature por padrão quando a solicitação é apenas gerar a missão.<br>
**MOTIVO:** reduzir ambiguidade e desperdício de tokens sem perder decisões históricas que realmente mudam a implementação.<br>
**CONSEQUÊNCIA:** delegações relevantes passam a usar Context Manifest e profundidade proporcional; prompts reutilizáveis podem ser registrados, enquanto one-offs permanecem efêmeros.
