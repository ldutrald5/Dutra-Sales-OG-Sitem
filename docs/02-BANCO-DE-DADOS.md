# Banco de dados e persistência

## Estado real hoje

Não há banco relacional. O navegador é a fonte operacional local e usa:

| Camada | Chave/local | Conteúdo |
|---|---|---|
| localStorage | `og_leads_crm` | Contas/leads e interações incorporadas |
| localStorage | `og_cotacoes_history` | Histórico e snapshots de cotações |
| localStorage | `og_operations_state` | Envelope operacional `schemaVersion: 2` |
| IndexedDB | `og-commercial-library` | Arquivos da Biblioteca Comercial |
| IndexedDB `sistema-og-sync` | `outbox` + `recovery` | Estado pendente de sincronização, conflitos e revisão; envio ocorre no foreground autenticado |
| Servidor local | `.data/shared-state.json` | Espelho privado com revisão |
| Cloudflare | KV opcional | Estado compartilhado remoto |

O envelope operacional V2 adiciona `companies`, `contacts`, `opportunities`, `activities` e `tasks` à frente das coleções legadas. A coleção `contacts` é temporariamente mista: registros canônicos usam `entityType: 'contact'`; registros legados sem `entityType` permanecem preservados e não são reinterpretados automaticamente. Ele também possui `callSessions`, `materials`, `materialShares`, `materialPackages`, `quotes`, `quoteTemplates`, `messageTemplates`, `documentTemplates`, `generatedDocuments`, `sales`, `commissions`, `partners`, `transporters`, `transporterCoverage`, `users`, `goals` e `activityEvents`. Nem todas estão preenchidas pelas telas atuais.

## Entidade central atual

O objeto lead reúne empresa, contato principal, telefone principal, `additionalPhones[]`, `internalCode` (Código OG), `referrals[]`, segmento, frota, status, prioridade, dor, decisor, próxima ação, follow-up e interações. `lead.id` deve continuar estável até uma migração explícita e validada. `internalCode` é um identificador de cadastro externo e **não** representa venda, faturamento ou pagamento.

## Modelo conceitual de destino

| Entidade | Responsabilidade |
|---|---|
| Company | Identidade, perfil, segmento e estágio da conta |
| Contact | Pessoas, cargo, canais e papel na decisão |
| Opportunity | Valor, estágio, produtos, risco e previsão |
| Activity | Fatos confirmados e auditáveis |
| Task | Próxima ação, prazo, responsável e estado |
| Interaction | Conversa, ligação, reunião, nota ou mensagem |
| Proposal | Cotação/proposta versionada e seu status |
| Message | Rascunho, canal, envio confirmado e resultado |
| Template | Base versionada, variáveis e finalidade |
| AIContext | Resumo compacto, fontes e validade do contexto |

Relações futuras usam `companyId` como raiz. Nenhuma migration desse modelo está autorizada nesta etapa.

## Regras de integridade

- IDs estáveis e únicos; referências inválidas vão para revisão.
- Datas persistidas em ISO 8601; agenda conserva fuso quando necessário.
- Valores monetários em centavos e moeda explícita; agregações não podem somar moedas diferentes.
- Preparado, aberto, enviado, vendido, faturado e pago são estados distintos.\n- Ter `internalCode`/Código OG e ter comprado são estados independentes.\n- Código OG informado pelo usuário deve ser único na base operacional; o sistema não gera valor fictício.
- Áudio e arquivos ficam por referência e não entram no JSON principal.
- Campos importados mantêm origem, data e confirmação.
- Exclusões futuras usam tombstone e backup; nunca apagar dados automaticamente.

## Lacunas

- Reconciliação em massa do legado para Company/Contact/Opportunity ainda não foi executada.
- Backup e restauração visíveis ao usuário.
- Resolução manual por campo ainda não existe: o 04R mostra campos divergentes e usa merge determinístico por registro para preparar revisão humana.
- Políticas de retenção e descarte de áudio.
- Autenticação, papéis e trilha por usuário.
- Índices/consultas para crescimento do volume.

Contrato detalhado e plano aditivo: [Fundação de Operações](architecture/og-operations-foundation.md).


## P0-CRM-PERSISTENCE-RECOVERY-01 — contrato local, não publicado

Em 08/11/2026, P0-A foi incorporado à integração em `7519e4a1330cea9bccd983f4fb1cebb40a4dc982`, sem deploy. A proteção abaixo é uma implementação local posterior, ainda não publicada.

O owner continua sendo o estado existente; `server-state-store.cjs` é somente a fronteira de filesystem do `server.mjs`. `GET/PUT /api/state` mantêm o contrato válido e revision-authoritative409. JSON inválido, falha de leitura/escrita e ausência após observação/inicialização retornam 503 sanitizado. Inicialização vazia só ocorre com arquivo ausente e sem evidência anterior reconhecida; não há auto-restore nem base vazia como fallback para corrupção.

Cada substituição guarda `shared-state.json.backup` no formato v1 de OG_DATA_SAFETY, com revisão/data anterior e checksum SHA-256; a gravação para se não for possível criar/verificar essa cópia. `shared-state.json.initialized` registra inicialização; temporários não são aceitos como estado. Escrita usa arquivo exclusivo600, fsync e rename no mesmo diretório, sem prometer sobrevivência a power loss. Mantém-se uma cópia anterior; ela é do mesmo volume e **não é backup independente**. Snapshots IndexedDB e seus contratos continuam intactos. Nenhum arquivo histórico é mesclado, remapeado ou migrado automaticamente.

Comando local de operador, somente com paths explicitamente selecionados e autorização de dados apropriada:

```bash
npm run og:state:recovery -- export --source-dir /tmp/og-fonte-ficticia --backup-file /tmp/og-portatil-ficticio.json --confirm-local
npm run og:state:recovery -- restore --backup-file /tmp/og-portatil-ficticio.json --target-dir /tmp/og-destino-ficticio --confirm-local
```

Os caminhos acima são exemplos, não diretórios reais de produção. O export não sobrescreve arquivo existente. O restore valida o envelope/checksum quando presente, preserva IDs/revisão e recusa destino com dados diferentes; repetição idêntica é no-op. Backups v1 antigos sem checksum são aceitos por escolha explícita, sem alegar integridade criptográfica ou autenticidade. O comando recusa ambiente hospedado/produtivo e não tem destino padrão. Não altera volume/configuração nem restaura no servidor ativo.

Procedimento seguro: preservar original e cópias; exportar para local separado; verificar backup; testar restore em diretório descartável; conferir identidades, relações e revisões; pedir autorização específica antes de qualquer recuperação real. Falha parcial deixa evidências/marcadores para revisão; não apagá-los para forçar inicialização vazia. `/health` continua liveness; falha da API de estado não significa que o processo esteja morto.

Limites: prova de recuperação apenas entre diretórios locais isolados, sem prova de off-host/Railway. Não há coordenação de múltiplos processos escritores nem garantia universal contra exclusão externa de todos os arquivos/marcadores; legado sem marcador só ganha evidência durável no primeiro write protegido. Esses limites não autorizam migração de banco ou ampliação de acesso. Testes/evidências e rollback: [story](stories/P0-CRM-PERSISTENCE-RECOVERY-01.md).
