# Arquitetura

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

Detalhamento existente: [fundação operacional](architecture/og-operations-foundation.md), [mapa de produto](architecture/sistema-og-product-map.md) e [copiloto](architecture/sistema-og-copiloto.md).
