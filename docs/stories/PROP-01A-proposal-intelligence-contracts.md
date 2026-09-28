# PROP-01A — Proposal Intelligence Contracts

Status: **em revisão**

## Objetivo

Criar a fundação segura da proposta rastreável sem expor CRM, sem inventar eventos e sem publicar uma rota pública antes da persistência/auth adequada.

## Entrega

- snapshot comercial sanitizado e versionado;
- registro interno em `generatedDocuments` com `documentType=proposal_tracking`;
- quote normalizada em `operations.quotes`;
- evento `proposal.prepared` somente quando o usuário salva a cotação;
- publicação nasce explicitamente desativada, sem token e sem URL pública;
- contrato futuro de eventos públicos exige `trustedServer=true`;
- validação bloqueia chaves sensíveis em snapshot público.

## Regra crítica

Eventos `proposal_opened`, `proposal_reopened`, `proposal_contact_clicked` e `proposal_accepted` **não podem ser produzidos pelo front-end**. Eles só poderão entrar quando existir backend público confiável, rate limit e armazenamento adequado.

## Não objetivos desta fatia

- link público;
- Proposal Room;
- rastrear pixels;
- publicar token no navegador;
- marcar proposta como enviada automaticamente;
- alterar status comercial por inferência.

## Rollback

Reverter o pacote remove a preparação automática do rascunho. Como os novos registros são aditivos dentro de coleções já existentes, dados históricos de CRM não são reescritos.
