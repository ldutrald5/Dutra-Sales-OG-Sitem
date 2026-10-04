# GEO-01R — CNPJ + Location Domain Report

## Status

**PASS — DOMAIN FOUNDATION IMPLEMENTED**

## Objective

Create the identity/location contract required by the future Commercial Map without touching production persistence.

## Delivered

1. Shared 2026-compatible CNPJ module.
2. Official alphanumeric check-digit calculation.
3. Numeric CNPJ backward compatibility.
4. Company CNPJ normalization without destructive digit-only stripping.
5. New local-domain entities:
   - `company_establishment`
   - `company_location`
6. Establishment role separated from physical location purpose.
7. Address/geocoder provenance separated.
8. Geocode precision/confidence/verification contract.
9. Referential validation across Company → Establishment → Location.
10. Alphanumeric CNPJ support propagated through CRM/prospecting/spreadsheet/legacy/seed paths.
11. Offline/PWA shell updated to preload the CNPJ contract.
12. Targeted regression tests added.

## Important compatibility decision

Historical `Company.cnpj` is normalized but not strictly rejected because existing imported data can contain imperfect documents.

New `CompanyEstablishment.cnpj` requires a valid CNPJ check digit.

This prevents a geography feature from accidentally converting legacy-data cleanup into a blocking CRM migration.

## Test evidence

GitHub Actions Package 00R CI on commit `380e5eaeea4ab1d421b87069fa9b3f472d9dcd02`:

- npm ci: PASS
- lockfile integrity: PASS
- npm run validate: PASS
- Builder Brain check: PASS
- security baseline: PASS
- new CNPJ contract tests: PASS inside validate
- prospecting regression: PASS
- spreadsheet import/export regressions: PASS
- legacy reconciliation regression: PASS
- hosted seed regression: PASS
- PWA/final candidate regression: PASS after intentional shell version bump

The workflow remains red only at the pre-existing `npm audit --audit-level=high` gate because the existing AIOX dependency chain currently resolves to a vulnerable `braces` version. GEO-01R did not change the dependency graph or lockfile.

No `npm audit fix --force` was used.

## Production impact

None.

No Supabase migration, Edge Function deployment, Railway deploy, real customer enrichment or PostGIS installation was performed.

## Next safe package

**GEO-02R — PostGIS persistence foundation**

Git-only first:

- exact migration design;
- PostGIS extension installation in migration;
- `company_establishments`;
- `company_locations`;
- GiST geography index;
- radius / nearest / viewport RPC contract;
- audit compatibility;
- RLS boundary compatible with current backend gateway;
- disposable Supabase replay.

Production application remains a separate explicit decision.
