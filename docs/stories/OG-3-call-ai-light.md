# Story OG-3 — Call AI Light

**Status:** Ready for Review

## Objetivo

Registrar ligações comerciais associadas a leads existentes e transformar transcrições/anotações em um rascunho estruturado, sempre revisado pelo vendedor antes de persistir ou atualizar o CRM.

## Escopo

- Seleção do lead no CRM.
- Entrada de transcrição/anotação colada.
- `CallAnalysisProvider` com `LocalHeuristicProvider`.
- Rascunho editável e human-in-the-loop.
- Persistência aditiva em `lead.calls[]`, interação do tipo `call` e atualização dos campos comerciais confirmados.
- Histórico de ligações no detalhe do lead.
- Compatibilidade com desktop, mobile, PWA e uso offline via localStorage existente.

## Fora de escopo

- Gravação ou armazenamento de áudio.
- Speech-to-text, microfone ou leitura automática de chamadas.
- OpenAI, Gemini, Claude ou qualquer API paga.
- Substituição automática de dados do CRM.
- Nova arquitetura, novo backend ou redesign global.

## Fluxo obrigatório

`LIGAÇÃO → TRANSCRIÇÃO/ANOTAÇÃO → ANÁLISE HEURÍSTICA → REVISÃO HUMANA → SALVAR LIGAÇÃO → ATUALIZAR CRM → CRIAR PRÓXIMA AÇÃO`

## Critérios de aceite

- [ ] Leads antigos continuam abrindo e recebem `calls: []` por normalização.
- [ ] Toda ligação salva possui `leadId`, timestamps, transcrição, status e campos editáveis.
- [ ] Analisar nunca grava nem altera o lead.
- [ ] Descartar remove o rascunho sem efeitos persistentes.
- [ ] Salvar registra a ligação, uma interação `type: call`, `lastContactAt`, `updatedAt`, `nextAction` e `followUpAt`.
- [ ] Campos existentes, interações e histórico anterior são preservados.
- [ ] Ligações aparecem no histórico com data, resumo, dor, objeção e próxima ação.
- [ ] A indicação de análise heurística fica visível e nenhuma informação é inventada.
- [ ] O comportamento permanece local-first, compatível com sincronização e offline.

## Modelo de dados

`Call { id, leadId, startedAt, duration, transcript, summary, pains[], objections[], decisionMaker, fleetSize, competitors[], buyingSignals[], commitments[], valuesMentioned[], nextAction, followUpAt, status, createdAt, updatedAt, analysisMode }`

## Estratégia de migração e persistência

A migração é aditiva: `normalizeLead` preserva todas as propriedades existentes e apenas normaliza `calls` para array. Ligações são salvas dentro do mesmo `og_leads_crm` e entram no merge por lead, sem apagar interações ou cotações. O servidor existente continua recebendo o estado pelo `/api/state`; `.data/` permanece fora do Git.

## Revisão humana e conflitos

O provider produz somente rascunho local. O vendedor deve editar e clicar em **Salvar ligação revisada**. Dados comerciais existentes só são atualizados quando o campo confirmado no formulário não está vazio; não há substituição silenciosa de valores não confirmados. A interação registra o resultado e a origem heurística.

## Abstração e limitações

`CallAnalysisProvider` permite futuros `OpenAIProvider`, `GeminiProvider` ou `ClaudeProvider` sem acoplar a UI. `LocalHeuristicProvider` usa regras e regex transparentes; seus resultados são aproximações, não compreensão semântica avançada, e devem ser tratados como rascunho.

## Compatibilidade e riscos

Os módulos são carregados como scripts compatíveis com a aplicação atual. A interface usa os tokens visuais existentes e se adapta a telas pequenas. O risco principal é uma heurística interpretar uma frase de forma incompleta; por isso campos ficam vazios quando não há padrão confiável, o aviso permanece visível e a revisão é obrigatória.

## Arquivos

- [ ] `apps/sistema-og/call-ai/call-model.js`
- [ ] `apps/sistema-og/call-ai/provider.js`
- [ ] `apps/sistema-og/call-ai/call-ui.js`
- [ ] `apps/sistema-og/call-ai/call-ui.css`
- [ ] `apps/sistema-og/index.html`
- [ ] `apps/sistema-og/app.js`
