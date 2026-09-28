# Backlog do Sistema OG

Status permitidos: `pronta`, `em andamento`, `bloqueada`, `concluída`. A conclusão exige atualizar este arquivo, `DONE.md` e a story correspondente.

## TASK-001 — Mesa de Vendas: estrutura base

- **Objetivo:** consolidar fila, conta ativa e painel contextual como interface diária.
- **Escopo:** reutilizar Meu Dia e CRM; criar layout responsivo sem duplicar cadastros.
- **Arquivos relevantes:** `docs/05-MESA-DE-VENDAS.md`, `docs/03-DESIGN-SYSTEM.md`, `docs/04-CRM.md`, `apps/sistema-og/index.html`, `styles.css`, `app.js`.
- **Critério de aceite:** fila e seleção de cliente funcionam; painel preserva contexto; desktop e celular cobrem o fluxo; dados antigos permanecem íntegros.
- **Dependências:** nenhuma funcional nova; usar o modelo atual.
- **Status:** concluída em 2026-09-24; evidência em `tasks/DONE.md`.

## TASK-002 — Motor de Prospecção e Caixa de Entrada

- **Objetivo:** transformar listas brutas em prospects revisados e trabalhar uma fila sequencial.
- **Escopo:** parser local, preview, duplicidade, importação, modo focado, métricas, recomendação e Command Center.
- **Arquivos relevantes:** `docs/04-CRM.md`, `docs/05-MESA-DE-VENDAS.md`, `apps/sistema-og/app.js`.
- **Critério de aceite:** cadastro mínimo aparece na fila e no CRM; duplicata provável gera revisão; entrada natural fica fora deste incremento se não houver story própria.
- **Dependências:** TASK-001.
- **Status:** concluída em 2026-09-24; evidência em `tasks/DONE.md`.

## TASK-003 — WhatsApp One Click

- **Objetivo:** abrir a conversa da conta selecionada com telefone normalizado.
- **Escopo:** consolidar o link já existente como QuickAction reutilizável.
- **Arquivos relevantes:** `docs/05-MESA-DE-VENDAS.md`, `docs/07-CENTRAL-COMUNICACAO.md`, `apps/sistema-og/app.js`.
- **Critério de aceite:** telefone válido abre WhatsApp; inválido orienta correção; abrir não registra envio.
- **Dependências:** TASK-001.
- **Status:** pronta.

## TASK-004 — Quick Actions

- **Objetivo:** disponibilizar o conjunto de ações comerciais da Mesa.
- **Escopo:** componentes, estados e eventos; sem integrações automáticas externas.
- **Arquivos relevantes:** `docs/03-DESIGN-SYSTEM.md`, `docs/05-MESA-DE-VENDAS.md`, `apps/sistema-og/app.js`.
- **Critério de aceite:** ações aparecem conforme contexto, são acessíveis e registram apenas fatos confirmados.
- **Dependências:** TASK-001 e TASK-003.
- **Status:** pronta.

## TASK-005 — Registro rápido de resultado

- **Objetivo:** registrar resultado de ligação/contato com poucos cliques.
- **Escopo:** resultado, nota curta e evento idempotente.
- **Arquivos relevantes:** `docs/02-BANCO-DE-DADOS.md`, `docs/04-CRM.md`, `apps/sistema-og/operations-model.js`, `app.js`.
- **Critério de aceite:** resultado confirmado aparece na timeline e Performance; nenhuma inferência por abrir canal.
- **Dependências:** TASK-004.
- **Status:** pronta.

## TASK-006 — Próxima ação

- **Objetivo:** transformar cada resultado em próxima ação datada e visível.
- **Escopo:** ação, prazo, prioridade e retorno à fila.
- **Arquivos relevantes:** `docs/04-CRM.md`, `docs/05-MESA-DE-VENDAS.md`, `apps/sistema-og/app.js`.
- **Critério de aceite:** salvar atualiza conta e fila; atrasados e hoje são distinguíveis; funciona offline.
- **Dependências:** TASK-005.
- **Status:** pronta.

## TASK-007 — Painel lateral do cliente

- **Objetivo:** consultar e agir sobre a conta sem abandonar a Mesa.
- **Escopo:** resumo, contato, Código OG, telefones adicionais, indicações, dor, objeções, contexto, timeline e ações.
- **Arquivos relevantes:** `docs/03-DESIGN-SYSTEM.md`, `docs/04-CRM.md`, `docs/05-MESA-DE-VENDAS.md`, `apps/sistema-og/app.js`, `services/crm-service.js`.
- **Critério de aceite:** abertura rápida, teclado e celular; mesmas informações do CRM; sem cópia paralela; Código OG pesquisável e independente do status de compra.
- **Dependências:** TASK-001 e TASK-004.
- **Status:** concluída em 2026-09-27; evidência em `tasks/DONE.md` e PR #17.

## TASK-008 — Central Call AI

- **Objetivo:** integrar a inteligência da conta à Mesa.
- **Escopo:** contexto compacto, preparo, roteiro e pós-ligação revisável; reaproveitar Call AI existente.
- **Arquivos relevantes:** `docs/06-CALL-AI.md`, `docs/09-CUSTOS-IA.md`, `knowledge/`, `apps/sistema-og/app.js`, `server.mjs`.
- **Critério de aceite:** usa conta ativa, carrega apenas contexto relevante, funciona sem IA e não grava sugestões sem revisão.
- **Dependências:** TASK-007.
- **Status:** concluída em 2026-09-24; evidência em `tasks/DONE.md`.

## TASK-009 — Central de Comunicação

- **Objetivo:** preparar comunicações por canal e objetivo dentro do contexto da conta.
- **Escopo:** seleção, prévia, cópia/abertura e confirmação explícita de envio.
- **Arquivos relevantes:** `docs/07-CENTRAL-COMUNICACAO.md`, `docs/08-TEMPLATES-COMERCIAIS.md`, `docs/02-BANCO-DE-DADOS.md`.
- **Critério de aceite:** estados de rascunho, abertura e envio confirmado permanecem distintos; histórico e próxima ação são rastreáveis.
- **Dependências:** TASK-007 e TASK-010.
- **Status:** concluída em 2026-09-24; evidência em `tasks/DONE.md`.

## TASK-010 — Templates comerciais

- **Objetivo:** criar motor determinístico e versionado de mensagens/documentos.
- **Escopo:** template, variáveis, validação, prévia e IA opcional; conteúdo final será aprovado separadamente.
- **Arquivos relevantes:** `docs/08-TEMPLATES-COMERCIAIS.md`, `docs/09-CUSTOS-IA.md`, `knowledge/`.
- **Critério de aceite:** variáveis obrigatórias são validadas; versão fica registrada; caminho sem IA é completo; nenhum conteúdo pendente é inventado.
- **Dependências:** definição do contrato Template em story própria.
- **Status:** pronta.

## Ordem recomendada

A recomendação antiga de iniciar TASK-010 isoladamente foi superada pela evolução já incorporada. O roadmap operacional vigente é:

1. **CIC-03 — Account 360 operacional + Command Center 2.0**
2. **KCC-01 — Knowledge Command Center**
3. **PROP-01 — Proposal Tracking seguro**
4. **AUTO-01 — Automation Engine V1**
5. **TERR-01 — Territory Intelligence**
6. **SCALE-01 — validar Auth/Organization/Persistence canônica**
7. **ERP-OG-01 — instalação, ativos e reposição vertical**

TASK-003 a TASK-006 continuam válidas como refinamentos de velocidade operacional e devem ser absorvidas pelos blocos acima quando a mesma superfície for tocada, evitando projetos paralelos.


## TASK-018 — Fila Inteligente de Leads & Transcrição

- **Objetivo:** organizar a carteira por situação da conversa, origem e importância sem duplicar clientes.
- **Escopo:** filtros semânticos, prioridade urgente/alta/média/baixa, origem/lote, temperatura, potencial, ordenação determinística, ficha enriquecida e mobile em cartões.
- **Arquivos relevantes:** `apps/sistema-og/modules/lead-intelligence.js`, `services/crm-service.js`, `app.js`, `index.html`, `styles.css`, `docs/stories/OG-18-fila-inteligente-leads.md`.
- **Critério de aceite:** uma única base; filtros combináveis; urgentes e retornos vencidos sobem na fila; ficha preserva status comercial separado da situação da conversa; dados legados continuam compatíveis.
- **Dependências:** TASK-007 e base de sincronização existente.
- **Status:** concluída em 2026-09-27; evidência em `tasks/DONE.md` e PR #21.


## CIC-01 — Next Best Action + Score Explicável

- **Objetivo:** explicar por que uma conta está priorizada e transformar próxima ação em movimento comercial com motivo, objetivo e resultado esperado.
- **Escopo:** estender o score atual, Ficha Universal, interaction-service e contexto do Call AI; sem segundo motor ou segunda agenda.
- **Arquivos relevantes:** `modules/lead-intelligence.js`, `services/interaction-service.js`, `services/crm-service.js`, `services/call-ai-context.js`, `app.js`.
- **Critério de aceite:** score auditável; campos aditivos; compatibilidade legada; nenhum status alterado automaticamente; Call AI consome contexto confirmado.
- **Dependências:** OG-18 / Ficha Universal / fila inteligente.
- **Status:** concluída em 2026-09-27; evidência em `tasks/DONE.md`, story CIC-01 e PR #23. PR permanece sem merge por instrução de closeout.


## CIC-02 — Mission Control + Signal Center

- **Objetivo:** transformar Meu Dia em uma central operacional que escolha a próxima conta, explique o motivo e exponha sinais comerciais acionáveis sem criar outra base.
- **Escopo:** CTA Próxima Missão, Signal Center derivado, integração com Mesa/Ficha e score canônico do CIC-01.
- **Arquivos relevantes:** `modules/signal-center.js`, `modules/lead-intelligence.js`, `app.js`, `index.html`, `styles.css`.
- **Critério de aceite:** sem segundo score; sinais não mutam fatos; cada sinal termina em ação; missão seleciona conta ativa; offline e mobile preservados.
- **Dependências:** CIC-01, TASK-007 e TASK-018.
- **Status:** concluída em 2026-09-27; evidência em `tasks/DONE.md` e PR #29.


## CIC-03 — Account 360 operacional + Command Center 2.0

- **Objetivo:** transformar a Ficha Universal no centro de comando da conta e tornar Ctrl/Cmd+K a navegação rápida do vendedor.
- **Escopo:** unificar fatos do lead e Company 360 canônico; exibir valor, contexto, sinais, próxima ação, contatos, oportunidades e tarefas; ampliar Command Center para módulos, contas e Sales Brain sem criar outra base.
- **Compatibilidade:** `lead.id` e Company `legacyLeadId` permanecem ponte; score continua em `OG_LEAD_INTELLIGENCE`; sinais continuam derivados.
- **Critério de aceite:** nenhuma segunda fonte de verdade; mobile; busca por Código OG; Account 360 abre em qualquer superfície; Command Center não grava fatos por mera navegação.
- **Dependências:** TASK-007, OG-18, CIC-01, CIC-02 e Company 360 beta.
- **Status:** concluída em 2026-09-28; evidência em `tasks/DONE.md`, story CIC-03 e PR #38.

## KCC-01 — Knowledge Command Center

- **Objetivo:** unir Sales Brain, Biblioteca e busca contextual em uma experiência pesquisável.
- **Escopo:** busca global por produto, veículo, eixos, objeção, segmento, case, ROI, instalação e pós-venda; reutilizar `/api/knowledge/search` e materiais existentes.
- **Critério de aceite:** mesma base de conhecimento atende Command Center, Call AI e Account 360; resultados mostram origem/status; fallback local seguro.
- **Dependências:** CIC-03.
- **Status:** concluída em 2026-09-28; evidência em `tasks/DONE.md`, story KCC-01 e PR #39.

## PROP-01 — Proposal Tracking seguro

- **Objetivo:** transformar proposta em objeto comercial rastreável, sem expor CRM ou dados privados.
- **Escopo:** snapshot versionado, token público opaco/revogável, eventos `proposal_sent/opened/reopened/contact_clicked/accepted/revoked`, Signal Center e próxima ação.
- **Critério de aceite:** página pública acessa somente snapshot publicado; rate limit e validação; nenhuma visualização inventada; eventos auditáveis.
- **Dependências:** Security Gate, persistência remota adequada e contrato Quote/GeneratedDocument.
- **Status:** PROP-01A concluída em 2026-09-28; publicação pública permanece bloqueada até backend/persistência/Auth adequados.

## AUTO-01 — Automation Engine V1

- **Objetivo:** eliminar follow-ups esquecidos sem construir um Zapier genérico.
- **Escopo inicial:** proposta +48h sem resposta; instalação +15 dias; satisfação → indicação; oportunidade parada → sinal; teste com data final → tarefa.
- **Critério de aceite:** automação cria tarefa/sinal/sugestão; não inventa contato, envio, visualização, venda ou aceite.
- **Dependências:** PROP-01 para automações de proposta e contratos de Task/Activity.
- **Status:** concluída em 2026-09-28; evidência em `tasks/DONE.md`, story AUTO-01 e PR #41.

## TERR-01 — Territory Intelligence

- **Objetivo:** converter deslocamento e carteira em inteligência territorial de prospecção.
- **Escopo:** leads/clientes por mapa, cidades, concentração, rota e oportunidades próximas; nenhuma geolocalização inventada.
- **Dependências:** endereços normalizados e política de geocoding.
- **Status:** futura.

## SCALE-01 — Auth/Organization/Persistence canônica

- **Objetivo:** validar a fundação Supabase existente em ambiente real e estabelecer identidade individual e verdade remota.
- **Escopo:** sessão, organizations, memberships, RLS, persistência canônica, backups e política de recuperação.
- **Critério de aceite:** isolamento entre organizações comprovado; fail-closed; nenhum secret privilegiado no browser.
- **Status:** bloqueada por validação/configuração real do Supabase.
