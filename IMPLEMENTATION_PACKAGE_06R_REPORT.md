# IMPLEMENTATION PACKAGE 06R REPORT

## Resultado atual

**PACKAGE 06R — IMPLEMENTADO E VALIDADO EM BRANCH; PUBLICAÇÃO RAILWAY AINDA PENDENTE**

## Baseline e objetivo

- Base estável: `main@30a3516a95a2385cd3a1ff6fae1b16f69b761409`.
- Branch: `package-06r-https-preview`.
- PR: `#11` — `feat(06r): prepare secure Railway HTTPS preview`.
- Objetivo: tornar o DUTRA OS acessível por HTTPS em PC/celular como preview protegido, sem transformar o armazenamento JSON transitório em banco definitivo.
- Não objetivos: ativar Supabase remoto, migrar dados reais, remover `lead.id`, expor API sem autenticação ou declarar Railway volume como arquitetura canônica final.

## Runtime hospedado

Foi criado `scripts/start-og-hosted.mjs`, responsável por:
- exigir `OG_ACCESS_TOKEN` ou `OG_LOCAL_ACCESS_TOKEN` com 16+ caracteres antes do boot;
- usar `PORT` fornecido pelo provedor;
- bindar `0.0.0.0` apenas no entrypoint hospedado;
- mapear `RAILWAY_VOLUME_MOUNT_PATH`/ `OG_DATA_DIR` para persistência;
- iniciar o mesmo servidor do Sistema OG, preservando o comportamento local-first existente.

O servidor ganhou `/health` sem autenticação, limitado ao estado de prontidão do serviço. Todo `/api/*` continua protegido pelo token.

`RAILWAY_PUBLIC_DOMAIN` é reconhecido por `/api/access` e pela página de acesso no celular, evitando links localhost quando o app estiver hospedado.

## Configuração Railway

A auditoria de documentação oficial feita após o primeiro merge do 06R identificou uma mudança relevante do Railway: `railway.json` / Config as Code foi descontinuado para serviços novos. O hotfix atual remove esse arquivo e usa o caminho compatível com serviços novos:

- `package.json -> scripts.start = "npm run og:start:hosted"`, permitindo detecção zero-config do Railpack;
- healthcheck `/health` configurado no serviço Railway durante a criação/publicação;
- segredo `OG_ACCESS_TOKEN` configurado no ambiente Railway;
- domínio público gerado no serviço;
- volume opcional/recomendado anexado pelo Railway; o runtime usa automaticamente `RAILWAY_VOLUME_MOUNT_PATH`.

Não existe mais dependência de `railway.json` para o primeiro deploy.

## Segurança e limites

A publicação é tratada como **preview HTTPS protegido**:
- segredo obrigatório e nunca commitado;
- token de browser permanece em `sessionStorage`, conforme baseline 00R/04R;
- nenhuma credencial é persistida no Sync Bridge/Service Worker;
- healthcheck não expõe dados;
- sem volume, o armazenamento do servidor hospedado não deve ser tratado como durável;
- mesmo com volume, o JSON hospedado continua ponte de transição, não substitui Supabase Postgres/Auth planejados.

## Testes

Novo gate `og:hosted:test`:
- inicia o runtime hospedado em porta dinâmica;
- valida `/health`;
- confirma 401 sem token em `/api/state`;
- confirma acesso autenticado;
- valida `RAILWAY_PUBLIC_DOMAIN`;
- valida o shell HTML;
- valida o diretório persistente configurável.

`og:security:test` também verifica:
- token forte obrigatório;
- `0.0.0.0` restrito ao entrypoint hospedado;
- script `start` padrão apontando para o runtime hospedado;
- ausência do `railway.json` legado no root.

Primeiro CI do pacote: workflow run `36287750590` — **SUCCESS** em:
- `npm ci`;
- lockfile íntegro;
- `npm run validate`;
- `og:brain:check`;
- `og:security:test`;
- `npm audit --audit-level=high`;
- `release:gate`.

Como documentação/Brain alteram o head depois desse run, o merge exige CI final do head atual.

## Builder Brain

Registrados:
- `SRC-PKG06R-001`;
- `DEC-HOST-06R-001`;
- `PAT-HOST-001`.

Decisão central: HTTPS é acesso/preview, não atalho para substituir a arquitetura canônica.

## Definition of Done

O 06R só fecha quando:
- CI final do head estiver SUCCESS;
- PR estiver 0 behind do `main`;
- reviews/threads estiverem limpos;
- PR #11 for mergeada com `expected_head_sha`;
- o projeto Railway estiver efetivamente criado/conectado ao repositório;
- `OG_ACCESS_TOKEN` estiver configurado;
- domínio HTTPS estiver gerado;
- o endpoint `/health` e a página principal responderem online;
- persistência for explicitamente classificada como preview (com volume se habilitada);
- closeout registrar URL e baseline final.

## Publicação externa

A instalação/conexão do Railway no ChatGPT foi iniciada pelo usuário. O repositório está preparado para deploy. A etapa externa de criar o projeto/serviço/domínio Railway ainda precisa ocorrer antes de chamar o 06R de publicado.


## Hotfix de compatibilidade Railway

Depois do merge inicial da PR #11, a documentação Railway vigente em setembro de 2026 confirmou que serviços novos não podem mais adotar Config as Code legado. O hotfix remove `railway.json` e troca para o contrato atual de detecção via script `start` + configuração do serviço/Agent/CLI Railway. Este hotfix precisa passar pelos mesmos gates antes do deploy externo.
