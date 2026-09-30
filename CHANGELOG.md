# Changelog — DUTRA OS

Registro consolidado das evoluções recentes. O histórico de stories anterior continua em `docs/stories/`.

## [Unreleased] — Playbook Comercial Contextual

- O briefing pré-ligação passa a classificar o modo de abordagem por estágio real da conta.
- Exibe objetivo, consciência comprovada, abertura sugerida, pergunta principal e próximo avanço.
- Adiciona preparação técnica segura sem inferir aplicação/código OG.
- Mantém o caminho determinístico/offline e não grava fatos por mera recomendação.

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
