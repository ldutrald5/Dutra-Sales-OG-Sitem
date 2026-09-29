# DUTRA-PROSPECT-08 — Firecrawl Runtime + CI Gate

O gateway de pesquisa pública foi endurecido para o provider Firecrawl v2 sem expor credenciais ao navegador ou ao Git.

## Contrato de runtime

- Endpoint configurável por `OG_PROSPECT_SEARCH_ENDPOINT`.
- Token somente no servidor por `OG_PROSPECT_SEARCH_TOKEN`.
- Contrato compatível com `POST /v2/search`: corpo `{ query, limit }` e autenticação Bearer.
- Respostas `data.web` são normalizadas para candidatos com evidência pública.
- Quando o endpoint é Firecrawl, o provider retornado é `firecrawl_v2_search`.
- A pesquisa continua `prepare_only`: nenhuma empresa entra no CRM sem revisão e confirmação humana.

## Segurança e operação

A chave não é armazenada no repositório, frontend ou logs. O gateway mantém autenticação do DUTRA OS, limite de 6 pesquisas por minuto, timeout de 8 segundos e limite máximo de 25 resultados por busca.

## CI

A suíte de validação principal agora executa todos os testes DUTRA-PROSPECT-01 a 07, incluindo endpoint, provider, review e pipeline de UI. O teste do endpoint também protege explicitamente o contrato Firecrawl e a ausência de vazamento do token.

## Produção

As variáveis podem ser preparadas no Railway sem deploy. Promoção para `main` e deploy permanecem etapas separadas e deliberadas.
