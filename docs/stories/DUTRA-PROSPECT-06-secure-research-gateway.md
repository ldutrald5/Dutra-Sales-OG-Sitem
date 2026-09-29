# DUTRA-PROSPECT-06 — Secure Research Gateway

## Entrega
Endpoint autenticado `POST /api/prospects/research` no servidor do Sistema OG.

- valida cidade, UF, segmento, frota mínima, palavras-chave e quantidade;
- limita cada pesquisa a 25 resultados;
- rate limit de 6 pesquisas/minuto por origem;
- timeout externo de 8 segundos;
- provider e segredo somente por `OG_PROSPECT_SEARCH_ENDPOINT` / `OG_PROSPECT_SEARCH_TOKEN`;
- resposta sempre marcada `prepare_only` e `public_sources_required`;
- não grava lead, não envia mensagem e não executa ação comercial.

## Segurança
A rota herda a autenticação já existente de `/api/*`. Nenhuma credencial do provider é enviada ao browser.

## Próximo
PROSPECT-07 conecta o formulário da aba Prospecção ao gateway, executa o pipeline Intake → Research → Review e mantém importação no CRM dependente de clique/confirmação humana.
