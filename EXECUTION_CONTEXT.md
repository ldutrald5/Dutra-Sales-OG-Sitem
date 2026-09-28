# Execution Context — DUTRA OS baseline 2026-09-28

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline antes do TERR-01A: `727bc940f64895d89b6474b34a2e58e7389ce6f8`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Estratégia: migração incremental, reversível e sem segunda fonte de verdade.
- Diretriz de produto: `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`
- Fotografia consolidada: `docs/roadmap/BASELINE_2026-09-28.md`

## Capacidades incorporadas

Packages 00R–06R, Ficha Universal, OG-18, CIC-01–04, KCC-01, PROP-01A/B e AUTO-01 fazem parte da linha atual. Isso inclui fundação canônica, piloto Auth/Organization, Company/Account 360, sync/conflict UX, reconciliação legada, HTTPS hospedado, fila inteligente, Next Best Action, Mission Control, Signal Center de ciclo comercial, Knowledge Command Center, proposta pública rastreável segura e Automation Engine V1.

## Railway verificado ao iniciar este pacote

- Project: `Dutra Sales OG`
- Project ID: `02a559fd-b4a6-457a-81dd-6501a0e23bdb`
- Environment: `production`
- Environment ID: `976ea20f-7cac-4d48-83c5-1ccffb1cd7f9`
- Service: `sistema-og`
- Service ID: `f5bf6592-1ef6-40d0-89d4-518c65fae12d`
- URL: `https://sistema-og-production.up.railway.app`
- Deployment de produção verificado após TERR-01A: `09be4804-9d54-44a9-8be4-a795ff70b934`
- Commit publicado verificado: `cce75cda4aa02ec3c2387e2d13ecb6a7db005184`
- Status: `SUCCESS`
- Volume: `sistema-og-data` montado em `/data`, 500 MB, região `sfo`.

## Persistência e identidade

O volume Railway corrige a ausência de persistência do preview anterior, mas não transforma o JSON hospedado em arquitetura canônica multiusuário. Supabase Postgres/Auth permanece a direção aprovada para verdade remota individual quando o piloto for validado em ambiente real.

A fundação de Auth/Organization existe sob feature flag e permanece fail-closed. Não ativar o piloto remoto sem validar configuração, sessão, membership e RLS no projeto Supabase escolhido.

## Fonte de verdade e compatibilidade

- `main` é a fonte de código.
- `state.leads` continua sendo compatibilidade operacional enquanto a reconciliação canônica avança.
- Company/Contact/Opportunity/Activity/Task são contratos canônicos aditivos.
- Mission Control e Signal Center reutilizam o score determinístico de `OG_LEAD_INTELLIGENCE`.
- Conflitos de sync são revision-authoritative e exigem revisão, sem force merge silencioso.

## Próxima trilha autorizada por esta consolidação

1. TERR-01A — qualidade territorial e concentração por cidade/UF.
2. TERR-01B — mapa/geocoding/rota, condicionado a provedor e qualidade da base.
3. SCALE-01 — validação Auth/Organization/Persistence canônica, condicionada à conexão/configuração real do Supabase.
4. ERP-OG-01 — instalação/ativos/reposição vertical, somente após evidência de uso.
5. Proposal Room — somente após uso real do tracking público já publicado.

## Gate de avanço

Mudanças estruturais seguem: auditoria → decisão → branch/pacote reversível → testes → security/release gate → PR → merge → deploy → verificação. Nenhum bloco futuro deve ser implementado como big bang.


## Bloqueios externos atuais

- **SCALE-01:** a fundação Supabase está no código, mas a validação real de projeto/Auth/RLS/Postgres exige conexão/configuração externa; não ativar por suposição.
- **TERR-01B:** mapa, geocoding e rotas exigem provedor aprovado e qualidade suficiente de endereços; TERR-01A já entrega concentração por cidade/UF sem enviar dados a terceiros.
- **Context7:** útil para documentação de desenvolvimento, mas não é requisito de runtime e não está conectado neste ambiente.
- **WhatsApp Cloud API:** não é necessária para o fluxo atual; abrir WhatsApp continua separado de envio confirmado.
