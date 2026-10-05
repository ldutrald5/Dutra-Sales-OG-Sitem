# Changelog — DUTRA OS

Registro consolidado das evoluções recentes. O histórico de stories anterior continua em `docs/stories/`.

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
