# DUTRA Intelligence — Knowledge Changelog

## 2026-10-01 — Intelligence Compiler V1

- formalizada a hierarquia de verdade e separação entre conhecimento estável e dados dinâmicos;
- criado Context Router específico do DUTRA OS;
- adicionadas Skills compactas de Core, Dev, Sales, CRM, OG Tech, Fleet, Product e QA Guardian;
- histórico de bugs convertido em BUGBOOK e regras de prevenção;
- playbooks comerciais e técnico estruturados;
- biblioteca de prompts consolidada, com prompts históricos classificados;
- regras técnicas de runtime documentadas com proveniência de código/teste e ressalva de validação física;
- decisões V3/legado, CRM/listas, motor técnico, IA revisável e inteligência operacional registradas como ADRs;
- adicionada suíte de knowledge regression ao gate do projeto;
- Context Manifest/Execution Context/runtime manifest atualizados para distinguir core `main` e shell V3 `dutra-os-ui-v3-premium`;
- conhecimento dinâmico de clientes permaneceu fora das Skills.


## 2026-10-01 — Prompt Architect V1

- criada a Skill `dutra-prompt-architect` para converter intenção em missão executável sem duplicar Builder Brain/Context Router/AIOX;
- definidos tipos de missão e profundidade proporcional L0/L1/L2/L3;
- introduzido `CONTEXT_MANIFEST` com `required/conditional/do_not_load` para progressive disclosure;
- documentadas regras de economia de tokens, guardrails e contrato de execução;
- criado `scripts/prompt-lint.mjs` para validar estrutura, secrets, placeholders e tamanho aproximado;
- adicionada regressão dedicada `og:prompt:test` e integração ao `og:intelligence:test`;
- Prompt Library, Prompt Mestre legado, Context Router, AGENTS e ADRs reconciliados;
- decisão, padrão, fonte e ciclo registrados no Second Brain sem criar memória paralela.
