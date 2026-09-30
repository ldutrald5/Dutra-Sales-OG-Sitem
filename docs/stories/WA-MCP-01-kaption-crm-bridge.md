# WA-MCP-01 — Bridge Kaption → CRM OG

## Objetivo

Sincronizar mensagens novas do WhatsApp lidas pelo Kaption MCP com o backend Supabase do DUTRA OS, sem criar uma segunda fonte de verdade, sem marcar envio/contato automaticamente e sem transformar sugestões de IA em fatos.

## Requisitos

- Usar o Kaption local via MCP stdio e a ferramenta `query`.
- Consultar `entity=session` antes de sincronizar conversas.
- Usar `after` e cursor local para sincronização incremental.
- Persistir cursor somente em `apps/sistema-og/.data/`, fora do Git.
- Enviar eventos para `whatsapp-ingest` no Supabase por credencial server-side em variável de ambiente.
- Não armazenar segredo no repositório nem no browser.
- Ignorar grupos por padrão; permitir opt-in por variável de ambiente.
- Não enviar mensagens, criar labels ou alterar chat no WhatsApp.
- Extrair automaticamente apenas fatos explícitos e determinísticos de mensagens recebidas.
- Sugestões/hipóteses não confirmadas continuam sujeitas a revisão.
- Não alterar estágio comercial automaticamente.
- Geração automática, quando houver dados suficientes já confirmados, cria somente rascunho/proposta interna; envio continua explícito.

## Critérios de aceite

- [x] Story criada antes da implementação.
- [x] Worker local inicia o MCP Kaption e valida que `query` existe.
- [x] Worker lista sessões e sincroniza mensagens incrementais.
- [x] Retry não duplica evento/mensagem/insight no Supabase.
- [x] Cursor só avança depois de ingestão bem-sucedida.
- [x] Fatos explícitos suportados têm testes determinísticos.
- [x] Ausência de chave de ingestão falha de forma fechada.
- [x] `.env.example` documenta as variáveis sem segredos.
- [x] `package.json` expõe comando CLI para worker e teste.
- [x] Arquitetura/contexto/changelog/roadmap registram a integração.
- [x] Checks relevantes executados e resultado registrado.

## Segurança e integridade

- Nenhuma chave Supabase é enviada ao frontend.
- Logs do worker não exibem corpo das mensagens.
- `raw_payload` enviado ao backend contém apenas metadados mínimos.
- Mensagem recebida é evidência de conversa; não é prova de venda, envio de proposta ou fechamento.
- Fatos extraídos automaticamente exigem linguagem explícita e origem inbound.
- Ações externas continuam dependendo de confirmação humana.

## File List

- `scripts/whatsapp-kaption-bridge.mjs`
- `scripts/test_whatsapp_kaption_bridge.mjs`
- `package.json`
- `.env.example`
- `scripts/validate.mjs`
- `docs/01-ARQUITETURA.md`
- `DUTRA_OS_CONTEXT.md`
- `AI_HANDOFF.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `docs/stories/WA-MCP-01-kaption-crm-bridge.md`


## Validação executada

- GitHub Actions `Package 00R CI` run **313**: PASS.
- `npm run validate`: PASS.
- `npm run og:brain:check`: PASS.
- `npm run og:security:test`: PASS.
- `npm audit --audit-level=high`: PASS.
- `npm run release:gate`: PASS.
- O primeiro CI (run 306) detectou uma asserção incorreta do novo teste; a falha foi corrigida antes da integração.
- Teste com o **Kaption real no computador do usuário** não é executável no runner do GitHub e permanece como verificação operacional pós-merge. O worker falha fechado se a ponte MCP ou a chave de ingestão estiverem indisponíveis.
