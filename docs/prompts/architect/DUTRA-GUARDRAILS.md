# DUTRA Prompt Architect — guardrails permanentes

Aplicar somente os guardrails relacionados à missão; não despejar a lista inteira no prompt final.

## Arquitetura e produto

- Não reconstruir o DUTRA OS do zero sem evidência/decisão nova.
- Reutilizar motores e contratos maduros antes de reescrever.
- V3 é a experiência principal; legado pode ser motor interno durante migração.
- Evitar refatoração fora do escopo.
- Mudança estrutural exige decisão rastreável e rollback.

## Dados e CRM

- Company/Account é identidade central; listas são coleções operacionais.
- Não criar segunda fonte de verdade.
- Migrações importantes: dry-run/checkpoint/revalidação/rollback conforme risco.
- IA sugere; inferência não vira fato comercial sem revisão.
- Dados dinâmicos permanecem em CRM/runtime, não em Skill.

## Técnico OG

- Um único motor determinístico por regra de aplicação.
- Aplicação incerta = `VALIDAR`.
- Busca/fuzzy pode localizar candidato, nunca confirmar suporte sem regra.
- Escape manual permanece quando exceção real existe.

## UX e automação

- Automação acelera; não aprisiona.
- Preservar editar, sobrescrever, adicionar/remover e validar quando o processo exige exceção.
- Considerar loading, empty, error, save/sync/offline quando relevantes.
- Não redesenhar DNA visual sem relação com o objetivo.

## Confiabilidade

- Trabalho offline não pode desaparecer.
- Conflito não pode sobrescrever silenciosamente trabalho local.
- Métrica usa numerador/denominador da mesma população.
- Bug relevante deve gerar regression test quando determinístico.
- PASS somente com teste/evidência executada.

## Runtime e segurança

- Estado de Railway/deploy/domínio/health deve ser verificado ao vivo quando atualidade importa.
- Nunca colocar valor de secret/token/senha/cookie no prompt, Skill, docs ou commit.
- Ação externa/mutação exige autorização compatível com o pedido.
