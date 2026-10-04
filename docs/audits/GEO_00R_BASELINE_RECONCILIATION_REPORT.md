# GEO-00R — Baseline & Reconciliation Report

**Status:** PASS WITH BLOCKERS  
**Data da auditoria:** 2026-10-03  
**Repositório:** `ldutrald5/Dutra-Sales-OG-Sitem`  
**Base auditada:** `main@5255dc5d432850dfeebe0a523402a1902b1d3a52`  
**Shell V3 auditado:** `dutra-os-ui-v3-premium@7ce99b313724ac2ad2bb9996c12eea9b897a7e3f`  
**Supabase auditado:** `og-proposal-engine` / `hlyffyguxqxmgxlevfeq`

## 1. Executive result

A arquitetura geoespacial proposta é compatível com a direção do DUTRA OS, mas **GEO-01R não deve criar migrations nem instalar PostGIS ainda**.

Dois blockers estruturais precisam ser resolvidos antes de qualquer DDL geográfico:

1. **INC-SUPABASE-DRIFT-001 permanece real e confirmado ao vivo.** O Supabase remoto possui 25 migrations aplicadas e 13 Edge Functions ativas, enquanto o Git não consegue reconstruir esse estado.
2. **O Supabase remoto atual não possui o piloto Organization/Auth do repositório.** As tabelas `organizations`, `profiles` e `organization_members` não existem no projeto remoto auditado, e as tabelas CRM possuem RLS habilitado sem policies de usuário.

A recomendação é usar `main` como baseline canônico de integração e preservar a V3 como shell/experiência, reconciliando-a posteriormente por uma integration branch controlada. Não iniciar geografia diretamente na branch V3 divergida.

## 2. Git baseline e divergência

### main

- HEAD: `5255dc5d432850dfeebe0a523402a1902b1d3a52`
- protegida: sim
- último commit auditado registra explicitamente o drift Supabase remoto ↔ Git.

### dutra-os-ui-v3-premium

- HEAD: `7ce99b313724ac2ad2bb9996c12eea9b897a7e3f`
- protegida: não
- runtime Railway próprio ativo.

### comparação

- status: `diverged`
- V3 ahead de main: **263 commits**
- V3 behind de main: **31 commits**
- merge base: `1b55a4fa5c7cc4f114ee0551425c554e1f58f871`
- 119 arquivos divergentes reportados pela comparação atual.
- 73 arquivos divergentes afetam diretamente aplicação, V3, arquitetura, testes, Supabase ou inteligência.

A V3 contém o shell `preview-v2/`, bridges, lazy feature loading e UX operacional que não existem em `main` no mesmo formato. A `main`, por outro lado, contém decisões, correções e auditorias posteriores que não estão integralmente na V3.

### decisão recomendada

**Base canônica para trabalho estrutural: `main`.**

Não construir migrations geográficas em `dutra-os-ui-v3-premium`.

Estratégia recomendada para integração futura:

1. manter `main` como fonte de arquitetura/backend;
2. criar integration branch baseada em `main`;
3. reconciliar V3 nessa branch com revisão explícita de conflitos;
4. só depois apontar o shell V3 para contratos geográficos versionados.

Não executar merge neste pacote.

## 3. Runtime Railway confirmado

### Core

Project: `Dutra Sales OG`  
Service: `sistema-og`  
Branch: `main`  
Estado do deployment mais recente observado: `SUCCESS`  
Volume persistente: `sistema-og-data` montado em `/data`.

### V3

Project: `DUTRA OS UXR-01 Preview`  
Service: `dutra-os-v3-premium`  
Branch: `dutra-os-ui-v3-premium`  
Deployment mais recente observado: `SUCCESS`.

A V3 continua sendo um shell separado que usa proxy/bridge para o core. Isso confirma que integrar mapa somente na V3 sem reconciliar backend criaria mais uma camada transitória.

## 4. Canonical CRM model observado

O Supabase remoto já contém um CRM normalizado operacional:

- `public.companies`
- `public.crm_contacts`
- `public.sales_opportunities`
- `public.crm_activities`
- `public.lead_lists`
- `public.lead_list_members`
- `public.prospecting_sessions`
- `public.call_attempts`
- `public.meetings`

`company_id` já é a raiz relacional no backend normalizado.

O core local ainda mantém a camada de compatibilidade `state.leads` e contratos canônicos locais Company/Contact/Opportunity/Activity/Task. Portanto:

- `companies` remoto não deve ser duplicado;
- `state.leads` não deve ser apagado/reinterpretado neste ciclo;
- mapa deve ser uma projeção do domínio, nunca uma nova base comercial.

## 5. public.companies live

Campos relevantes confirmados:

- `id uuid`
- `name text`
- `legal_name text`
- `cnpj text`
- `domain text`
- `website text`
- `sector text`
- `subsector text`
- `city text`
- `state text`
- `enrichment_status text`
- `enrichment_confidence numeric`
- `enrichment_data jsonb`
- `normalized_name text`
- `relationship_status text`
- `legacy_lead_id text`
- timestamps

Índices relevantes:

- PK por `id`;
- unique em `cnpj`;
- unique parcial em `legacy_lead_id`;
- unique parcial em lower(domain);
- índices de relationship/sector/name.

O fato de CNPJ já ser `text` é compatível com CNPJ alfanumérico, mas o software atual **não é**.

## 6. CNPJ alfanumérico — impacto confirmado

Há vários pontos no código atual que ainda tratam CNPJ como 14 dígitos.

Principais ocorrências:

- `apps/sistema-og/domain/canonical-domain.js`
  - normaliza `cnpj` com `.replace(/\\D/g, '')`;
- `apps/sistema-og/services/prospect-parser.js`
  - procura grupos numéricos;
  - aceita CNPJ somente quando comprimento é 14;
- `apps/sistema-og/services/spreadsheet-import-service.js`
  - converte documento para apenas dígitos;
  - classifica PJ por comprimento 14;
- `apps/sistema-og/services/spreadsheet-export-service.js`
  - determina PJ por documento numérico de 14 dígitos;
- `apps/sistema-og/services/legacy-reconciliation-service.js`
  - CNPJ é sinal forte apenas com 14 dígitos numéricos;
- `scripts/apply-hosted-seed.mjs`
  - chaves documentais usam função `digits()`;
- testes canônicos atuais fixam a expectativa numérica.

Conclusão: **suporte a CNPJ alfanumérico é prerequisite de domínio**, não detalhe do geocoder.

GEO-01R deverá introduzir um normalizador/validator canônico que preserve letras válidas e remover a premissa de “14 dígitos” dos caminhos que representam CNPJ.

CPF deve continuar sendo tratado separadamente; não substituir toda função `digits()` do sistema indiscriminadamente.

## 7. Supabase live — migration drift

Migrations remotas aplicadas observadas: **25**.

Inventário remoto:

1. `20260929195252 initialize_og_proposal_engine`
2. `20260929195322 add_proposal_foreign_key_indexes`
3. `20260929200716 add_calculation_engine_v1`
4. `20260929201135 add_og_confirmed_parameters_and_calculator_v2`
5. `20260929201821 add_pipeline_jobs_and_artifact_storage`
6. `20260929201919 add_pipeline_orchestration`
7. `20260929202305 add_make_worker_rpc_queue`
8. `20260929202411 add_pipeline_observability`
9. `20260929204812 add_discovery_taxonomy_and_brand_assets`
10. `20260929204853 add_company_discovery_v2`
11. `20260929204957 add_licensed_visual_assets_and_design_tokens`
12. `20260929205059 add_brand_asset_copy_queue`
13. `20260929205334 add_single_entry_proposal_rpc`
14. `20260929205435 add_system_health_check`
15. `20260929205532 add_reference_client_approval_workflow`
16. `20260929205556 update_system_health_reference_approval`
17. `20260929210229 promote_premium_vector_template_1_1`
18. `20260929210734 enable_cron_net_and_internal_token`
19. `20260929210824 schedule_pipeline_recovery_cron_v2`
20. `20260929222041 add_sales_execution_p0`
21. `20260929222950 add_sales_execution_fk_indexes`
22. `20260929232101 add_sales_execution_external_ids`
23. `20260930023756 record_sales_execution_result_v1`
24. `20260930030530 harden_sales_execution_result_v1`
25. `20260930103929 call_intelligence_v1`

### Git main

Versionado em `supabase/migrations/`:

- `20260926233000_auth_organization_pilot.sql`
- `20260930024500_record_sales_execution_result_v1.sql`
- `20260930031500_harden_sales_execution_result_v1.sql`
- `20260930104500_call_intelligence_v1.sql`

### Git V3

Versionado:

- `20260926233000_auth_organization_pilot.sql`
- `20260929222000_add_sales_execution_p0.sql`
- `20260929223000_add_sales_execution_fk_indexes.sql`
- `20260929232000_add_sales_execution_external_ids.sql`

As versões/timestamps do Git não correspondem à cadeia remota. Não é seguro apenas adicionar uma migration GEO em cima dessa história incompleta.

### blocker

`INC-SUPABASE-DRIFT-001` continua **OPEN/HIGH** e bloqueia DDL geoespacial confiável.

## 8. Edge Function drift

Funções remotas ativas observadas: **13**:

- proposal-engine
- proposal-html
- proposal-pdf-fallback
- proposal-access
- brand-asset-copy
- whatsapp-ingest
- company-discovery
- proposal-pdf-premium
- pipeline-recovery
- commercial-processor
- whatsapp-e2e-runner
- sales-execution-gateway
- call-intelligence

Na `main`, apenas estas fontes estão versionadas em `supabase/functions/`:

- `sales-execution-gateway`
- `call-intelligence`

Na V3 auditada não existe a pasta `supabase/functions/`.

Conclusão: antes de criar uma função `company-registry`, `location-geocode` ou equivalente, o source remoto existente precisa ser recuperado/versionado de forma revisada.

## 9. Existing enrichment architecture

O remoto já possui:

- `enrichment_jobs`;
- RPC `claim_enrichment_job_v1`;
- RPC `fail_enrichment_job_v1`;
- RPC `apply_company_discovery_v2`;
- Edge Function `company-discovery`;
- `company_discovery_sources`.

### enrichment_jobs live

Campos:

- id
- company_id
- proposal_id nullable
- status
- provider
- attempts
- input/output jsonb
- error_message
- next_attempt_at
- started_at/completed_at
- created_at/updated_at
- locked_by/locked_until

Status aceitos:

- pending
- processing
- completed
- needs_review
- failed
- cancelled

A fila já possui lease, `FOR UPDATE SKIP LOCKED`, attempts, retry e lock temporal.

### side effect crítico

`apply_company_discovery_v2` não é um serviço genérico de enrichment.

Quando `proposal_id` existe, a função:

- atualiza proposal references;
- atualiza proposal snapshot;
- libera/atualiza render job;
- move proposta entre estados de enrichment/rendering.

A Edge Function `company-discovery` também pode chamar o pipeline de PDF após enrichment.

### decisão

**REUTILIZAR padrões/infraestrutura, NÃO acoplar geocoding a `apply_company_discovery_v2`.**

O desenho futuro deve separar pelo menos a intenção do job.

Candidato para GEO-01R/GEO-03R:

- ampliar `enrichment_jobs` com tipo/namespace de job, se a reconciliação do schema demonstrar que isso é a menor mudança segura;
- criar handler/RPC específico para registry/location;
- manter proposal-specific side effects apenas no discovery de proposta.

Não criar segunda fila sem necessidade.

## 10. Auth / RLS reality

No Supabase remoto auditado:

- `public.organizations` = inexistente;
- `public.profiles` = inexistente;
- `public.organization_members` = inexistente.

Portanto a migration `20260926233000_auth_organization_pilot.sql` do Git **não foi aplicada neste remoto**.

Para `companies`, `crm_contacts`, `sales_opportunities`, `crm_activities` e `enrichment_jobs`:

- RLS está habilitado;
- nenhuma policy foi encontrada.

Isso significa que o backend atual não está pronto para um cliente browser autenticado consultar diretamente essas tabelas.

Há grants de `anon/authenticated` em algumas tabelas, mas com RLS ligado e sem policies eles não fornecem acesso útil a linhas. `companies` e `enrichment_jobs` aparecem efetivamente orientadas a service-role/backend.

### consequência para o mapa

MVP não deve expor service-role no navegador.

Antes de map read queries existem duas opções válidas a decidir depois da reconciliação:

1. finalizar Auth/Organization/RLS e permitir RPCs geográficos controlados ao usuário autenticado; ou
2. manter um backend gateway autorizado entre V3 e Supabase.

Não criar policies geográficas isoladas sem resolver a fronteira de identidade.

## 11. PostGIS readiness

Live:

- `postgis`: disponível, não instalado;
- `pgmq`: disponível, não instalado;
- `pg_trgm`: disponível, não instalado.

A documentação atual do Supabase suporta PostGIS em schema dedicado/extension schema, `geography(Point)`, GiST, nearest-neighbor e bounding-box queries.

### decisão

PostGIS continua recomendado desde o primeiro pacote de persistência geográfica, **mas só depois do fechamento do drift**.

Futuro contrato espacial recomendado:

- `geography(Point,4326)` canônico;
- GiST;
- RPCs para radius/nearest/viewport;
- lat/lng derivados para frontend;
- não manter três verdades independentes.

Nenhuma extensão foi instalada em GEO-00R.

## 12. Future geo model compatibility

A evolução abaixo é compatível com o backend atual:

```text
Company
  ├── CompanyEstablishments[]
  └── CompanyLocations[]
```

### CompanyEstablishment

Identidade jurídica/estabelecimento/CNPJ.

Não equivale a localização operacional.

### CompanyLocation

Lugar físico, podendo ou não referenciar um Establishment.

Tipos futuros:

- REGISTERED_ADDRESS
- OPERATIONAL_BASE
- GARAGE
- DISTRIBUTION_CENTER
- OFFICE
- VISIT_POINT
- OTHER

Matriz/filial deve ser atributo do estabelecimento, não `location.purpose`.

Não adicionar latitude/longitude como única geografia de `companies`.

## 13. V3 integration points

A V3 atual possui:

- navegação por `data-go` e evento `dutra:navigate`;
- lazy loader em `preview-v2/feature-loader-v3.js`;
- Cliente 360 operacional em `preview-v2/operational-crm-v3.js`;
- bridge/core API em `preview-v2/core-bridge.js`;
- proxy/server em `preview-v2/server.mjs`.

A futura integração de mapa deverá preservar:

- shell-first;
- lazy loading;
- mobile-first;
- bridge existente;
- uma única experiência V3.

Arquivos candidatos futuros, após reconciliação:

- `preview-v2/index.html`
- `preview-v2/feature-loader-v3.js`
- novo módulo isolado de mapa, por exemplo `preview-v2/commercial-map-v3.js`
- `preview-v2/server.mjs` apenas se houver gateway/proxy adicional;
- bridge/API canônica no core/backend;
- testes V3 de performance e integração.

O mapa deve ser lazy-loaded somente quando a screen/map mode for aberta.

## 14. Main risks

1. adicionar DDL sobre migration history irreproduzível;
2. criar segunda Company;
3. criar segunda enrichment queue;
4. reutilizar `company-discovery` e acionar proposal/render side effects;
5. construir na V3 divergida antes de reconciliar backend;
6. CNPJ alfanumérico ser destruído por `digits()`;
7. service-role chegar ao browser;
8. criar map queries sem identidade/RLS coerente;
9. tratar endereço CNPJ como garagem;
10. sobrescrever localização manual com automação.

## 15. Required reconciliation before GEO-01R

Criar um pacote intermediário:

**SUPABASE-00S — Backend Reproducibility Recovery**

Objetivo:

1. exportar/reconstruir o schema remoto atual em Git;
2. recuperar e versionar as 13 Edge Functions atuais sem segredos;
3. preservar proveniência do que veio do remoto;
4. não reaplicar migrations históricas no remoto;
5. estabelecer um gate live-vs-Git;
6. provar que a cadeia versionada representa o backend real;
7. só então permitir novas migrations GEO.

Essa recuperação deve ser aditiva no Git e **não pode executar `db reset --linked` em produção**.

## 16. Recommended package sequence

1. GEO-00R — baseline/reconciliation — este relatório.
2. SUPABASE-00S — recuperar reprodutibilidade live ↔ Git.
3. GEO-01R — CNPJ/domain contract + Establishment/Location spec/test contract.
4. GEO-02R — PostGIS + migrations + índices + geo RPCs em ambiente seguro.
5. GEO-03R — Company Registry Provider.
6. GEO-04R — Geocoder benchmark/provider.
7. GEO-05R — enrichment pipeline/location confidence.
8. GEO-06R — location management UX.
9. GEO-07R — map read model.
10. GEO-08R — V3 MapLibre UX.
11. GEO-09R — batch enrichment.
12. GEO-10R — security/performance.
13. GEO-11R — controlled rollout.

## 17. Rollback strategy

GEO-00R não alterou banco, dados comerciais, Railway ou runtime.

Rollback do relatório:

- fechar/ignorar a branch/PR;
- ou revert do commit documental.

Para futuros pacotes:

- DDL somente por migration versionada;
- rollback explícito;
- nada de reset remoto;
- qualquer alteração de localização manualmente verificada deve ser preservada.

## 18. Test evidence

Evidência desta auditoria:

- GitHub live branch metadata;
- compare `main...dutra-os-ui-v3-premium`;
- Railway live environment inventories;
- Supabase live project, migrations, tables, extensions, policies, grants, indexes e function definitions;
- inspeção de código V3;
- inspeção do código CNPJ no Git;
- incidente `INC-SUPABASE-DRIFT-001` confirmado novamente ao vivo.

A suíte `npm run validate` não foi executada neste relatório porque nenhum checkout atual foi modificado/validado localmente por este pacote. Não declarar gate de produto PASS a partir desta auditoria documental/live.

## 19. Open questions

1. Qual método controlado será usado para reconstruir a cadeia SQL das 21+ migrations remotas ausentes sem falsificar história?
2. As 13 Edge Functions remotas devem ser recuperadas todas em SUPABASE-00S ou por grupos de domínio com checksum?
3. O projeto `og-proposal-engine` será formalmente promovido a backend canônico do CRM inteiro ou continuará como backend normalizado em transição?
4. Auth/Organization será aplicado neste mesmo projeto antes do mapa ou o mapa usará gateway backend no primeiro MVP?
5. A integração final da V3 será feita por integration branch baseada em main ou por PRs de port incremental após fechar o backend drift?

## 20. GO / NO-GO

### GO

- continuar a arquitetura;
- corrigir suporte CNPJ alfanumérico em pacote próprio;
- definir CompanyEstablishment/CompanyLocation;
- preparar PostGIS;
- reaproveitar backend CRM existente.

### NO-GO agora

- aplicar migration GEO no remoto;
- instalar PostGIS no remoto;
- criar Edge Function geográfica;
- colocar service role na V3;
- enriquecer os ~1.000 leads;
- fazer merge V3 ↔ main sem pacote dedicado;
- usar `company-discovery` como geocoder genérico.

## Final recommendation

**PASS WITH BLOCKERS.**

Base recomendada: `main`.

Supabase target candidato: `og-proposal-engine`, condicionado ao fechamento de `INC-SUPABASE-DRIFT-001` e à decisão de Auth/RLS.

Next safe package: **SUPABASE-00S — Backend Reproducibility Recovery**.
