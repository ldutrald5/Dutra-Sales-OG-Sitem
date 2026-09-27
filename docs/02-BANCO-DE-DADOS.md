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

O objeto lead reúne empresa, contato principal, telefone, segmento, frota, status, prioridade, dor, decisor, próxima ação, follow-up e interações. `lead.id` deve continuar estável até uma migração explícita e validada.

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
- Preparado, aberto, enviado, vendido, faturado e pago são estados distintos.
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
