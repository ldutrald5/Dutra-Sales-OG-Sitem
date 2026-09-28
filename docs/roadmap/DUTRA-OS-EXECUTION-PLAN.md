# DUTRA OS — Plano de Execução

## Marco 0 — Auditoria e proteção
- inventariar runtime, dados, integrações e dependências;
- manter produção intacta;
- branch dedicada;
- validar gates existentes;
- mapear segredos e superfícies de risco sem registrá-los.

**Saída:** baseline reproduzível e mapa de riscos.

## Marco 1 — Command Core
- Mission Router;
- Agent Registry;
- Integration Registry;
- Approval Queue;
- Execution Log;
- feature flags.

**Aceite:** uma missão de leitura percorre router → agente → evidência → resultado e fica auditável.

## Marco 2 — Morning Command
Implementar o fluxo "Começa meu dia":
- retornos vencidos;
- tarefas de hoje;
- sinais;
- propostas;
- contas prioritárias;
- agenda;
- próxima missão.

**Aceite:** painel gera fila explicável sem alterar fatos automaticamente.

## Marco 3 — Prospecting Intelligence
- intake de cidade/região/segmento;
- descoberta via provedores autorizados;
- evidências e URLs de origem;
- deduplicação;
- score explicável;
- enriquecimento;
- fila de revisão;
- preparação de abordagem.

**Aceite:** prospect novo entra revisável no CRM com origem e evidências.

## Marco 4 — Communication Copilot
- Gmail/Calendar/Contacts quando conectados;
- templates contextuais;
- rascunho;
- approval gate;
- confirmação e evento.

**Aceite:** preparar ≠ enviar; envio só após aprovação explícita.

## Marco 5 — Technical Intelligence 360
- catálogo de veículos/configurações;
- regras de aplicação;
- suportes e ERP;
- evidência técnica;
- visual 360;
- status de confiança/revisão.

**Aceite:** aplicação reproduzível e rastreável até a regra utilizada.

## Marco 6 — ROI + Proposal Engine
- premissas por conta;
- cenários;
- ROI/payback;
- proposta;
- snapshot;
- tracking seguro;
- follow-up automático interno.

## Marco 7 — Lifecycle Engine
- instalação;
- satisfação;
- indicação;
- expansão;
- reposição;
- reativação.

## Marco 8 — Software Factory
- issues/stories automáticas a partir de requisitos aprovados;
- agentes de arquitetura/dev/QA;
- testes;
- PR;
- revisão;
- deploy de staging;
- produção somente por gate.

## Marco 9 — Scale
- autenticação e organização;
- persistência gerenciada;
- filas/jobs;
- backups;
- métricas de custo;
- SLOs;
- políticas de retenção.

## Ordem imediata
1. DUTRA-CORE-01 — contratos e registry.
2. DUTRA-CORE-02 — execution log + approval queue.
3. DUTRA-DAY-01 — Morning Command.
4. DUTRA-PROSPECT-01 — provider-neutral prospecting pipeline.
5. DUTRA-INTEGRATION-01 — catálogo e health de conectores.
