# GEO-03R — Company Registry Provider and Address Normalization

## Status

Implemented as a provider-neutral Git/domain package. No real registry provider is called and no production data is changed.

## Purpose

Prepare the future CNPJ enrichment pipeline so provider choice can change without leaking vendor-specific payloads through the CRM.

The contract separates three concerns:

1. CNPJ validation and identity.
2. Company registry provider transport.
3. Deterministic address normalization.

## CompanyRegistryProvider

Shared contract:

`apps/sistema-og/services/company-registry-provider.js`

Provider interface:

```js
{
  id: 'provider-id',
  serverOnly: true,
  async lookup(cnpj, options) {}
}
```

All real providers must remain server-side when they require credentials.

The wrapper rejects use of a server-only provider when the runtime is declared as browser.

## Provider-neutral registry DTO

A successful lookup is normalized to:

- provider
- providerReference
- observedAt
- cnpj
- cnpjRoot
- legalName
- tradeName
- establishmentRole
- registryStatus
- primaryCnae
- openedAt
- address
- raw

The normalized record can be projected into:

- a `CompanyEstablishment` draft;
- a `REGISTERED_ADDRESS` `CompanyLocation` draft.

No geocode is invented during registry normalization.

## Registry job contract

GEO-03R defines an explicit enrichment-job payload:

```json
{
  "kind": "company_registry_v1",
  "company_id": "…",
  "cnpj": "12ABC34501DE35",
  "reason": "company_registry_refresh",
  "requested_at": "…"
}
```

This is designed to coexist with the current `enrichment_jobs` table without coupling registry enrichment to proposal rendering.

A future worker must claim/process only the intended job kind.

## Address normalization

Shared contract:

`apps/sistema-og/services/address-normalizer.js`

The normalizer is deterministic and non-generative.

It:

- preserves `addressRaw`;
- normalizes whitespace;
- normalizes CEP only when exactly 8 digits exist;
- normalizes UF only when a valid two-letter Brazilian code is supplied;
- normalizes explicit no-number variants to `S/N`;
- builds a stable formatted address;
- creates a deterministic address key;
- reports whether enough deterministic components exist for a geocoder call.

It does not:

- infer a missing street number;
- infer a missing CEP;
- convert a state name such as Paraná into PR;
- invent bairro;
- infer coordinates;
- silently rewrite legal/operational location semantics.

## Geocoding readiness rule

Current deterministic readiness:

- city;
- valid state;
- and either street or postal code.

This is only a transport-readiness signal. It is not geocode confidence.

## Provider implementation policy

Future concrete providers must map into the provider-neutral contract.

Recommended sequence remains:

1. CNPJ.ws commercial adapter for MVP candidate.
2. BrasilAPI fallback/degraded adapter.
3. SERPRO adapter as future premium/official option.
4. Receita Federal open-data ingestion for large-scale market universe.

No vendor adapter belongs in browser code.

## Testing

Fixtures intentionally include the official-style alphanumeric CNPJ example:

`12.ABC.345/01DE-35`

Tests cover:

- provider interface validation;
- server-only browser guard;
- invalid CNPJ rejection;
- provider-neutral DTO normalization;
- CompanyEstablishment projection;
- REGISTERED_ADDRESS projection;
- explicit enrichment-job payload;
- deterministic address normalization;
- no-number handling;
- invalid CEP/UF behavior;
- geocoding-readiness boundary.

## Non-goals

GEO-03R does not:

- call CNPJ.ws, BrasilAPI or SERPRO;
- save registry results in Supabase;
- claim production enrichment jobs;
- geocode addresses;
- mutate proposals;
- enrich customer data;
- deploy an Edge Function.
