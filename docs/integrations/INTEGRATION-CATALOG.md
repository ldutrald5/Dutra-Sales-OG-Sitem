# Catálogo de Integrações DUTRA OS

Status: arquitetura inicial. Nenhuma integração listada implica permissão automática para agir.

| Capacidade | Papel | Política inicial |
|---|---|---|
| GitHub | código, issues, PRs e CI/CD | escrita em branch; produção protegida |
| Google Calendar | agenda e preparação do dia | leitura primeiro; escrita com aprovação |
| Gmail | contexto e comunicação comercial | busca/leitura conforme permissão; envio com aprovação |
| Google Contacts | resolução de contatos | leitura |
| Google Drive | materiais OG e documentos | leitura/indexação; escrita controlada |
| Railway | runtime hospedado | health/logs primeiro; mudanças com gate |
| Supabase | persistência futura/canônica | somente após contrato de dados e segurança |
| Slack/Notion | colaboração/documentação opcional | sob demanda |
| Web pública | pesquisa de prospects/evidências | registrar origem e data |

## Regra para novos conectores
Um conector só entra no fluxo produtivo após definir: objetivo, dados acessados, escopos, operações de escrita, aprovação, idempotência, health check, logs, custo e fallback.
