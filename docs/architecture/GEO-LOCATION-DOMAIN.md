# GEO-01R — CNPJ, Establishments and Locations Domain Contract

## Status

Implemented as a Git/domain foundation. No production database change belongs to this package.

## Core rule

A commercial account, a legal establishment and a physical place are different concepts:

```text
Company
  ├── CompanyEstablishment[]
  └── CompanyLocation[]
```

### Company

Commercial account used by CRM, opportunities, activities and commercial ownership.

### CompanyEstablishment

Legal establishment identified by CNPJ.

It may represent headquarters or branch, but that legal role must not be confused with a physical-location purpose.

### CompanyLocation

A known physical place relevant to the commercial operation.

It may optionally reference a CompanyEstablishment. A location can also exist without a CNPJ establishment link, for example a manually confirmed garage or visit point.

## CNPJ 2026 contract

DUTRA OS must support both legacy numeric CNPJ and the new alphanumeric format.

Canonical normalization:

- uppercase;
- remove only expected formatting separators/whitespace;
- preserve letters;
- never cast to integer/bigint;
- first 12 positions may be alphanumeric;
- last two check-digit positions remain numeric.

The shared implementation is:

`apps/sistema-og/domain/cnpj.js`

It exposes:

- `normalize`
- `isBaseShape`
- `isShape`
- `calculateCheckDigits`
- `isValid`
- `format`
- `root`
- `order`

Official validation example covered by tests:

`12.ABC.345/01DE-35`

Numeric compatibility example:

`12.345.678/0001-95`

Reference used for the contract:

Receita Federal — Perguntas e Respostas CNPJ Alfanumérico:
https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf

## Compatibility policy

`Company.cnpj` normalizes but does not hard-reject an old malformed value.

Reason: the current system already contains legacy/imported CRM data and a strict write-time validator at Company level could make unrelated edits impossible.

`CompanyEstablishment.cnpj` is stricter and requires a valid check digit because this is the legal-identity entity introduced for the geographic model.

This separation lets the migration clean/review historical account data instead of silently discarding it.

## CompanyEstablishment

Current local-domain contract includes:

- id
- companyId
- cnpj
- cnpjRoot
- legalName
- tradeName
- role
- registryStatus
- primaryCnae
- openedAt
- registryProvider
- registryObservedAt
- createdAt / updatedAt / archivedAt

Allowed roles:

- HEADQUARTERS
- BRANCH
- UNKNOWN

Do not infer permanent headquarters from order `0001`.

## CompanyLocation

Current local-domain contract includes:

- id
- companyId
- establishmentId optional
- purpose
- label
- addressRaw
- street
- streetNumber
- complement
- district
- postalCode
- city
- cityIbgeCode
- state
- countryCode
- formattedAddress
- position DTO
- addressSource
- sourceProvider
- sourceReference
- sourceObservedAt
- geocodeProvider
- geocodeProviderRef
- geocodedAt
- geocodePrecision
- geocodeConfidence
- verificationStatus
- verifiedBy
- verifiedAt
- isPrimary
- isActive
- audit timestamps

Physical-location purposes:

- REGISTERED_ADDRESS
- OPERATIONAL_BASE
- GARAGE
- DISTRIBUTION_CENTER
- OFFICE
- VISIT_POINT
- OTHER

## Provenance

Address provenance and geocoder provenance are independent.

Address source values:

- CNPJ_REGISTRY
- COMPANY_WEBSITE
- CUSTOMER
- SELLER
- VISIT
- IMPORT
- AI_SUGGESTED
- OTHER

A later automated registry refresh must not silently replace a manually verified operational location.

## Geocode quality

Precision values:

- ROOFTOP
- ADDRESS
- STREET
- POSTAL_CODE
- NEIGHBORHOOD
- CITY
- REGION
- UNKNOWN
- MANUAL

Confidence is a numeric value from 0 to 1 but is not presented as scientific truth by itself.

Verification status:

- UNVERIFIED
- AUTO_ACCEPTED
- NEEDS_REVIEW
- VERIFIED_BY_SELLER
- VERIFIED_BY_CUSTOMER
- VERIFIED_BY_VISIT
- REJECTED
- STALE

## Local coordinate DTO vs database truth

The JavaScript domain currently represents coordinates as a single `position` object:

```js
{ latitude, longitude }
```

This is an application DTO only.

The future database canonical source will be PostGIS `geography(Point,4326)`, with latitude/longitude projected for frontend use instead of maintaining independent coordinate truths.

## Referential rules

The local canonical graph now validates:

- Establishment must reference an existing Company.
- Location must reference an existing Company.
- Optional Location.establishmentId must exist.
- A Location cannot point to an Establishment from another Company.
- Establishment CNPJ is unique inside the graph.
- Existing Contact/Opportunity/Activity/Task referential checks remain intact.

## Ingestion compatibility

Alphanumeric CNPJ is now preserved by:

- prospect parser;
- CRM normalization/dedup;
- spreadsheet import;
- spreadsheet export classification;
- legacy reconciliation;
- hosted-seed dedup.

Phone and CPF normalization remain numeric-only. The implementation intentionally does not replace generic `digits()` helpers globally.

## Non-goals of GEO-01R

This package does not:

- install PostGIS;
- create Supabase tables;
- alter RLS;
- call a CNPJ provider;
- call a geocoder;
- enrich real companies;
- render a map;
- deploy production code.

Those belong to later controlled packages.


## GEO-02R persistence projection

The approved pending database projection uses:

- `public.company_establishments` for legal establishments;
- `public.company_locations` for physical locations;
- `extensions.geography(Point,4326)` as canonical coordinates;
- GiST for spatial indexing;
- backend-only radius/nearest and viewport RPCs until an authenticated browser boundary is deliberately rolled out.

The pending migration is validated by the rollback-only `GEO PostGIS Replay` workflow and remains unapplied to production.


## GEO-03R registry boundary

CNPJ enrichment now has a provider-neutral contract in `services/company-registry-provider.js` and deterministic address normalization in `services/address-normalizer.js`. Vendor responses must be normalized before they reach CompanyEstablishment/CompanyLocation. Registry lookup creates a registered-address candidate only; it does not establish that the address is an operational base, garage or visit point, and it does not generate coordinates.
