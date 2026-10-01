# DUTRA OS — Roadmap Vivo

Este é o resumo executivo atual. O roadmap histórico/arquitetural detalhado permanece em `docs/10-ROADMAP.md`.

## Concluído / consolidado

- Shell DUTRA OS e navegação premium.
- Meu Dia / próxima melhor ação.
- Mesa de Vendas.
- CRM operacional + Conta 360° + Quick Actions.
- Agenda Inteligente.
- Pipeline Comercial Vivo.
- Prospecção conectada ao CRM.
- Dutra Force contextual e Central.
- Ciclo Comercial Conectado V3.0.
- Protocolo canônico de contexto e handoff para múltiplas IAs/agentes.

## Próxima frente prioritária

### V3.x — Venda → Pós-venda → Expansão

Fechar o ciclo depois do ganho da venda sem criar base paralela:

- venda/fechamento explicitamente confirmado;
- rotina de instalação e acompanhamento;
- follow-up pós-venda;
- satisfação e evidências reais;
- reposição/manutenção;
- expansão para restante da frota;
- indicação;
- recompra.

## Frentes estruturais permanentes

- Sincronizar release, GitHub e Railway com commit identificável.
- Preservar volume/dados e melhorar backup/restauração.
- Fortalecer autenticação/permissões antes de uso multiusuário amplo.
- Ampliar conhecimento OG somente com fontes validadas.
- Manter FATO / REGRA / SUGESTÃO separados.
- Melhorar testes de integração dos fluxos comerciais.

## Regra de priorização

Primeiro: impedir perda de follow-up e reduzir trabalho manual.
Depois: melhorar inteligência e automações.
Sempre: preservar integridade dos dados e conhecimento técnico OG.

## Em validação — V3.1 WhatsApp → CRM

- Bridge local Kaption com sincronização incremental e cursor privado.
- Ingestão server-side no Supabase com idempotência e auditoria.
- Fatos explícitos inbound podem alimentar a camada normalizada com proveniência.
- Sugestões de IA permanecem revisáveis.
- Follow-up pode ser criado como tarefa; envio externo permanece manual.
- Proposta/ROI pode nascer como rascunho quando empresa, frota e perfil veicular já estiverem confirmados.
- Pendente para consolidação: validar tráfego real do computador com Kaption e reconciliar entidades Supabase ↔ cadastro mestre local sem migração silenciosa.

## Em validação — Sales Execution P0

- Vertical normalizada: Lista → Sessão → Prospect → Call AI → resultado confirmado → próximo prospect.
- Adapter mantém compatibilidade temporária com `state.leads` sem transformar o legado em segunda fonte canônica.
- Escrita multi-entidade usa RPC transacional e idempotente.
- Gateway privilegiado permanece server-side; browser não recebe chave administrativa.
- Próximo passo: importar/reconciliar um lote piloto com `legacy_lead_id`/`external_id` e validar o fluxo ponta a ponta antes de ampliar a migração.


## Em validação — PLAYBOOK-01 Ficha de Ataque V1

- Ficha Universal passa a condensar a preparação do próximo contato.
- Reutiliza Account 360, Next Best Action e PRECALL-01; não cria classificação persistida paralela de cliente.
- V1.1 adiciona projeção determinística de relação OG, faixa de frota e rota comercial a partir dos fatos existentes.
- Próxima evolução só deve avançar para templates/scripts comerciais depois de validar uso real desta síntese.

## Em validação — Call Intelligence V1

- Gravação iniciada somente pelo vendedor e preservada localmente até decisão de upload.
- Storage privado para áudio e metadados normalizados por chamada.
- Transcrição automática opcional server-side + fallback por texto colado.
- Conversation Intelligence com métricas por chamada e agregado de 30 dias.
- Vínculo da gravação ao resultado canônico no Sales Execution.
- Próxima evolução: revisão assistida dos candidatos extraídos antes de promover fatos para Company/Contact/Opportunity e calibração das métricas com chamadas reais.


## Em validação — Whisper local fallback

- Worker Railway CPU/int8 com `faster-whisper base`.
- Fallback automático após falha/quota do provider principal.
- Download temporário por URL assinada; sem credencial Supabase no worker.
- Próximo gate: áudio de teste real autorizado → fallback → transcript `faster-whisper` → métricas → revisão.
