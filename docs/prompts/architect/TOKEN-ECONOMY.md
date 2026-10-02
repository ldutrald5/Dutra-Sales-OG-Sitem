# DUTRA Prompt Architect — economia de tokens

## Princípio

**Menor contexto que preserva a decisão correta.** Não otimizar tokens cortando informação causal; otimizar removendo repetição e contexto irrelevante.

## Regras

1. Referenciar arquivo/caminho/ID em vez de colar documento já disponível ao executor.
2. Usar `CONTEXT_MANIFEST` com `required`, `conditional` e `do_not_load`.
3. Carregar Second Brain pelo `BRAIN_INDEX.md` e depois somente IDs relacionados.
4. Não copiar dados dinâmicos de cliente para Skills ou prompts permanentes.
5. Não duplicar definição de agente/task AIOX se `SubagentPromptBuilder` já a empacota.
6. Não repetir guardrail na missão, no scope e no DoD; manter uma fonte por regra.
7. Usar exemplos apenas para edge case ambíguo.
8. Preferir checklist compacto para restrições determinísticas.
9. Resumir histórico de bug como `sintoma → causa → prevenção → teste`.
10. Para L0/L1, não carregar arquitetura global por padrão.
11. Para L2/L3, carregar decisão/bug apenas se a mudança tocar o mesmo contrato.
12. Contexto runtime: enviar somente campos relevantes à conta/ação atual.
13. Ferramenta determinística > raciocínio repetido para lint/validação/formatação.
14. Não reexplicar tecnologia básica a agente especialista.
15. Se um prompt reutilizável virar processo estável, migrar para Skill/procedimento e marcar o prompt como superseded.

## Anti-patterns de contexto

- “Aqui está todo o projeto para você entender.”
- anexar todos os docs “por garantia”.
- repetir Base Mestra em toda tarefa.
- carregar conhecimento técnico OG para uma alteração de CSS.
- carregar dados de cliente para um refactor sem relação comercial.
- colar stack/arquitetura inteira quando basta apontar `AGENTS.md` + arquivo do módulo.

## Medida prática

O lint estima tokens por caracteres. Limites são avisos, não bloqueios absolutos:

- L0: warning acima de 700 tokens;
- L1: warning acima de 1.800;
- L2: warning acima de 4.000;
- L3: sem teto rígido, mas exige Context Manifest e referências.
