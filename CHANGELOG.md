# Changelog — DUTRA OS

## [Unreleased] — CONVERGENCE-01 Stage7.1

- Mapa Cavalo/Carreta por posição emitida pelo mesmo builder; caminho técnico real, sem classificação por código ou regra OG inventada.
- Base Técnica somente consulta; seleção de ramo cavalo/implemento, sem criar CRM/cotação. Ajustes manuais recebem classificação explícita e permanecem VALIDAR fisicamente.
- Multi-Veículos/cotação reconstroem explicação do contexto mínimo preservado; quantidades, preços e snapshots limitados mantidos.
- Alterar nome/multiplicador de veículo não transforma aplicação calculada em override manual; edição real de itens mantém a revisão.
- Testes de consulta sem escrita, mesmo código em posições distintas, salvar/reabrir, snapshot, offline/reconnect e HTTP409; publicação e smoke no checkpoint.

## [Unreleased] — CONVERGENCE-01 Stage7

- Multi-Veículos Premium usa composição e totais existentes, com proveniência por veículo e quantidades multiplicadas uma vez.
- Novo/editar/duplicar/remover usam IDs estáveis; ajustes manuais e preços de outros veículos permanecem preservados.
- Snapshot recuperável no envelope/outbox atuais e cópia ao reabrir histórico; proteção contra controles e respostas obsoletos.
- Novas cotações salvam somente cliente/composição/templates, sem recursão do CRM/histórico que excedia o limite de sync; snapshots antigos preservados e regressão real de transporte/reabertura.
- Gates, piloto real, publicação e limites no checkpoint; sem motor/store adicional, alteração técnica OG ou Stage8.

## [Unreleased] — CONVERGENCE-01 Stage6 (COMPLETE; integração publicada, sem deploy)

- Aplicação Técnica Premium no shell único; input gate mostra VALIDAR sem chamar o motor com configuração incompleta/inválida. Motor técnico e `OG_DATA` preservados byte a byte.
- Rascunho em `operations.quotes` aguarda outbox existente; edição manual revisada e handoff explícito preservam cliente, códigos, quantidades e cotação/preços atuais, sem criar fato de proposta.
- GET antigo não substitui trabalho local novo; pull/seed reconhecem operações sem CRM/histórico. ACK compara a intenção capturada da outbox e limpa atomicamente somente a fila correspondente, preservando saves posteriores.
- Evidência, limites de validação OG, viewports, rollback e publicação no checkpoint; Stage7/produção fora do escopo.

## [Unreleased] — CONVERGENCE-01 Stage5

- Call Intelligence Premium no shell único; texto/conversa, transcrição literal e revisão editável preservam os engines atuais.
- Respostas antigas e sessões descartadas não contaminam contas; comando normalizado antecede confirmação local, retry idempotente e outbox durável.
- Reconexão durante lock preserva intenção no controller atual; erro503/conflito409 permanecem explícitos. Gates, viewports e publicação no checkpoint histórico Stage5; a autorização posterior Stage6 está registrada acima.

## [Unreleased] — CONVERGENCE-01 Stage4

- Prospecção Premium no shell único, importação/vínculo CRM revisados e resultado canônico com recuperação durável.
- Corrigidos foco fora da fila e reconexão bloqueada pela espera opcional de Service Worker; regressões reais de outbox/ACK/503/409.
- Gates completos/QA verdes; publicação e rollback no checkpoint Stage4. Sem nova persistência/engine, Supabase ou produção.

Registro consolidado das evoluções recentes. O histórico de stories anterior continua em `docs/stories/`.

## [Unreleased] — CONVERGENCE-01 Stage3

- Meu Dia operacional reúne Agora, fila canônica, contexto e compromissos factuais no shell único.
- Resultado local aguarda outbox existente; Venda limpa compromissos; troca aprovada de cliente isola notas de Call Intelligence.
- Gates76 e browser/responsividade/refresh/offline/conflito verdes; publicação/status no checkpoint. Sem Stage4, Supabase ou produção.

## [Unreleased] — CONVERGENCE-01 Stage 1

- Integrada ancestralidade V3 à branch de integração por merge controlado, preservando app/PWA/sync maduros e Supabase canônico.
- Retidos 36 arquivos preview V3; reconciliados tooling/governança/Second Brain com 75 gates locais verdes e replay/paridade atuais em CI.
- Sem migração visual, Stage 2, deploy ou alteração de produção/referências protegidas. Advisory Package 00R braces/AIOX permanece dívida separada.

## [Unreleased] — DUTRA Intelligence Compiler V1

- Estendido o Builder Brain existente em vez de criar uma segunda memória paralela.
- Adicionado Context Router para carregar o menor contexto relevante por tarefa.
- Adicionadas Skills finas: Core, Dev, Sales, CRM, OG Tech, Fleet, Product e QA/Guardian.
- Criados playbooks comerciais por estágio, regras técnicas de validação, contexto de frota e Prompt Library consolidada.
- Criada coleção de incidentes com causa, correção, prevenção e regressão.
- Histórico recuperado passou a ser evidência com proveniência; código atual testado e fonte OG validada permanecem acima do chat na hierarquia de verdade.
- Dados dinâmicos de clientes permanecem no CRM/runtime e não são congelados em Skills.
- Adicionado teste de contrato `og:intelligence:test` e integração planejada à suíte `validate`.

## [3.0] — Ciclo Comercial Conectado

- Adicionada central de Ciclo Comercial: Entrada → Contato → Proposta → Negociação → Venda → Pós-venda.
- Adicionados KPIs e contas que precisam avançar usando dados existentes.
- Atalhos para Cotação, ROI/Payback, CRM/Pipeline, Mesa de Vendas e Dutra Force.
- Mantida integridade: cotação salva não promove automaticamente o cliente para proposta enviada.
- Criado protocolo documental canônico (`DUTRA_OS_CONTEXT.md`, `AI_HANDOFF.md`, `ROADMAP.md`, `CHANGELOG.md`).

## [2.9] — Dutra Force Central

- Criada central dedicada do Dutra Force.
- Radar comercial e briefing por conta usando dados reais do CRM.
- Separação explícita entre fatos, regras operacionais e sugestão do motor.
- Atalhos para Conta 360° e Call AI.

## [2.8] — Prospecção + Dutra Force

- Prospecção conectada ao mesmo CRM e ciclo de vida comercial.
- Card contextual do Dutra Force no modo focado.
- Resultado de prospecção persiste status/próxima ação/follow-up no CRM.

## [2.7] — Pipeline Comercial Vivo

- Pipeline renderizado a partir do estado real do CRM.
- Cards por estágio com próxima ação, follow-up e valor conhecido quando existente.
- Avanço explícito de estágio com atividade operacional.

## [2.6] — Agenda Inteligente

- Agenda operacional por vencidos, agora, hoje e amanhã.

## [2.5] — Quick Actions

- Fluxo rápido resultado → nota → próxima ação → salvar.

## [2.4] — Conta 360°

- Visão consolidada da conta selecionada.

## [2.3] — CRM Operacional

- Resumo operacional e pipeline clicável.

## [2.2] — Mesa Premium

- Evolução da Mesa de Vendas e contexto Dutra Force.

## [2.1] — Central de Comando

- Meu Dia com próxima melhor ação baseada em leads reais.

## [2.0] — Foundation

- Evolução visual para shell DUTRA OS preservando módulos e contratos existentes.

## [Unreleased] — WhatsApp/Kaption CRM Bridge

- Adicionado worker local CLI para leitura incremental do Kaption MCP.
- Adicionados cursor privado, suporte multi-sessão e exclusão de grupos por padrão.
- Mensagens seguem para a camada server-side `whatsapp-ingest` com metadados mínimos.
- Extração determinística reconhece somente fatos inbound explícitos; perguntas e hipóteses não viram fatos.
- Segredos de ingestão permanecem somente em variáveis de ambiente.
- Mantida a regra: leitura de WhatsApp, rascunho de proposta e próxima ação não significam envio, contato concluído ou avanço automático de estágio.

## [Unreleased] — WhatsApp E2E Self-Test

- Adicionado `npm run og:whatsapp:e2e` para testar o pipeline hospedado real.
- Adicionados cenários de caminho feliz, retry/idempotência e hipótese não confirmada.
- Adicionado cleanup automático limitado a registros sintéticos do próprio run.
- Modo E2E interno mantém cálculo/ROI/proposta reais, cancela enrichment job sintético e não inicia pesquisa externa.
- Harness offline entrou na suíte de validação; segredos não são necessários no CI.
- O teste prefere as novas chaves Supabase `sb_secret_...`, mantendo fallback legado durante migração.

## [Unreleased] — WhatsApp Bridge AutoStart Windows

- Adicionado instalador de duplo clique `INSTALL_WHATSAPP_AUTOSTART.cmd`.
- Adicionada Scheduled Task `DUTRA-OS-WhatsApp-Bridge` no logon do usuário.
- Bridge reinicia automaticamente após falha.
- Logs locais são gravados em `apps/sistema-og/.data/logs/`.
- Segredos permanecem somente no `.env` local.
- Adicionados comandos de install/status/uninstall e teste de contrato.

## [Unreleased] — Sales Execution P0

- Conectada a Prospecção às listas e sessões normalizadas do Supabase sem criar um segundo CRM.
- Call AI passa a registrar resultados confirmados por um comando transacional e idempotente.
- Resultado confirmado atualiza tentativa, atividade, oportunidade, reunião quando explícita, membro da lista e cursor da sessão.
- Após o registro, a Prospecção retorna automaticamente para o próximo prospect disponível.
- Criado gateway Railway → Supabase Edge com token interno rotacionável; credenciais administrativas não chegam ao navegador.
- Mantido fallback local observável quando a conta ainda não está normalizada ou a sincronização falha.


## [Unreleased] — PLAYBOOK-01 Ficha de Ataque V1

- Adicionada classificação determinística de relação OG, rota comercial e faixa de frota usando somente fatos/eventos existentes.
- Ausência de histórico passa a ser exibida como “Conhecimento OG não confirmado”, sem inferir que o cliente conhece ou não conhece o produto.

- Adicionada síntese comercial somente leitura na Ficha Universal.
- A nova superfície reutiliza Next Best Action, PRECALL-01 e estado real da conta; não cria novo score, nova entidade ou nova persistência.
- Mostra perfil, momento, relacionamento explícito, objetivo do contato, lacunas, perguntas de diagnóstico e guardrails “NÃO DIGA AINDA”.
- Mobile mantém a primeira camada compacta e esconde listas longas até a expansão da ficha.

## [Unreleased] — Call Intelligence V1

- Evoluída a gravação do Call AI de arquivo apenas local para persistência opcional em Storage privado.
- Adicionadas transcrição automática server-side quando o provedor estiver configurado e transcrição manual como fallback.
- Adicionadas métricas de duração, tempo de fala por canal, sobreposição, palavras, perguntas, objeções, termos comerciais e menções numéricas.
- Adicionado dashboard agregado de 30 dias no Call AI.
- Áudio só é enviado após ação explícita; análise e extrações não alteram fatos do CRM automaticamente.
- Gravações normalizadas passam a poder ser vinculadas ao `call_attempt` do Sales Execution.


## [Unreleased] — Local Whisper fallback

- Adicionado worker `faster-whisper` CPU como fallback para transcrição quando a OpenAI falha ou fica sem créditos.
- Áudio continua canônico no Storage privado; worker recebe apenas URL assinada temporária.
- Call AI aciona o fallback automaticamente após falha do provider principal.
- Resultado local volta ao mesmo pipeline de métricas e revisão, sem alterar fatos do CRM automaticamente.

## [Unreleased] — CONVERGENCE-01 Stage 2

- Established one static premium shell in apps/sistema-og, with desktop sidebar, mobile/tablet bottom navigation and existing route/state compatibility.
- Localized startup/renderer feedback, preserved sync/PWA/data contracts and coordinated reconnect with initial recovery.
- Passed 75/75 regression gates and eight-viewport browser acceptance, including cached offline PWA with real API acknowledgement. Browser online-event emulation and existing caught bootstrap debt are recorded.
- Supabase/preview/domain services unchanged; integration publication only, no production deploy or Stage 3.
