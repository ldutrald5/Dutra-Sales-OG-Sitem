# Proteção e sincronização dos dados

## Objetivo

Evitar que clientes, histórico e sugestões fiquem presos a um único endereço ou aparelho.

## Camadas implementadas

1. **Servidor permanente:** Cloudflare Worker com KV `OG_DATA` e código de acesso. Requer autenticar a conta e criar o namespace antes da primeira publicação permanente.
2. **Sincronização segura:** alterações concorrentes retornam conflito de revisão; o cliente mescla os registros por ID e data antes de reenviar.
3. **Backup do servidor:** antes de cada gravação, a versão anterior é preservada por 30 dias; o índice mantém as 20 versões mais recentes.
4. **Backup automático local:** IndexedDB mantém as 10 cópias mais recentes de cada origem instalada.
5. **Exportação manual:** gera um JSON versionado com clientes, cotações e operações.
6. **Restauração:** valida o arquivo, mostra as quantidades, pede confirmação e mescla sem excluir dados atuais.
7. **Sugestões:** eventos `ux.feedback` aparecem em Operações e podem assumir `new`, `in_progress` ou `done`.

## Ativação permanente

Executar `wrangler login`, criar o namespace KV, substituir `SUBSTITUIR_PELO_ID_DO_KV` em `wrangler.jsonc`, configurar `OG_ACCESS_TOKEN` como segredo e publicar `sistema-og`. A publicação temporária nunca deve ser tratada como banco definitivo.
