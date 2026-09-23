# OG-15 — Biblioteca Comercial local-first

## Status

Ready for Review

## História

**Como** vendedor da Olho de Gato,  
**quero** cadastrar, localizar, visualizar e classificar materiais comerciais,  
**para que** eu encontre rapidamente o conteúdo correto sem depender de uma pasta desorganizada ou enviar algo sem autorização.

## Resultado entregue

A aplicação possui uma Biblioteca Comercial funcional em computador e celular. Os metadados usam a coleção versionada `operations.materials`; arquivos selecionados são guardados em IndexedDB somente no aparelho. O estado compartilhado recebe apenas metadados e referências locais, nunca o conteúdo binário.

## Critérios de aceite

- [x] Material é cadastrado com ID estável, versão, origem, status e permissão.
- [x] Tipos suportados: vídeo, imagem, PDF, apresentação, áudio, link, script e mensagem.
- [x] Busca cobre título, descrição, segmento, etapa, dor, objeção, decisor, produto e veículo.
- [x] Filtros cobrem tipo, status, permissão e favoritos.
- [x] Galeria ordena favoritos e conteúdos recentes.
- [x] Prévia local suporta imagem, vídeo, áudio e PDF quando disponíveis.
- [x] Mídia ausente exibe um estado seguro e mantém os metadados.
- [x] Conteúdo interno exibe bloqueio explícito para compartilhamento.
- [x] Conteúdo autorizado exige referência de autorização.
- [x] “Preparar para cliente” apenas copia texto/link para revisão e informa que nenhum envio ocorreu.
- [x] Criação e alteração geram eventos operacionais idempotentes.
- [x] O shell PWA inclui o módulo local de arquivos.
- [x] Nenhum conteúdo comercial real ou arquivo privado foi versionado.

## Decisões técnicas

- `operations.materials` é a fonte dos metadados sincronizáveis.
- `og-commercial-library/assets` no IndexedDB contém os blobs locais.
- `localAsset.id` vincula metadado e arquivo sem carregar binários para JSON, servidor ou Git.
- A prévia usa URLs temporárias, revogadas ao fechar.
- Links externos aceitam apenas HTTP e HTTPS.
- Envio e histórico de compartilhamento pertencem à Fase 3.

## Limites desta entrega

- Arquivos não são sincronizados entre aparelhos; ao abrir em outro dispositivo, a ficha permanece e a interface solicita novo anexo.
- Não há envio automático, rastreamento de abertura ou integração direta com WhatsApp.
- Não há conteúdo real pré-carregado, pois materiais e autorizações devem ser fornecidos e revisados pelo usuário.
- Pacotes por cliente e recomendações no Call AI serão tratados na Fase 3.

## Validação

- `npm run og:check`
- `npm run og:ops:test`
- `npm run og:library:test`
- `npm run og:product:test`
- `npm run og:call-ai:test`
- `npm run aiox:config-check`
- revisão visual em navegador local

## File List

- `apps/sistema-og/index.html`
- `apps/sistema-og/app.js`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/material-store.js`
- `apps/sistema-og/service-worker.js`
- `scripts/test_material_library.mjs`
- `package.json`
- `docs/stories/OG-15-biblioteca-comercial-local-first.md`
- `docs/stories/OG-14-roadmap-fases-2-a-9.md`

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 1.0 | Biblioteca Comercial local-first implementada para revisão | Codex |
