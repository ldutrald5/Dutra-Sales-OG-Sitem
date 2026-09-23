# Fundação de Operações — Sistema OG 2026

**Status:** proposta arquitetural da Fase 1  
**Versão do documento:** 1.0.0  
**Escopo:** modelo de dados, eventos, persistência local-first e migração aditiva  
**Story de origem:** `docs/stories/OG-10-evolucao-operacional-2026.md`

## 1. Objetivo e rastreabilidade

Esta fundação permite evoluir o Sistema OG de CRM leve para uma central comercial com Biblioteca Comercial, Performance, Vendas, Documentos, Comissões e Transportadoras, sem duplicar clientes nem apagar o estado existente.

As decisões deste documento derivam dos seguintes requisitos já aprovados:

- um único registro de cliente para todos os módulos;
- funcionamento local-first e PWA;
- migrações aditivas e preservação do `localStorage` existente;
- dados reais, gravações, chaves e `.data` fora do Git;
- ações externas, gravações e alterações de CRM somente por ação explícita;
- dashboards como leitura dos dados operacionais, sem decisão autônoma;
- campos técnicos, cobertura e resultados comerciais sem fonte devem permanecer não confirmados.

## 2. Diagnóstico da arquitetura atual

### 2.1 Componentes

```text
PWA no navegador
  ├─ app.js: estado, regras, persistência e interface
  ├─ localStorage: og_leads_crm + og_cotacoes_history
  ├─ IndexedDB: outbox do service worker
  └─ service worker: shell offline e envio posterior
             │
             ▼
server.mjs / Cloudflare equivalente
  └─ estado compartilhado: revision + leads + history
```

O navegador é a origem operacional durante o uso. O servidor local mantém um espelho compartilhado em `.data/shared-state.json`, com controle de revisão e merge por ID. O service worker guarda uma cópia pendente na outbox quando a rede não está disponível.

### 2.2 Modelo atual

- `state.leads`: cliente, contato principal, estágio, prioridade, dor, decisor, próxima ação e interações no mesmo objeto.
- `lead.interactions`: notas, cotações e sessões do Call AI incorporadas ao cliente.
- `state.history`: histórico limitado de cotações, contendo um `payload` que copia grande parte do estado da aplicação.
- `state.client`: rascunho de cotação em memória, associado a um lead por telefone ou nome da empresa no momento de salvar.
- sincronização: envia sempre os arrays completos de `leads` e `history` para `/api/state`.

### 2.3 Pontos preservados

- O CRM já possui identidade estável por `lead.id`.
- Interações têm IDs e sessões do Call AI possuem `sessionId`, permitindo idempotência básica.
- O servidor usa gravação atômica por arquivo temporário.
- O conflito de revisão retorna `409`, em vez de sobrescrever silenciosamente.
- A PWA continua utilizável offline.

### 2.4 Limitações para as próximas fases

1. Cliente, contato, atividade e oportunidade ainda estão agregados no mesmo objeto.
2. Não há versão explícita do schema salvo.
3. O merge escolhe valores escalares pelo registro considerado mais recente; edições concorrentes de campos diferentes podem se perder.
4. A sincronização de arrays completos cresce com o histórico e dificulta auditoria.
5. Cotações usam uma cópia extensa do estado, sem entidade normalizada ou vínculo obrigatório por `clientId`.
6. Não existem entidades persistidas para material, compartilhamento, pacote, venda, comissão, parceiro, transportadora, meta ou usuário.
7. Datas usam nomes e formatos legados variados (`date`, `createdDate`, `at`, `followUpAt`).
8. Dashboards futuros não devem calcular resultados a partir de texto livre; precisam de eventos e entidades confirmadas.

## 3. Decisão arquitetural

Adotar um **estado operacional versionado**, normalizado por coleções e acompanhado por um **registro de eventos append-only**. A transição será feita por compatibilidade, mantendo as chaves legadas durante a fase de migração.

Princípios:

- `Client` é a raiz de identidade da conta.
- Contatos, interações, cotações e demais registros apontam para `clientId`.
- Entidades descrevem o estado atual; eventos descrevem fatos ocorridos.
- Dashboards leem entidades e eventos, sem alterar o processo comercial.
- Alterações locais são confirmadas primeiro no aparelho e sincronizadas depois.
- Campos de origem externa carregam procedência e nível de confirmação.
- Valores monetários são armazenados em centavos inteiros e moeda explícita.
- Datas persistidas usam ISO 8601 em UTC; datas de agenda mantêm também o fuso quando necessário.

## 4. Envelope versionado

O contrato raiz proposto é `OgOperationsState` versão `1.0.0`:

```ts
type OgOperationsStateV1 = {
  schemaVersion: '1.0.0';
  revision: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deviceId: string;
  lastEventSequence: number;
  collections: {
    clients: Record<Id, ClientV1>;
    contacts: Record<Id, ContactV1>;
    interactions: Record<Id, InteractionV1>;
    callSessions: Record<Id, CallSessionV1>;
    materials: Record<Id, MaterialV1>;
    materialShares: Record<Id, MaterialShareV1>;
    materialPackages: Record<Id, MaterialPackageV1>;
    quotes: Record<Id, QuoteV1>;
    quoteTemplates: Record<Id, QuoteTemplateV1>;
    messageTemplates: Record<Id, MessageTemplateV1>;
    documentTemplates: Record<Id, DocumentTemplateV1>;
    generatedDocuments: Record<Id, GeneratedDocumentV1>;
    sales: Record<Id, SaleV1>;
    commissions: Record<Id, CommissionV1>;
    partners: Record<Id, PartnerV1>;
    transporters: Record<Id, TransporterV1>;
    transporterCoverage: Record<Id, TransporterCoverageV1>;
    users: Record<Id, UserV1>;
    goals: Record<Id, GoalV1>;
    activityEvents: Record<Id, ActivityEventV1>;
  };
  tombstones: Record<CollectionName, Record<Id, ISODateTime>>;
  migration: MigrationStateV1;
};
```

Cada entidade inclui o cabeçalho comum:

```ts
type EntityMetaV1 = {
  id: Id;
  schemaVersion: 1;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  createdBy?: Id;
  updatedBy?: Id;
  source: 'manual' | 'legacy' | 'import' | 'ocr' | 'call_ai' | 'system';
  sourceRef?: string;
  verification: 'confirmed' | 'unverified' | 'needs_review';
  deletedAt?: ISODateTime;
};
```

`schemaVersion` no envelope versiona o conjunto. `schemaVersion` inteiro em cada entidade permite migrar uma coleção por vez.

## 5. Modelo de dados v1

Os campos listados são o contrato mínimo da fundação. Campos específicos podem ser acrescentados de forma compatível quando a story correspondente trouxer critérios de aceite.

### 5.1 Cliente e relacionamento

**Client**

- identidade: `id`, `legalName`, `displayName`, `cnpj`, `stateRegistration`;
- localização: `city`, `state`, `country`;
- perfil: `segmentId`, `fleetSize`, `vehicleTypeIds[]`, `sourceChannel`;
- comercial: `stage`, `priority`, `painConfirmed`, `hypotheses[]`, `decisionMakerContactId`;
- agenda: `nextAction`, `followUpAt`, `lastContactAt`;
- legado: `legacyLeadId`, `legacySnapshotHash`;
- metadados comuns.

Regras:

- `stage`: `new | contacted | diagnosis | proposal | negotiation | won | lost | post_sale`;
- deduplicação sugere candidatos por CNPJ, telefone e empresa/cidade, mas nunca mescla automaticamente registros ambíguos;
- `painConfirmed` contém somente dor declarada ou confirmada; hipóteses ficam separadas.

**Contact**

- `clientId`, `name`, `role`, `phone`, `email`;
- `isDecisionMaker`, `influence`, `sentiment`;
- `preferredChannel`, `consentNotes`;
- metadados comuns.

**Interaction**

- `clientId`, `contactId?`, `callSessionId?`, `quoteId?`, `materialShareId?`;
- `type`: `note | call | whatsapp | email | meeting | quote | material | follow_up`;
- `occurredAt`, `summary`, `outcome`, `nextAction?`;
- `confirmedByUser`, `attachments[]`;
- metadados comuns.

**CallSession**

- `clientId`, `contactId?`, `objective`, `startedAt`, `endedAt?`;
- `status`: `prepared | in_progress | reviewed | saved | discarded`;
- `notes`, `signals[]`, `result?`, `recordingLocalRef?`, `transcriptRef?`;
- `crmSavedAt?`, `idempotencyKey`;
- metadados comuns.

O arquivo de áudio não faz parte do estado sincronizado por padrão. `recordingLocalRef` apenas referencia armazenamento local e deve continuar sob ação explícita.

### 5.2 Biblioteca comercial

**Material**

- `title`, `description`, `mediaType`, `assetRef`, `thumbnailRef?`;
- `segmentIds[]`, `salesStages[]`, `painTags[]`, `objectionTags[]`;
- `decisionMakerRoles[]`, `productIds[]`, `vehicleTypeIds[]`, `applicationTags[]`;
- `durationSeconds?`, `suggestedMessage?`, `origin`, `author?`;
- `contentVersion`, `status`: `draft | approved | outdated | archived`;
- `audience`: `internal | customer_authorized`;
- `consentRef?`, `reviewedAt?`;
- metadados comuns.

**MaterialShare**

- `materialId`, `clientId`, `contactId?`, `packageId?`;
- `channel`, `preparedAt`, `sentAt?`, `sentConfirmedByUser`;
- `response?`, `commercialOutcome?`;
- metadados comuns.

`sentAt` só é preenchido após confirmação do usuário. Abrir o WhatsApp não constitui envio.

**MaterialPackage**

- `clientId`, `title`, `materialIds[]`, `messageDraft?`;
- `status`: `draft | reviewed | ready | archived`;
- `preparedBy?`, `reviewedAt?`;
- metadados comuns.

### 5.3 Cotação, modelos e documentos

**Quote**

- `clientId`, `contactId?`, `templateId?`, `status`;
- `items[]`: código, descrição, quantidade, valor unitário em centavos, fonte técnica e validação;
- `vehicles[]`, `currency`, `subtotalCents`, `discountCents`, `freightCents`, `totalCents`;
- `paymentTerms`, `validUntil?`, `assumptions[]`, `sourceQuoteLegacyId?`;
- metadados comuns.

Status: `draft | reviewed | prepared | sent | accepted | rejected | expired`.

**QuoteTemplate**, **MessageTemplate** e **DocumentTemplate**

- `name`, `purpose`, `audiences[]`, `segmentIds[]`;
- `requiredFields[]`, `optionalFields[]`, `contentVersion`;
- `status`: `draft | approved | archived`;
- `previewRef?` e conteúdo/configuração específica do tipo;
- metadados comuns.

**GeneratedDocument**

- `clientId`, `templateId`, `quoteId?`, `saleId?`, `commissionId?`;
- `templateVersion`, `generatedAt`, `fieldSnapshot`;
- `localFileRef?`, `checksum?`, `status`: `preview | generated | printed | archived`;
- metadados comuns.

O snapshot registra os valores usados na geração; não deve conter binário dentro do estado principal.

### 5.4 Venda, parceiro e comissão

**Sale**

- `clientId`, `quoteId?`, `sellerUserId?`, `partnerId?`;
- `items[]`, `currency`, `grossAmountCents`, `discountCents`, `netAmountCents`;
- `paymentTerms`, `soldAt`, `status`;
- `invoicedAt?`, `customerPaidAt?`, `documentIds[]`;
- metadados comuns.

Status: `registered | awaiting_invoice | invoiced | awaiting_customer_payment | paid | cancelled`.

**Partner**

- `name`, `documentNumber?`, `contactId?`, `commissionRuleDescription?`;
- `status`: `active | inactive | needs_review`;
- metadados comuns.

**Commission**

- `saleId`, `beneficiaryType`, `beneficiaryId?`;
- `calculationType`: `percentage | fixed | manual`;
- `percentageBasisPoints?`, `baseAmountCents`, `amountCents`, `currency`;
- `ruleSnapshot`, `status`, `expectedAt?`, `paidAt?`, `documentId?`;
- metadados comuns.

Status: `expected | awaiting_invoice | awaiting_customer_payment | released | document_sent | paid | pending_documentation | cancelled`.

Toda comissão mantém `ruleSnapshot`, base e resultado para explicar o cálculo posteriormente.

### 5.5 Transporte

**Transporter**

- `name`, `internalCode`, `officialWebsite?`, `phones[]`, `officialWhatsapp?`;
- `bases[]`, `modalities[]`, `notes?`, `verificationStatus`, `verifiedAt?`;
- `sourceUrls[]`;
- metadados comuns.

**TransporterCoverage**

- `transporterId`, `region?`, `state`, `cities[]`;
- `modality?`, `frequency?`, `leadTimeText?`;
- `sourceUrl`, `verifiedAt`, `verificationStatus`;
- metadados comuns.

Uma base ou filial não implica cobertura. Cobertura não confirmada usa `verification: needs_review` e não deve colorir o mapa como confirmada.

### 5.6 Usuários, metas e atividade

**User**

- `displayName`, `role`, `status`, `externalAuthId?`;
- metadados comuns.

Papéis previstos: `seller | manager | administrator | finance | partner`. A entidade não equivale a autenticação; permissões só entram em vigor com backend seguro.

**Goal**

- `ownerType`, `ownerId?`, `periodStart`, `periodEnd`;
- `metric`, `targetValue`, `unit`, `status`;
- metadados comuns.

**ActivityEvent**

- estrutura definida na seção seguinte;
- é a fonte auditável para produção e conversão, respeitando o estado confirmado das entidades.

## 6. Eventos operacionais

### 6.1 Contrato

```ts
type ActivityEventV1 = EntityMetaV1 & {
  sequence: number;
  eventType: EventTypeV1;
  occurredAt: ISODateTime;
  recordedAt: ISODateTime;
  actorUserId?: Id;
  deviceId: string;
  aggregateType: CollectionName;
  aggregateId: Id;
  clientId?: Id;
  correlationId?: string;
  causationId?: string;
  idempotencyKey: string;
  payload: Record<string, JsonValue>;
};
```

`payload` carrega somente dados necessários para o evento. Não deve copiar a entidade inteira nem armazenar áudio, imagens ou PDFs.

### 6.2 Catálogo inicial

- cliente: `client.created`, `client.updated`, `client.stage_changed`, `client.follow_up_scheduled`;
- contato: `contact.created`, `contact.updated`;
- interação: `interaction.recorded`;
- Call AI: `call.prepared`, `call.reviewed`, `call.saved`, `call.discarded`;
- material: `material.created`, `material.approved`, `material.outdated`, `material.package_prepared`, `material.share_confirmed`;
- cotação: `quote.created`, `quote.reviewed`, `quote.prepared`, `quote.sent_confirmed`, `quote.accepted`, `quote.rejected`;
- venda: `sale.registered`, `sale.status_changed`, `sale.cancelled`;
- comissão: `commission.calculated`, `commission.status_changed`, `commission.paid`;
- documento: `document.generated`, `document.printed`;
- transportadora: `transporter.verified`, `transporter.coverage_verified`;
- meta: `goal.created`, `goal.updated`.

### 6.3 Semântica para dashboards

- “ligação realizada” exige `interaction.recorded` do tipo `call` ou `call.saved` revisado;
- “material enviado” exige `material.share_confirmed`;
- “proposta enviada” exige `quote.sent_confirmed`;
- “venda” exige `sale.registered`, nunca a simples aceitação de uma cotação sem confirmação;
- “faturamento” depende do estado da venda;
- “comissão paga” exige `commission.paid`;
- abrir WhatsApp, gerar prévia ou preparar arquivo são atividades distintas de enviar, vender ou pagar.

Eventos são imutáveis. Correções geram novo evento e atualizam a entidade projetada; não reescrevem o evento anterior.

## 7. Persistência local-first

### 7.1 Camadas

```text
Comandos de domínio (CLI ou aplicação)
            │
            ▼
Validação + criação de entidade/evento
            │
            ▼
IndexedDB local ──► outbox de mudanças ──► API de sincronização
     │                                         │
     └──────── leitura offline ◄───────────────┘
```

1. **IndexedDB** torna-se o armazenamento canônico no navegador para coleções, eventos, outbox e metadados de migração.
2. **localStorage legado** permanece como fonte compatível e backup de leitura durante a transição; não deve ser apagado.
3. **Servidor local/cloud** armazena o envelope compartilhado ou, em evolução posterior, mudanças por entidade/evento.
4. **Arquivos grandes** ficam em armazenamento próprio local; o estado guarda referência, tipo, tamanho e checksum.
5. **`.data`** permanece privado e ignorado pelo Git.

### 7.2 Unidade de gravação

Cada comando grava na mesma transação IndexedDB:

1. entidade atualizada;
2. evento correspondente;
3. item de outbox com `idempotencyKey`, revisão-base e campos alterados.

A interface só informa “salvo” depois do commit local. “Sincronizado” exige confirmação do servidor.

### 7.3 Conflitos

- alterações em entidades diferentes podem ser unidas diretamente;
- alterações em campos diferentes da mesma entidade podem ser unidas por campo quando carregarem `fieldUpdatedAt` ou patch explícito;
- alterações concorrentes no mesmo campo geram conflito a revisar, sem escolha silenciosa;
- coleções filhas são mescladas por ID;
- exclusão usa tombstone e período de retenção, evitando ressurreição por aparelho desatualizado;
- eventos usam `idempotencyKey` e nunca são duplicados no replay.

O merge atual por “registro mais recente” permanece apenas para o contrato legado.

### 7.4 CLI first

A futura implementação deve expor as operações essenciais por comandos ou scripts antes de depender das telas:

- validar envelope e entidades;
- simular e aplicar migração;
- listar conflitos e duplicidades;
- importar e exportar dados;
- reconstruir projeções de indicadores a partir de eventos;
- verificar integridade de referências.

A UI consome os mesmos contratos e serviços. Dashboards observam projeções; não alteram entidades por cálculo implícito.

## 8. Migração aditiva

### 8.1 Regras de segurança

- nunca executar migração sem backup verificável;
- nunca apagar `og_leads_crm` ou `og_cotacoes_history` automaticamente;
- oferecer modo `dry-run` com contagens, avisos e erros;
- permitir repetição segura por `legacyLeadId`, `sourceQuoteLegacyId` e hash;
- registrar `migrationId`, versão de origem, versão de destino, início, fim e totais;
- falha em um registro não invalida os demais; o registro problemático fica em quarentena para revisão;
- somente marcar a migração como concluída após validação de referências e totais.

### 8.2 Etapas

**M0 — inventário**

- ler as duas chaves locais e o estado compartilhado sem modificar;
- contar leads, interações e cotações;
- identificar IDs ausentes, datas inválidas, referências ambíguas e possíveis duplicatas;
- produzir relatório local sem dados sensíveis no Git.

**M1 — backup**

- criar exportação JSON com checksum e timestamp;
- confirmar que o backup pode ser relido;
- manter também a cópia do servidor local quando existir.

**M2 — envelope paralelo**

- criar `OgOperationsStateV1` vazio;
- converter cada lead em `Client`;
- criar `Contact` principal quando houver nome ou telefone;
- converter `lead.interactions` em `Interaction` e, quando identificável, `CallSession`;
- converter histórico em `Quote`, preservando snapshot legado em campo de compatibilidade até a validação;
- emitir eventos `*.migrated` internos, separados dos eventos de atividade comercial para não inflar dashboards.

**M3 — validação**

- comparar contagens e valores agregados;
- garantir que cada interação e cotação aponte para cliente válido ou esteja em quarentena;
- garantir unicidade de IDs e idempotency keys;
- confirmar que valores monetários convertidos mantêm os totais;
- validar novamente a leitura das chaves legadas.

**M4 — dupla escrita temporária**

- novas alterações escrevem no modelo v1 e atualizam a projeção legada necessária às telas existentes;
- leitura prefere v1 quando íntegro e recua ao legado quando ausente;
- divergências são registradas para diagnóstico.

**M5 — leitura v1**

- migrar módulos um por vez: CRM, Call AI, Cotação e demais áreas;
- manter exportador para formato legado durante o período definido pela story de implementação;
- retirar dupla escrita somente após testes de regressão, backup e aceite explícito.

### 8.3 Mapeamento legado

| Legado | Destino v1 | Observação |
|---|---|---|
| `lead.id` | `Client.id` ou `legacyLeadId` | Preservar sempre que válido |
| `nome` | `Contact.name` | `Client.displayName` usa empresa; fallback documentado |
| `empresa` | `Client.legalName/displayName` | Não inventar razão social |
| `telefone` | `Contact.phone` | Manter valor original e versão normalizada na implementação |
| `segmentId` | `Client.segmentId` | Valor desconhecido fica `needs_review` |
| `status` | `Client.stage` | Mapear por tabela explícita e versionada |
| `pain` | `Client.painConfirmed` | Somente dado existente, sem enriquecimento automático |
| `decisionMaker` | contato ou texto legado | Criar contato apenas quando houver identidade suficiente |
| `nextAction/followUpAt` | `Client` | Datas inválidas entram em quarentena |
| `interactions[]` | `Interaction` | Preservar ID, texto, horário e tipo |
| interação `call_ai` | `CallSession` + `Interaction` | Usar `sessionId` como idempotência |
| `history[]` | `Quote` | Associar por identidade confirmada; ambígua fica sem vínculo e em revisão |
| `payload` da cotação | snapshot legado | Não perpetuar cópia completa em novas cotações |

## 9. Integridade, observabilidade e retenção

### 9.1 Invariantes

- IDs são únicos dentro da coleção.
- Referências apontam para entidade existente ou tombstone conhecido.
- `updatedAt >= createdAt`.
- Valores monetários são inteiros não negativos, salvo ajuste explicitamente tipado.
- `sentAt`, `paidAt` e equivalentes exigem evento confirmado.
- material interno não pode gerar compartilhamento externo.
- comissão sempre aponta para venda e mantém a regra aplicada.
- cobertura verificada sempre possui fonte e data.

### 9.2 Logs e métricas técnicas

Registrar localmente, sem conteúdo comercial sensível:

- versão do schema;
- duração e resultado da migração;
- quantidade de itens na outbox;
- último sync e revisão;
- conflitos pendentes;
- falhas de validação por código;
- tamanho estimado das coleções e arquivos.

### 9.3 Retenção

Prazos de retenção, descarte de áudio, consentimento e política multiusuário ainda precisam de definição do negócio. Até isso ocorrer:

- não excluir automaticamente entidades comerciais;
- não sincronizar gravações por padrão;
- permitir descarte manual de rascunhos e gravações locais;
- manter tombstones quando uma exclusão for introduzida;
- evitar dados pessoais desnecessários em eventos e logs.

## 10. Limites desta fundação

### 10.1 Recorte transitório entregue na Fase 1

O contrato normalizado descrito neste documento continua sendo o destino arquitetural. A implementação funcional desta fase introduz primeiro um envelope seguro e compatível, com `schemaVersion: 1`, coleções vazias para os novos domínios, registro de migração e sincronização sob a propriedade `operations`.

Durante esta transição:

- `state.leads` permanece como a única fonte de clientes usada pelas telas atuais;
- `state.history` permanece como a fonte do histórico de cotações existente;
- clientes e cotações legados não são copiados para coleções paralelas;
- novos fatos confirmados podem entrar em `activityEvents`, sempre com ID idempotente;
- a interface de Operações exibe somente contagens reais dessas fontes e o estado técnico da migração.

A normalização integral para `Client`, `Contact`, `Interaction` e `Quote`, o repositório IndexedDB primário, tombstones, backup/restauração, detecção de duplicidades e dupla escrita M4 serão entregues em incrementos posteriores da OG-12. Assim, a Fase 1 não apresenta o modelo-alvo como se ele já estivesse integralmente migrado.

Esta decisão não autoriza nem define:

- autenticação ou permissões reais de usuários;
- envio automático de WhatsApp, e-mail ou materiais;
- rastreamento de abertura sem mecanismo comprovado;
- armazenamento em nuvem de áudio;
- transcrição automática;
- regras finais de comissão;
- conteúdo dos dez modelos de mensagem ou PDF;
- códigos e aplicações técnicas ainda não validados;
- cobertura de transportadoras sem fonte oficial;
- substituição imediata do arquivo compartilhado por banco remoto;
- publicação HTTPS.

Esses pontos exigem stories e critérios próprios. O modelo apenas reserva entidades e estados para recebê-los sem nova ruptura estrutural.

## 11. Sequência recomendada para implementação

1. Criar schemas e validadores compartilhados, além de comandos CLI de validação e migração em `dry-run`.
2. Criar o repositório IndexedDB e testes transacionais.
3. Implementar backup, migração M0–M3 e relatório de integridade.
4. Introduzir o envelope v1 e dupla escrita controlada.
5. Migrar CRM e Call AI para IDs normalizados.
6. Migrar cotações, eliminando novos snapshots completos.
7. Adicionar eventos confirmados e projeções de Performance.
8. Implementar Biblioteca, Venda, Documento, Comissão e Transportadoras por stories independentes.

Cada etapa deve ter rollback por restauração do backup e nunca depender da interface para validar dados.

## 12. Critérios de aceite arquiteturais da Fase 1

- Existe um contrato versionado para o estado e para cada entidade.
- Cliente é a identidade única e todas as entidades comerciais usam `clientId`.
- Eventos diferenciam preparo, envio, venda, faturamento e pagamento.
- A persistência mantém operação offline e sincronização posterior.
- O plano preserva as chaves e os arquivos atuais.
- A migração é aditiva, repetível, auditável e possui `dry-run` e backup.
- Dados binários e privados não entram no estado principal nem no Git.
- Conflitos não são resolvidos silenciosamente no novo contrato.
- Campos sem fonte permanecem não verificados.
- Os limites que dependem de material oficial ou regras do negócio estão explícitos.
