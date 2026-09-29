# DUTRA OS — Contexto Canônico

> Fonte de verdade para humanos e IAs que trabalham neste repositório.
> Antes de alterar o produto, leia também `AI_HANDOFF.md`, `ROADMAP.md`, `CHANGELOG.md` e `AGENTS.md`.

## Missão

O DUTRA OS é o sistema operacional comercial da operação Olho de Gato. Ele deve ajudar o vendedor a executar o ciclo completo **ENCONTRAR → PESQUISAR → ABORDAR → DIAGNOSTICAR → PROPOR → ACOMPANHAR → NEGOCIAR → VENDER → EXPANDIR → FIDELIZAR → CONSEGUIR INDICAÇÕES**, sem transformar suposições em fatos.

A pergunta central da interface é: **“O que deve ser feito agora?”**

## Princípios não negociáveis

1. **CRM é a fonte operacional de verdade.** Prospecção, Mesa, Agenda, Pipeline, Dutra Force, Cotação e Call AI devem compartilhar o mesmo ciclo, não criar bancos paralelos de clientes.
2. **FATO ≠ REGRA ≠ SUGESTÃO.** Dutra Force deve separar dados registrados, regras determinísticas e recomendações. Sugestões nunca viram fatos automaticamente.
3. **Não inventar dados OG.** Código de suporte, aplicação, preço, economia, pressão, compatibilidade e qualquer dado técnico/comercial só podem ser apresentados como confirmados quando houver fonte OG validada no projeto.
4. Quando uma aplicação técnica não estiver confirmada, usar **“Não determinado / Necessária validação técnica”**. Não completar lacunas por plausibilidade.
5. **Ação externa exige confirmação.** Abrir WhatsApp não significa mensagem enviada; cotação salva não significa proposta enviada; sugestão de estágio não muda o pipeline sem ação explícita.
6. **Preservar dados e funcionalidades.** Evolução deve ser incremental, aditiva e reversível. Nunca apagar automaticamente `localStorage`, IndexedDB, volume `/data` ou `.data`.
7. **Valor financeiro só quando conhecido.** Oportunidade/ROI não recebe valor inventado. Se não existe valor calculado/salvo, mostrar “valor não informado”.
8. **IA complementa, não substitui regras.** Preferir filtros, regras, templates e cálculos determinísticos antes de IA generativa.

## Arquitetura atual

O produto é majoritariamente HTML + CSS + JavaScript modular com servidor Node, PWA e persistência local-first.

- App: `apps/sistema-og/`
- Interface: `apps/sistema-og/index.html`, `styles.css`, `app.js`, `data.js`
- Modelo operacional: `apps/sistema-og/operations-model.js`
- Mesa de Vendas: `apps/sistema-og/modules/sales-desk.js`
- Prospecção: `apps/sistema-og/modules/prospecting-engine.js`
- Serviços CRM/interações/comunicação/WhatsApp/IA: `apps/sistema-og/services/`
- Servidor: `apps/sistema-og/server.mjs`
- Dados privados locais: `apps/sistema-og/.data/` (fora do Git)

A publicação principal usa Railway e o repositório GitHub `ldutrald5/Dutra-Sales-OG-Sitem`. Produção possui persistência em volume; deploy nunca deve destruir ou substituir dados persistidos sem plano explícito.

## Linguagem visual

Produto visual: **DUTRA OS — Sales Intelligence · OG**.

Tokens predominantes: fundo `#070707`, superfície `#15171b`, cards `#1d2025`, amarelo OG `#ffde17`, verde `#22c55e`, risco `#ef4444`, texto `#f8fafc`.

A navegação deve favorecer: Meu Dia, Mesa de Vendas, CRM, Prospecção, Comunicação, Call AI, Dutra Force, Performance/ROI, Cotação, Consultor de Suportes e Biblioteca. Desktop usa sidebar; mobile deve permanecer funcional e simples.

## Estado funcional consolidado até V3.0

- **V2 Foundation:** shell visual com sidebar/topbar preservando os módulos existentes.
- **V2.1:** Meu Dia com próxima melhor ação baseada em leads reais.
- **V2.2:** Mesa Premium e contexto Dutra Force.
- **V2.3:** resumo operacional do CRM e pipeline clicável.
- **V2.4:** Conta 360°.
- **V2.5:** Quick Actions: resultado → nota → próxima ação → salvar.
- **V2.6:** Agenda Inteligente por vencido/agora/hoje/amanhã.
- **V2.7:** Pipeline Comercial Vivo ligado ao estado real do CRM.
- **V2.8:** Prospecção conectada ao mesmo CRM + Dutra Force contextual.
- **V2.9:** Dutra Force Central com radar, briefing e links para Conta 360/Call AI.
- **V3.0:** Ciclo Comercial Conectado com visão Entrada → Contato → Proposta → Negociação → Venda → Pós-venda e atalhos para Cotação, ROI/Payback, CRM, Mesa e Dutra Force. Cotação salva continua sendo rascunho até ação explícita do usuário.
- **PRECALL-02:** Ficha de Ataque no Call AI com playbook determinístico por momento comercial, abordagem, abertura, WhatsApp de entrada, preparação técnica e guardrails sem mutar o CRM.

## Regra técnica OG

O projeto contém conhecimento técnico e materiais OG, mas **o código não deve inferir aplicações**. Tabelas/fotos/documentos validados são a fonte de verdade. Divergência ou ausência de fonte deve permanecer pendente de validação, nunca “corrigida” silenciosamente por conhecimento geral.

Estados recomendados para dados técnicos:

- `Confirmada OG`
- `Precisa validar`
- `Não determinada`

## Modelo operacional esperado

O fluxo ideal compartilha a mesma conta/lead:

**Prospecção → primeiro contato → diagnóstico → cotação → proposta → negociação → fechado → pós-venda → expansão/indicação.**

Follow-up e `nextAction` alimentam Meu Dia, Agenda e Mesa. Mudanças de estágio relevantes devem gerar atividade operacional. Cotações e propostas só alimentam valor de oportunidade quando houver valor real calculado/salvo.

## Regras de documentação

Toda entrega relevante deve atualizar, no mesmo pacote/repositório:

- `DUTRA_OS_CONTEXT.md` — verdade durável e decisões estruturais;
- `CHANGELOG.md` — o que mudou por versão;
- `ROADMAP.md` — estado e próximos passos;
- `AI_HANDOFF.md` — protocolo para outra IA/agente;
- `README.md` — quando instalação, execução, arquitetura de entrada ou deploy mudarem.

**Uma versão não está concluída apenas porque o código funciona. Código + validação + contexto + changelog devem andar juntos.**

## Fonte de verdade e precedência

Em caso de conflito, use esta ordem:

1. Dados reais persistidos do cliente/operação.
2. Fonte técnica OG explicitamente validada.
3. Código e contratos atuais do repositório.
4. `DUTRA_OS_CONTEXT.md` / documentação arquitetural.
5. Sugestões de IA.

Nunca promova o item 5 para os níveis 1–3 sem validação.
