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
