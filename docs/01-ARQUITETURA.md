# Arquitetura

> Proteção, sincronização, backups e restauração: consulte `docs/12-PROTECAO-E-SINCRONIZACAO.md`.

## Diagnóstico atual

O Sistema OG é uma aplicação web PWA sem framework de interface. HTML, CSS e JavaScript executam no navegador; um servidor Node entrega os arquivos e sincroniza o estado. A mesma aplicação pode ser publicada em Cloudflare Workers/Assets com KV opcional.

```text
PWA no navegador
├── index.html / styles.css / app.js / data.js
├── localStorage: leads, cotações e envelope operacional
├── IndexedDB: arquivos da biblioteca e outbox
└── service worker: cache offline e repetição de sincronização
          │ PUT/GET /api/state
          ▼
server.mjs + JSON privado       ou       Cloudflare Worker + KV
```

### Stack e bibliotecas

- Node.js 24 e npm 11.
- JavaScript nativo no frontend e no backend.
- PWA com service worker e manifesto.
- Tailwind CSS empacotado localmente, além de CSS próprio.
- AIOX Core para organização do ambiente de agentes.
- Husky para hooks do repositório.
- Wrangler para desenvolvimento e publicação Cloudflare.
- O CRM operacional principal continua local-first, mas já existe uma camada Supabase/Postgres real e normalizada para proposta/ROI, integrações WhatsApp, Sales Execution e Call Intelligence. Isso não representa cutover total do `state.leads`.
- Não há framework React/Vue/Angular.

### Módulos reutilizáveis

- `operations-model.js`: envelope versionado, migração aditiva, validação e eventos.
- `material-store.js`: binários locais em IndexedDB.
- `sales-materials.js`: recomendações e pacotes determinísticos.
- `performance-engine.js`: projeções do funil a partir de fatos registrados.
- `server.mjs`: API de estado e pesquisa da base de conhecimento.
- `cloudflare/worker.mjs`: equivalente remoto para site e sincronização.

### Integrações existentes

- WhatsApp por link explícito e bridge local opcional Kaption/MCP em modo de leitura; o bridge não envia mensagens nem promove estágio automaticamente.
- Áudio por APIs do navegador, com consentimento do usuário e permanência local até a ação explícita de upload; Call Intelligence usa Storage privado e transcrição server-side/fallback local.
- Sales Brain local por `/api/knowledge/status` e `/api/knowledge/search`.
- Cloudflare Worker/Assets/KV para acesso HTTPS.
- Importadores locais para CRM e conhecimento; dados importados não devem entrar no Git.
- Supabase/Postgres, Storage privado e Edge Functions já sustentam verticais normalizadas; browser administrativo continua atrás de gateways server-side.

## Decisões preservadas

1. Local-first e offline continuam requisitos.
2. `lead.id` é a identidade operacional atual; não criar cadastro paralelo.
3. Migrações são aditivas e mantêm as chaves legadas.
4. Arquivos binários ficam fora do estado JSON principal.
5. Eventos só registram ações confirmadas.
6. A interface pode evoluir incrementalmente sem troca de stack.

## Problemas arquiteturais relevantes

- `app.js` concentra interface, estado e regras e tende a crescer; a extração deve ocorrer por módulo quando uma tarefa exigir, sem reescrita total.
- Empresa, contato, oportunidade e atividade ainda estão agregados no lead.
- O sync transmite coleções completas e o merge legado por registro mais recente pode perder edições concorrentes.
- O servidor local usa arquivo JSON; não oferece isolamento multiusuário ou consultas relacionais.
- Existem duas experiências de celular (`/` responsivo e `/mobile` legado), com risco de divergência.
- Autenticação Cloudflare por código não equivale a perfis e permissões por usuário.
- Os quality gates genéricos do AIOX citam comandos que este `package.json` não possui; devem ser usados os testes reais disponíveis.
- O drift Supabase detectado em 2026-10-01 foi reconciliado por SUPABASE-00S: os 25 SQLs registrados e as 13 Edge Functions ativas foram recuperados para Git; oito tabelas CRM que existiam fora do histórico de migrations ganharam bootstrap de recuperação explícito. O workflow rollback-only `Supabase Canonical Replay` reconstrói esse backend em ambiente descartável. Toda expansão estrutural futura deve manter esse gate verde e fazer pre-flight live-vs-Git.

## Regras para evolução

- Prefira módulos pequenos com APIs explícitas e testes de contrato.
- Evolua o modelo por versão e dupla leitura/escrita somente quando houver plano de rollback.
- Use o endpoint compartilhado como sincronização, não como fonte única durante operação offline.
- Introduza banco gerenciado apenas quando autenticação, concorrência e backup justificarem a mudança.
- Registre decisões significativas em ADR ou neste documento.

## Incremento TASK-001

A Mesa de Vendas passou a usar serviços UMD pequenos e testáveis para compatibilidade do CRM, interações, WhatsApp e contexto do Call AI. Eles operam sobre `state.leads` e não criam uma segunda persistência. Os hooks versionados em `.githooks/` usam Node diretamente e o comando `npm run validate`, evitando a dependência anterior de Bash no Windows. A experiência legada em `/mobile` está congelada; a aplicação principal responsiva recebe as novas funcionalidades.

## Incrementos TASK-002 e TASK-008

O Motor de Prospecção adiciona parser, fila, recomendação e métricas determinísticas sobre `state.leads`. Importar cria `NEW_PROSPECT`, mas não registra contato. Abrir WhatsApp gera `whatsapp_opened` e conta apenas como tentativa da sessão; o prospect só sai da fila ao registrar resultado ou salvar uma sessão aprovada do Call AI. `message_sent` continua reservado à confirmação explícita.

A camada de automação contém parser, importação, duplicidade, fila, datas, templates, Command Center e métricas. A camada de inteligência contém Call AI, estratégia, objeções complexas e análise. O Call AI recebe somente o contexto compacto da conta ativa e retorna à Mesa ou à Prospecção sem carregar o CRM inteiro.

Detalhamento existente: [fundação operacional](architecture/og-operations-foundation.md), [mapa de produto](architecture/sistema-og-product-map.md) e [copiloto](architecture/sistema-og-copiloto.md).

## Incremento WA-MCP-01 — ingestão WhatsApp/Kaption

A leitura automática do WhatsApp passa a existir como **bridge local opcional**, separado do PWA e do servidor hospedado. O processo `scripts/whatsapp-kaption-bridge.mjs` inicia o `@kaptionai/mcp-extension` por stdio, consulta primeiro as sessões conectadas e usa a ferramenta `query` com cursor `after` para ingestão incremental.

Fluxo:

```text
Kaption/WhatsApp local
        │ MCP stdio (read-only)
        ▼
whatsapp-kaption-bridge.mjs
        │ HTTPS + apikey server-side
        ▼
Supabase whatsapp-ingest
        ├── integration_events / crm_messages / crm_insights
        ▼
commercial-processor
        ├── fatos explícitos confirmados → dados derivados/auditáveis
        ├── sugestões/IA → revisão
        ├── follow-up sem envio externo
        └── proposal-engine → rascunho quando requisitos confirmados existem
```

Regras preservadas:

- o bridge não envia mensagens nem altera chats;
- grupos ficam desativados por padrão;
- cursor e estado local ficam em `apps/sistema-og/.data/`;
- o segredo de ingestão existe apenas no ambiente do worker;
- retries são idempotentes no backend;
- mensagens não promovem estágio comercial automaticamente;
- proposta gerada é artefato interno/rascunho e não equivale a proposta enviada;
- a camada Supabase de integração/auditoria não substitui silenciosamente `state.leads` como cadastro mestre do PWA; reconciliação exige migração explícita.

## Incremento WA-E2E-01 — Self-Test do fluxo WhatsApp

O fluxo Kaption/WhatsApp possui um harness E2E hospedado acionado por CLI:

```bash
npm run og:whatsapp:e2e
```

O teste cria somente entidades com prefixo `[E2E]` e provider `e2e`, usa o `whatsapp-ingest` real, passa pelo `commercial-processor`, grava CRM auxiliar, gera follow-up e chama o `proposal-engine` real.

Para evitar pesquisa externa durante validação, o insight leva `metadata.e2e=true`. O `commercial-processor` propaga um header interno `x-og-e2e: 1` para o `proposal-engine`; esse modo só é aceito quando o nome da empresa começa com `[E2E]`. O proposal engine mantém cálculo, proposta e banco reais, mas cancela o `enrichment_job` sintético e não inicia company discovery.

O harness valida caminho feliz, idempotência, proveniência e bloqueio de hipótese não confirmada. Cleanup padrão remove somente IDs criados pelo próprio run. `OG_WHATSAPP_E2E_KEEP=true` existe apenas para diagnóstico explícito.

A chave usada pelo harness é server-side. Preferir chave Supabase moderna `sb_secret_...`; nunca expor essa chave no PWA/browser.


## ADRs relacionados — Inteligência operacional

- `docs/architecture/ADR-INTELLIGENCE-COMPILER-001.md` — estende o Builder Brain existente como camada durável de evidência/decisão, usa Skills finas + Context Router e mantém dados voláteis no CRM/runtime.

## V3 reference retained during Stage 1

The following preserves V3 branch guidance as reference for later stages; current integration safety and mature runtime remain authoritative. Historical runtime observations are not live certification.

# Arquitetura

> Proteção, sincronização, backups e restauração: consulte `docs/12-PROTECAO-E-SINCRONIZACAO.md`.

## Diagnóstico atual

O Sistema OG é uma aplicação web PWA sem framework de interface. HTML, CSS e JavaScript executam no navegador; um servidor Node entrega os arquivos e sincroniza o estado. A mesma aplicação pode ser publicada em Cloudflare Workers/Assets com KV opcional.

```text
PWA no navegador
├── index.html / styles.css / app.js / data.js
├── localStorage: leads, cotações e envelope operacional
├── IndexedDB: arquivos da biblioteca e outbox
└── service worker: cache offline e repetição de sincronização
          │ PUT/GET /api/state
          ▼
server.mjs + JSON privado       ou       Cloudflare Worker + KV
```

### Stack e bibliotecas

- Node.js 24 e npm 11.
- JavaScript nativo no frontend e no backend.
- PWA com service worker e manifesto.
- Tailwind CSS empacotado localmente, além de CSS próprio.
- AIOX Core para organização do ambiente de agentes.
- Husky para hooks do repositório.
- Wrangler para desenvolvimento e publicação Cloudflare.
- Não há banco SQL nem framework React/Vue/Angular.

### Módulos reutilizáveis

- `operations-model.js`: envelope versionado, migração aditiva, validação e eventos.
- `material-store.js`: binários locais em IndexedDB.
- `sales-materials.js`: recomendações e pacotes determinísticos.
- `performance-engine.js`: projeções do funil a partir de fatos registrados.
- `server.mjs`: API de estado e pesquisa da base de conhecimento.
- `cloudflare/worker.mjs`: equivalente remoto para site e sincronização.

### Integrações existentes

- WhatsApp por link explícito; nenhuma leitura automática.
- Áudio por APIs do navegador, com consentimento do usuário e arquivo local.
- Sales Brain local por `/api/knowledge/status` e `/api/knowledge/search`.
- Cloudflare Worker/Assets/KV para acesso HTTPS.
- Importadores locais para CRM e conhecimento; dados importados não devem entrar no Git.

## Decisões preservadas

1. Local-first e offline continuam requisitos.
2. `lead.id` é a identidade operacional atual; não criar cadastro paralelo.
3. Migrações são aditivas e mantêm as chaves legadas.
4. Arquivos binários ficam fora do estado JSON principal.
5. Eventos só registram ações confirmadas.
6. A interface pode evoluir incrementalmente sem troca de stack.

## Problemas arquiteturais relevantes

- `app.js` concentra interface, estado e regras e tende a crescer; a extração deve ocorrer por módulo quando uma tarefa exigir, sem reescrita total.
- Empresa, contato, oportunidade e atividade ainda estão agregados no lead.
- O sync transmite coleções completas e o merge legado por registro mais recente pode perder edições concorrentes.
- O servidor local usa arquivo JSON; não oferece isolamento multiusuário ou consultas relacionais.
- Existem duas experiências de celular (`/` responsivo e `/mobile` legado), com risco de divergência.
- Autenticação Cloudflare por código não equivale a perfis e permissões por usuário.
- Os quality gates genéricos do AIOX citam comandos que este `package.json` não possui; devem ser usados os testes reais disponíveis.

## Regras para evolução

- Prefira módulos pequenos com APIs explícitas e testes de contrato.
- Evolua o modelo por versão e dupla leitura/escrita somente quando houver plano de rollback.
- Use o endpoint compartilhado como sincronização, não como fonte única durante operação offline.
- Introduza banco gerenciado apenas quando autenticação, concorrência e backup justificarem a mudança.
- Registre decisões significativas em ADR ou neste documento.

## Incremento TASK-001

A Mesa de Vendas passou a usar serviços UMD pequenos e testáveis para compatibilidade do CRM, interações, WhatsApp e contexto do Call AI. Eles operam sobre `state.leads` e não criam uma segunda persistência. Os hooks versionados em `.githooks/` usam Node diretamente e o comando `npm run validate`, evitando a dependência anterior de Bash no Windows. A experiência legada em `/mobile` está congelada; a aplicação principal responsiva recebe as novas funcionalidades.

## Incrementos TASK-002 e TASK-008

O Motor de Prospecção adiciona parser, fila, recomendação e métricas determinísticas sobre `state.leads`. Importar cria `NEW_PROSPECT`, mas não registra contato. Abrir WhatsApp gera `whatsapp_opened` e conta apenas como tentativa da sessão; o prospect só sai da fila ao registrar resultado ou salvar uma sessão aprovada do Call AI. `message_sent` continua reservado à confirmação explícita.

A camada de automação contém parser, importação, duplicidade, fila, datas, templates, Command Center e métricas. A camada de inteligência contém Call AI, estratégia, objeções complexas e análise. O Call AI recebe somente o contexto compacto da conta ativa e retorna à Mesa ou à Prospecção sem carregar o CRM inteiro.

Detalhamento existente: [fundação operacional](architecture/og-operations-foundation.md), [mapa de produto](architecture/sistema-og-product-map.md) e [copiloto](architecture/sistema-og-copiloto.md).

## Incremento V3-P0-01 — Connection State e sincronização confiável

A V3 Premium adiciona uma camada transversal de confiança sobre o Sync Bridge existente, sem trocar a fonte operacional `state.leads` e sem ativar Supabase/Auth.

```text
UI V3 Premium
  ↓
OG_CONNECTION_STATE
  ↓
DUTRA_CORE commit/save
  ↓
snapshot local + mutation granular
  ↓
IndexedDB sistema-og-sync v3
  ├─ outbox      → snapshot completo para recovery/replay
  ├─ mutations   → ação, entidade, idempotencyKey, tentativas e erro
  └─ recovery    → conflitos/revisão já existentes
  ↓
PUT /core-api/state
  ↓
persistência hospedada atual
```

### Semântica de conexão e save

O estado global é limitado a `CONNECTING | CONNECTED | OFFLINE | SYNCING | ERROR`. O feedback de escrita diferencia `SALVANDO…`, `SALVO ✓`, save local com sincronização pendente e `TENTAR NOVAMENTE`. HTTP 5xx é `ERROR`, não é rotulado como offline.

### Idempotência e concorrência

A mutation granular não é uma segunda persistência comercial: a ação já foi materializada no snapshot local e o replay reenvia esse snapshot. Mutations fornecem identidade e auditoria local para que retry não execute novamente a ação de negócio. A confirmação usa o ID do snapshot e somente os mutation IDs capturados naquele lote; uma resposta atrasada não pode limpar alterações criadas depois.

### Compatibilidade

O antigo `dutra_v3_pending_save_v1` em localStorage permanece somente como fallback de emergência e fonte de migração automática. O caminho preferencial é o IndexedDB do Sync Bridge. O schema compartilhado com o Service Worker foi elevado para v3.

### Empacotamento V3 no Railway

O serviço Railway V3 usa `rootDirectory=/preview-v2`. Por isso, os serviços P0 canônicos em `apps/sistema-og/services/` possuem espelhos de deploy em `preview-v2/p0-services/`. `test_v3_p0_service_mirror.mjs` exige equivalência byte-a-byte para evitar deriva. Essa duplicação é apenas de artefato de deploy; não cria nova regra de negócio nem nova fonte de dados.

### Validação

O CI run 334 passou suíte completa, Brain, Security, npm audit e Release Gate. No Railway, o deploy do commit `4374886cadbda4a113b21fd701cb21a0df9daa09` ficou SUCCESS; `/health` e os dois serviços P0 respondem HTTP 200. A aceitação manual de desligamento/reconexão de rede em navegador autenticado permanece separada.
