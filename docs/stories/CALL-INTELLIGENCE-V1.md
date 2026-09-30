# CALL-INTELLIGENCE-V1 — Gravação, transcrição e métricas

## Objetivo

Transformar ligações revisadas pelo Call AI em evidência comercial mensurável sem permitir que áudio, transcrição ou inferência de IA modifiquem silenciosamente o CRM.

## Fluxo

`Call AI → Gravar → Encerrar → Revisar áudio → Salvar áudio + analisar → Storage privado → transcrição opcional → métricas → resultado humano → Sales Execution`.

## Critérios de aceite

- [x] Gravação começa somente por clique explícito.
- [x] Microfone e áudio do computador continuam suportados.
- [x] Em captura mista, vendedor e áudio remoto são medidos em canais separados antes da mixagem.
- [x] Pausas não entram na duração efetiva.
- [x] Áudio permanece local até o vendedor clicar em salvar.
- [x] Upload usa URL assinada e bucket privado.
- [x] Browser não recebe chave administrativa do Supabase nem chave do provedor de transcrição.
- [x] Metadata de gravação é idempotente por `call_session_id`.
- [x] Transcrição automática ocorre server-side quando o provedor está disponível.
- [x] Texto transcrito manualmente funciona como fallback.
- [x] Métricas são persistidas separadamente dos fatos canônicos.
- [x] Extrações numéricas são marcadas `review_required`.
- [x] Gravação pode ser ligada ao `call_attempt` depois do resultado aprovado.
- [x] Dashboard de 30 dias usa fatos persistidos.
- [ ] Validar captura real PC + microfone em ambiente de produção.
- [ ] Validar uma transcrição automática real com áudio de teste autorizado.
- [ ] Calibrar limiar de atividade de voz com chamadas reais.
- [ ] Criar revisão assistida de candidatos antes de qualquer promoção para CRM.

## Segurança e privacidade

O bucket `call-recordings` é privado. O upload é uma ação explícita. A transcrição e os indicadores não são fatos de CRM. Nenhuma regra nesta entrega inicia gravação automaticamente ou envia uma chamada sem ação do vendedor.

## Rollback

A funcionalidade é aditiva. Se o gateway estiver indisponível, a gravação local e o download continuam funcionando. As tabelas e objetos existentes não são excluídos automaticamente.

## AI Secure Backend — incremento de confiabilidade

- [x] Timeout de 90 segundos na chamada OpenAI (inclui leitura do JSON).
- [x] X-Client-Request-Id único e x-request-id persistidos em provider_usage; falhas em metadata.ai_request.
- [x] Corpo de erro do provedor não é persistido nem logado.
- [x] Falhas de tarefas em background são tratadas sem imprimir objetos de erro.
- [x] Testes simulados de sucesso, HTTP 429, rede, timeout e JSON inválido.
- [ ] Autenticação individual e autorização por organização (gateway atual usa token interno).
- [ ] Ledger ai_requests, deduplicação concorrente e recuperação durável/retry.
- [ ] Responses API com saída estruturada e revisão integrada à Mutation Queue.
- [ ] Validação real de transcrição com chave configurada e áudio autorizado.

### File List do incremento

- supabase/functions/call-intelligence/index.ts
- supabase/functions/call-intelligence/provider-request.ts
- scripts/test_call_intelligence_provider.mjs
- scripts/test_call_intelligence_contract.mjs
- package.json
- docs/stories/CALL-INTELLIGENCE-V1.md

Não habilitar acesso direto pelo navegador: verify_jwt=false é compatível somente com a autenticação interna existente; não equivale a Supabase Auth multiusuário. Retry após timeout não é automático, porque o provedor pode já ter processado e cobrado a requisição.

### Validação do incremento

Sintaxe, contratos Call Intelligence, testes comportamentais do provedor, Builder Brain e release gate passaram. Após npm ci --ignore-scripts, a suíte geral npm test passou, incluindo aiox:config-check. Deploy segue pendente de reconciliação com a função live.

File List adicional: docs/06-CALL-AI.md; tasks/TODO.md.
