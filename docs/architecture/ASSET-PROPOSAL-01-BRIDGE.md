# ASSET-PROPOSAL-01 — Ponte entre Memória Visual e Proposta Oficial

Status: **transição segura implementada; vínculo canônico aguardando Proposal UUID**

## Contexto

O DUTRA OS possui hoje dois identificadores de proposta com responsabilidades diferentes:

1. **Proposal Tracking do Railway** — documento operacional em `operations.generatedDocuments`, com IDs textuais como `PROP-COT-...`;
2. **Proposal canônica do Supabase** — registro `public.proposals.id` em UUID, usado pelo motor canônico de proposta/PDF.

Esses IDs não são intercambiáveis.

`public.asset_links.proposal_id` é FK para `public.proposals(id)`. Portanto, um ID textual do tracking Railway **nunca** deve ser convertido, copiado ou forçado para esse campo.

## Decisão de transição

### Seleção

A V3 mostra no fluxo de proposta somente imagens retornadas pelo endpoint protegido:

`GET /api/assets/proposal-eligible`

O gateway aplica a política no servidor:

- Asset `ACTIVE`;
- `media_kind=IMAGE`;
- `usage_policy=PROPOSAL_ALLOWED`;
- `sensitivity_level != CONFIDENTIAL`;
- `visibility_class != RESTRICTED`.

A seleção é **manual** e limitada a duas imagens.

Nenhuma imagem é escolhida automaticamente só por ser pública, principal ou encontrada na web.

### Handoff

O `dutra_quote_handoff_v1` transporta apenas referências estáveis:

- `assetId`;
- `versionId`;
- categoria;
- título;
- política de uso;
- sensibilidade.

Signed URLs, Storage paths, hashes e credenciais **não** são persistidos no handoff.

### Runtime do motor oficial

Ao abrir o motor legado dentro da V3, a ponte assina cada Asset selecionado somente naquele momento usando:

`/core-api/assets/<assetId>/access?ttl=600&versionId=<versionId>`

A signed URL existe apenas em memória no objeto `window.__DUTRA_QUOTE_HANDOFF__` do iframe e não volta para `sessionStorage`, CRM ou banco. O `versionId` selecionado é enviado à assinatura para impedir que uma substituição ocorrida entre seleção e geração troque silenciosamente a imagem da proposta.

Os três templates oficiais de proposta podem então renderizar o bloco **Contexto Visual da Conta** usando somente esses URLs temporários.

### Histórico interno

Quando a cotação é salva, o Proposal Tracking preserva `assetRefs` com `assetId + versionId`.

Essas referências ficam fora do `snapshot` público. O endpoint de publicação continua enviando apenas `document.snapshot` para o servidor público.

Isso preserva evidência da versão visual utilizada sem publicar IDs internos da Memória Visual.

## Vínculo canônico futuro

Quando o motor oficial expuser o UUID de `public.proposals.id` para a V3/core, executar para cada Asset realmente utilizado:

`POST /api/assets/<assetId>/links`

com:

- `proposalId=<UUID canônico>`;
- `role=PROPOSAL_INPUT`;
- `pinnedVersionId=<versionId realmente usado>`.

O trigger `asset_links_integrity_guard` já garante:

- Proposal e Asset pertencem à mesma Company;
- a versão pinada pertence ao Asset;
- Proposal sempre possui versão pinada.

## Proibições

- não gravar ID textual `PROP-COT-...` em `asset_links.proposal_id`;
- não persistir signed URL;
- não inserir `storage_path` no snapshot público;
- não auto-selecionar Asset `INTERNAL_REFERENCE`;
- não considerar `PUBLIC_SOURCE` como licença de uso comercial;
- não recriar o motor de proposta na V3 só para completar esta integração.

## Critério para concluir a ponte canônica

A integração só pode ser marcada como canônica quando o fluxo real de criação/salvamento de proposta devolver ou expuser de maneira confiável o UUID de `public.proposals.id`.

Até lá, a V3 consegue personalizar a proposta com Assets aprovados e preservar a versão usada no tracking interno, sem falsificar relacionamento de banco.
