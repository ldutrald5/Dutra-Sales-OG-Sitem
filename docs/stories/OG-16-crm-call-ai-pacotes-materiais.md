# OG-16 — CRM, Call AI e pacotes de materiais

## Status

Ready for Review

## História

**Como** vendedor,  
**quero** receber recomendações explicáveis e montar um pacote revisável para uma conta,  
**para que** eu compartilhe o conteúdo certo e registre apenas o que realmente enviei.

## Resultado entregue

A ficha do CRM e o contexto do Call AI exibem recomendações da Biblioteca. O vendedor monta, altera e salva pacotes por cliente, revisa a mensagem completa, copia ou abre o WhatsApp sem gerar falso envio e confirma manualmente o envio realizado.

## Critérios de aceite

- [x] Recomendações usam apenas materiais aprovados e autorizados para cliente.
- [x] Cada recomendação apresenta os motivos encontrados: segmento, etapa, dor, decisor ou veículo.
- [x] Ausência de correspondência exibe estado vazio honesto.
- [x] Regras são editáveis por meio das tags do material na Biblioteca.
- [x] Pacote pode ser alterado antes do preparo e antes do envio.
- [x] Rascunhos usam `MaterialPackage` e vínculo obrigatório com `clientId`.
- [x] Copiar conteúdo não registra envio.
- [x] Abrir WhatsApp não registra envio.
- [x] A confirmação explícita cria `MaterialShare`, evento e interação no CRM.
- [x] Registro de envio não afirma abertura ou visualização.
- [x] Próxima ação pode ser atualizada na confirmação.
- [x] Call AI continua independente de áudio e de IA externa.
- [x] Gravação continua manual e local.

## Regras de negócio

- Material `internal` nunca entra na lista de envio.
- Material em rascunho, desatualizado ou arquivado não entra em recomendação nem pacote.
- `sentAt` só é aceito quando `sentConfirmedByUser === true`.
- A pontuação apenas ordena correspondências; ela não envia, aprova ou altera CRM.
- Materiais autorizados sem correspondência ficam disponíveis no construtor manual, mas não aparecem como recomendação.

## Validação

- `npm run og:packages:test`
- `npm run og:library:test`
- `npm run og:ops:test`
- `npm run og:check`
- `npm run og:product:test`
- `npm run og:call-ai:test`
- `npm run aiox:config-check`
- revisão visual da ficha CRM e do construtor de pacotes

## File List

- `apps/sistema-og/sales-materials.js`
- `apps/sistema-og/operations-model.js`
- `apps/sistema-og/app.js`
- `apps/sistema-og/index.html`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/service-worker.js`
- `scripts/test_material_packages.mjs`
- `package.json`
- `docs/stories/OG-16-crm-call-ai-pacotes-materiais.md`
- `docs/stories/OG-14-roadmap-fases-2-a-9.md`

## Limites

- A integração não rastreia abertura ou leitura no WhatsApp.
- Arquivos locais permanecem no aparelho; o pacote sincroniza metadados, mensagem e referências.
- Não há recomendação generativa externa nesta fase; o motor local usa somente campos registrados.

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 1.0 | Recomendações, pacotes, revisão e confirmação de envio implementados | Codex |
