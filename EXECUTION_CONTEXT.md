# Execution Context — DUTRA OS baseline 2026-09-28

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline antes deste pacote: `1fdafed8b60e7f3bcf0df894e0127a11dc4b7368`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Estratégia: migração incremental, reversível e sem segunda fonte de verdade.
- Diretriz de produto: `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`
- Fotografia consolidada: `docs/roadmap/BASELINE_2026-09-28.md`

## Capacidades incorporadas

Packages 00R–06R, Ficha Universal, OG-18, CIC-01 e CIC-02 já fazem parte da linha evolutiva atual. Isso inclui fundação canônica, piloto Auth/Organization, Company 360 beta, sync/conflict UX, reconciliação legada, HTTPS hospedado, fila inteligente, Next Best Action explicável, Mission Control e Signal Center.

## Railway verificado ao iniciar este pacote

- Project: `Dutra Sales OG`
- Project ID: `02a559fd-b4a6-457a-81dd-6501a0e23bdb`
- Environment: `production`
- Environment ID: `976ea20f-7cac-4d48-83c5-1ccffb1cd7f9`
- Service: `sistema-og`
- Service ID: `f5bf6592-1ef6-40d0-89d4-518c65fae12d`
- URL: `https://sistema-og-production.up.railway.app`
- Deployment verificado na abertura deste pacote: `dad9d643-9a62-40e7-8c96-58026c3e03ab`
- Commit publicado verificado: `1fdafed8b60e7f3bcf0df894e0127a11dc4b7368`
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

1. CIC-03 — Account 360 operacional + Command Center 2.0.
2. KCC-01 — Knowledge Command Center.
3. PROP-01 — Proposal Tracking seguro.
4. AUTO-01 — Automation Engine V1.
5. TERR-01 — Territory Intelligence.
6. SCALE-01 — validação Auth/Organization/Persistence canônica.
7. ERP-OG-01 — instalação/ativos/reposição vertical, somente após evidência de uso.

## Gate de avanço

Mudanças estruturais seguem: auditoria → decisão → branch/pacote reversível → testes → security/release gate → PR → merge → deploy → verificação. Nenhum bloco futuro deve ser implementado como big bang.
