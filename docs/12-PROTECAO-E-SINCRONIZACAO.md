# Proteção e sincronização dos dados

## Objetivo

Evitar que clientes, histórico e sugestões fiquem presos a um único endereço ou aparelho.

## Camadas implementadas

1. **Servidor permanente:** Cloudflare Worker com KV `OG_DATA` e código de acesso. Requer autenticar a conta e criar o namespace antes da primeira publicação permanente.
2. **Sincronização segura:** alterações concorrentes retornam conflito de revisão; o cliente preserva as versões local/remota, bloqueia novos writes e exige revisão humana antes de qualquer envio reconciliado.
3. **Backup do servidor:** antes de cada gravação, a versão anterior é preservada por 30 dias; o índice mantém as 20 versões mais recentes.
4. **Backup automático local:** IndexedDB mantém as 10 cópias mais recentes de cada origem instalada.
5. **Exportação manual:** gera um JSON versionado com clientes, cotações e operações.
6. **Restauração:** valida o arquivo, mostra as quantidades, pede confirmação e mescla sem excluir dados atuais.
7. **Sugestões:** eventos `ux.feedback` aparecem em Operações e podem assumir `new`, `in_progress` ou `done`.

## Ativação permanente

Executar `wrangler login`, criar o namespace KV, substituir `SUBSTITUIR_PELO_ID_DO_KV` em `wrangler.jsonc`, configurar `OG_ACCESS_TOKEN` como segredo e publicar `sistema-og`. A publicação temporária nunca deve ser tratada como banco definitivo.


## Preview HTTPS em Railway

O runtime local-first pode ser publicado como **prévia HTTPS protegida** no Railway sem transformar o JSON local em banco definitivo.

Requisitos do serviço:
- o Railpack detecta o script padrão `npm start`, que encaminha para `npm run og:start:hosted`;
- healthcheck do serviço: `/health`;
- segredo `OG_ACCESS_TOKEN` com pelo menos 16 caracteres;
- domínio público Railway gerado para o serviço;
- volume persistente recomendado, montado em um caminho que o Railway expõe como `RAILWAY_VOLUME_MOUNT_PATH`.

O entrypoint hospedado usa o `PORT` fornecido pelo Railway, escuta em `0.0.0.0` e mantém `/api/*` protegido por Bearer token. O endpoint `/health` não exige autenticação e serve somente para o healthcheck da plataforma.

**Importante:** esse deploy é uma camada de preview/acesso remoto. A direção arquitetural continua sendo Supabase Postgres/Auth como verdade relacional oficial; não tratar o arquivo JSON hospedado como substituto dessa etapa.


### Nota Railway 2026

Para serviços Railway novos, não usar `railway.json`/Config as Code como fonte de configuração. O repositório expõe um script `start` padrão para deploy zero-config; healthcheck, domínio, segredo e volume são definidos no serviço Railway (ou via Railway Agent/CLI/IaC quando disponível).
