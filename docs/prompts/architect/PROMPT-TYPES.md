# DUTRA Prompt Architect — tipos e níveis

## Tipos de missão

| Tipo | Foco obrigatório |
|---|---|
| FEATURE | problema, JTBD, fluxo, dados, edge cases, aceite |
| BUG | sintoma, reprodução, causa, histórico, observabilidade, regressão |
| REFACTOR | comportamento preservado, dívida, fronteiras, rollback |
| UX_UI | hierarquia, ação principal, estados, responsividade, design system |
| ARCHITECTURE | fontes de verdade, contratos, alternativas, ADR, migração |
| RESEARCH | pergunta concreta, evidência, fontes, decisão influenciada |
| DATA | ownership, schema, migração, dedupe, restore, auditoria |
| CRM / SALES | estágio, relacionamento, pessoa, next action, persistência |
| OG_TECH | motor determinístico, validação, `VALIDAR`, escape manual |
| DEPLOY | branch/commit alvo, ambiente live, health, rollback |
| QA | risco, regressões históricas, gates, evidência |
| PERFORMANCE | baseline, gargalo medido, orçamento, não-regressão |
| INTEGRATION | contratos, autenticação, retries, idempotência, fallback |
| DOCUMENTATION | fonte, público, decisão vigente, drift |

## Níveis

### L0 — COMMAND
Mudança determinística, local e de baixo risco. Ex.: texto, label, ícone, correção CSS simples.

**Alvo:** ~100–500 tokens.<br>
**Obrigatório:** MISSION + alvo/arquivo conhecido + aceite mínimo.<br>
**Evitar:** arquitetura, Second Brain e histórico se não mudarem a decisão.

### L1 — EXECUTION
Mudança delimitada em poucos arquivos, contrato conhecido e baixo/médio risco.

**Alvo:** ~400–1.500 tokens.<br>
**Obrigatório:** MISSION, CURRENT/TARGET, SCOPE, REUSE FIRST, ACCEPTANCE, TEST PLAN.<br>
**Contexto:** somente módulo afetado.

### L2 — IMPLEMENTATION PLAN
Feature relevante, integração ou mudança multi-arquivo sem redefinir toda a fundação.

**Alvo:** ~1.200–3.500 tokens.<br>
**Obrigatório:** Context Manifest, Source of Truth, Pre-flight, Scope/Out, fases, guardrails, aceite, testes, DoD.<br>
**Contexto:** Skill de domínio + decisões/incidentes relacionados.

### L3 — MISSION SPEC
Arquitetura, migração, integração crítica, grande módulo, mudança de fonte de verdade ou risco material.

**Alvo:** não há teto rígido; usar referências em vez de copiar docs.<br>
**Obrigatório:** tudo de L2 + alternativas/decisões, dados/rollback, failure history, observabilidade, rollout e QA independente quando aplicável.

## Regra de proporcionalidade

Escolher o menor nível que ainda evita uma decisão incorreta. Tamanho não é qualidade; precisão, proveniência e critérios verificáveis são qualidade.
