# DUTRA OS — AI Handoff

## Handoff atual — Stage5

Leia `docs/handoffs/V3_UNIFICATION_CHECKPOINT.md` para owners de Call AI, guards async, Review/retry, reconexão e evidência/publicação. Estado de implementação no checkpoint; não iniciar Stage6 sem nova autorização QG.

Este arquivo existe para que qualquer nova IA, agente ou desenvolvedor consiga continuar o projeto sem reconstruir sua história a partir de chats.

## Boot obrigatório

Antes de alterar o DUTRA OS:

1. Leia `DUTRA_OS_CONTEXT.md`.
2. Leia este `AI_HANDOFF.md`.
3. Leia `ROADMAP.md` e `CHANGELOG.md`.
4. Leia `AGENTS.md` e `docs/second-brain/CONTEXT_ROUTER.md`.
5. Use o router para carregar somente a Skill DUTRA, decisões, incidentes e documentação ligados ao escopo.
6. Inspecione o código real antes de propor refatoração ou criar módulo paralelo.

## Contrato de trabalho

- Preserve funcionalidades existentes e dados persistidos.
- Não invente dados de CRM, resultado de contato, envio, venda ou valor financeiro.
- Não invente aplicação/código técnico Olho de Gato. Ausência de confirmação = `Necessária validação técnica`.
- Separe **FATO**, **REGRA** e **SUGESTÃO** em recursos de inteligência.
- Não mude estágio comercial silenciosamente. Cotação salva não é proposta enviada; WhatsApp aberto não é mensagem enviada.
- Reutilize o mesmo lead/conta em Prospecção, CRM, Mesa, Agenda, Pipeline, Cotação e Call AI.
- Prefira evolução incremental ao redesenho completo.
- Não altere Railway, volume, variáveis, autenticação ou servidor sem necessidade clara e validação do impacto.
- Não declare testes como aprovados se não foram executados com sucesso.

## Antes de codificar

Descubra primeiro:

- qual entidade/estado existente representa o dado;
- quais serviços já fazem persistência;
- quais eventos operacionais já existem;
- qual vocabulário de status o CRM usa;
- quais testes existentes cobrem o fluxo;
- se a mudança pode afetar dados locais ou produção.

Se houver uma estrutura existente adequada, estenda-a. Não crie uma segunda fonte de verdade.

Antes de afirmar que algo não existe, pesquise o repositório. Antes de corrigir um bug material, consulte `docs/second-brain/incidents.jsonl` e `anti-patterns.jsonl`. Depois de uma mudança STANDARD/STRUCTURAL, registre aprendizado durável e rode `npm run og:brain:refresh`.

Para qualquer mudança estrutural em Supabase, faça pre-flight live-vs-Git e preserve o gate `Supabase Canonical Replay`. O incidente `INC-SUPABASE-DRIFT-001` foi resolvido por SUPABASE-00S recuperando os 25 migrations registrados, as 13 Edge Functions e um bootstrap explícito para oito tabelas CRM históricas fora do migration log. Consulte `supabase/migrations/`, `supabase/functions/`, `supabase/recovery/20261003/` e os relatórios SUPABASE-00S antes de novo DDL/deploy. Se o replay ou o pre-flight divergir, pare a expansão estrutural.

## Definition of Done

Uma alteração relevante só pode ser entregue quando:

1. O código solicitado está implementado.
2. Os testes/checks relevantes disponíveis foram executados e o resultado real foi registrado.
3. `CHANGELOG.md` foi atualizado.
4. `ROADMAP.md` foi atualizado quando o estado do produto mudou.
5. `DUTRA_OS_CONTEXT.md` foi atualizado se surgiu decisão durável, módulo, regra ou arquitetura nova.
6. `AI_HANDOFF.md` foi atualizado se mudou o protocolo de trabalho.
7. O ZIP/release contém esses documentos.
8. Se houve deploy, confirmar o status e domínio reais; não assumir que GitHub, ZIP e Railway estão sincronizados.

## Regra de sincronização

Existem quatro superfícies que podem divergir:

**working tree → ZIP/release → GitHub → produção Railway**.

Nunca diga que “está tudo salvo/sincronizado” sem verificar cada superfície relevante. O GitHub deve ser a fonte oficial de código compartilhável; o ZIP deve representar uma release identificável; Railway deve publicar um commit conhecido.

## Ao encerrar uma sessão

Registre no mínimo:

- versão/estado atual;
- arquivos alterados;
- validações executadas;
- pendências e riscos;
- próximo passo recomendado;
- situação de sincronização GitHub/produção.

Isso permite continuidade por ChatGPT, Codex, Claude, Gemini, outro agente ou desenvolvedor humano.

## Handoff — WhatsApp/Kaption

Para tarefas relacionadas ao WhatsApp automático:

- worker local: `scripts/whatsapp-kaption-bridge.mjs`;
- comando contínuo: `npm run og:whatsapp:bridge`;
- diagnóstico de um ciclo: `npm run og:whatsapp:bridge:once`;
- teste determinístico: `npm run og:whatsapp:bridge:test`;
- cursor privado padrão: `apps/sistema-og/.data/kaption-sync-cursor.json`;
- endpoint de ingestão: variável `OG_WHATSAPP_INGEST_URL`;
- chave server-side: `OG_WHATSAPP_INGEST_API_KEY` (nunca versionar/expor no frontend).

O Kaption deve estar aberto e com a ponte MCP local funcional. O worker consulta `entity=session` e depois conversas/mensagens com `after`. Não adicionar envio automático ao mesmo processo: ações externas continuam separadas e exigem confirmação humana.

## Handoff — WhatsApp E2E

- teste live: `npm run og:whatsapp:e2e`;
- harness offline/CI: `npm run og:whatsapp:e2e:test`;
- chave preferida: `OG_WHATSAPP_E2E_API_KEY=sb_secret_...`;
- fallbacks locais: `OG_WHATSAPP_INGEST_API_KEY`, `SUPABASE_SECRET_KEY`, legado `SUPABASE_SERVICE_ROLE_KEY`;
- nunca registrar a chave no Git, frontend ou logs;
- `OG_WHATSAPP_E2E_KEEP=true` preserva dados sintéticos somente quando for necessário diagnosticar falha;
- por padrão, o teste remove proposta, oportunidade, atividades, conversa, contato, eventos e empresas sintéticas ao finalizar;
- não usar o modo E2E como atalho para proposta real: o bypass de discovery exige `metadata.e2e=true` e empresa `[E2E]`.

## Handoff — AutoStart do Bridge no Windows

O computador que mantém Kaption/WhatsApp pode registrar o Bridge como tarefa do Windows.

Instalação por duplo clique:
- `INSTALL_WHATSAPP_AUTOSTART.cmd`

Alternativa CLI:
- `npm run og:whatsapp:autostart:install`
- `npm run og:whatsapp:autostart:status`
- `npm run og:whatsapp:autostart:uninstall`

A tarefa se chama `DUTRA-OS-WhatsApp-Bridge`, inicia no logon do usuário atual e tenta reiniciar após falha. O launcher resolve o caminho do repositório dinamicamente, usa o `.env` local e grava logs em `apps/sistema-og/.data/logs/`.

Nunca colocar segredo no Task Scheduler, arquivo .cmd ou scripts versionados. O segredo continua somente no `.env` local.

## CONVERGENCE-01 Stage 2 handoff

Single shell is published on the integration branch, not production/main. Consult the current checkpoint before continuing. Preserve app-shell presentation-only boundary, existing switchTab/hash/history and durable sync/recovery. Browser regression command og:shell:test needs installed developer Playwright/Chromium; its SW reconnect emulation limitation is explicit. Stage 3 is NOT STARTED; no deep Meu Dia redesign was performed.

## CONVERGENCE-01 Stage3 continuation boundary

Meu Dia is a readonly operational projection in apps/sistema-og; queue/NBA/outcomes preserve canonical owners. Current status/publication/rollback is recorded in docs/handoffs/DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md. No Stage4 execution or deployment is authorized by this note.
