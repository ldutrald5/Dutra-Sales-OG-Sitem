# DUTRA OS — Prompt Library

Prompts históricos são preservados somente quando ainda agregam valor. O objetivo é reduzir prompts gigantes por meio de Skills + Context Router.

## PROMPT-SALES-EXEC-001 — Sales Execution Sprint

**STATUS:** ACTIVE AS SPECIFICATION / prefer Skills for execution  
**VERSÃO:** 1.0  
**FINALIDADE:** implementar estação operacional de prospecção sem recriar o brownfield.  
**QUANDO USAR:** mudanças estruturais em listas, sessões, Call Mode, reuniões, next action e métricas.  
**ENTRADAS:** estado atual do CRM, stack, schema, fluxos existentes.  
**SAÍDA:** auditoria → mudança incremental → testes de aceitação.  
**DEPENDÊNCIAS:** dutra-core, dutra-dev, dutra-crm, dutra-sales.

**Núcleo preservado:**

```text
NÃO recrie o projeto do zero.
Audite primeiro estrutura, banco, rotas, APIs e funcionalidades.

Fluxo:
IMPORTAR LISTA
→ organizar/enriquecer
→ selecionar lista
→ definir meta
→ iniciar sessão
→ briefing
→ ligar
→ identificar interlocutor
→ registrar resultado
→ encontrar decisor
→ qualificar
→ marcar reunião
→ salvar automaticamente
→ próximo contato.

Princípio:
o vendedor deve gastar tempo conversando com clientes, não administrando o CRM.
```

## PROMPT-REINTEGRATION-001 — V3 + legado

**STATUS:** ACTIVE AS ARCHITECTURAL SPECIFICATION  
**VERSÃO:** 1.0  
**FINALIDADE:** impedir que UI nova descarte motores maduros.  
**QUANDO USAR:** migração de módulo legado para V3.  
**SAÍDA:** shell V3 + serviço compartilhado + migração incremental.

**Núcleo:**

```text
Não abrir um sistema para trabalhar e outro para concluir.
V3 é o shell único.
Legado pode fornecer motor interno durante a migração.
Extrair dados/serviço/domínio antes de reescrever.
Eliminar iframe/ponte quando o módulo V3 nativo estiver pronto.
```

Referência canônica: `docs/DUTRA-OS-REINTEGRATION-PLAN.md`.

## PROMPT-RECOVERY-001 — Conversation Recovery Audit

**STATUS:** ACTIVE FOR ARCHIVAL  
**VERSÃO:** 1.0  
**FINALIDADE:** encerrar chats longos sem perder decisões, bugs, pendências, clientes e estado técnico.  
**QUANDO USAR:** antes de apagar/arquivar conversa relevante.  
**SAÍDA:** relatório mestre + technical handoff + bloco de migração.  
**REGRA:** não inventar; marcar NÃO DEFINIDO; distinguir estado conhecido de estado live.

## PROMPT-INT-COMPILER-001 — Intelligence Compiler

**STATUS:** SUPERSEDED BY SYSTEMIZED WORKFLOW  
**VERSÃO:** 1.0  
**FINALIDADE ORIGINAL:** transformar histórico em Skills/contexto/regras/playbooks/testes.  
**SUBSTITUÍDO POR:** `docs/intelligence/README.md`, Context Router, Builder Brain, novas Skills, BUGBOOK e knowledge regression test.  
**USO FUTURO:** não reenviar o prompt inteiro; solicitar “rode o DUTRA Intelligence pre-flight/compiler para este material”.

## Regras da biblioteca

- não duplicar prompt que uma Skill já resolve;
- prompts não armazenam segredos;
- dados de cliente entram como input runtime, não no prompt global;
- quando um prompt vira processo permanente, migrar para Skill/procedimento e marcar como superseded.
