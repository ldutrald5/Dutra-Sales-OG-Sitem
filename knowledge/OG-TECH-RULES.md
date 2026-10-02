# OG Technical Rules — Operational Safety Context

This file stores stable technical decision rules. It is not a substitute for validated Olho de Gato application tables, photos or factory documentation.

## Source hierarchy for technical claims

1. Validated OG technical document/table/photo tied to the application.
2. Current confirmed product record in the project with provenance.
3. Current code as an implementation reference only.
4. Historical conversation or informal note.
5. General knowledge / model inference.

A lower level never silently overrides a higher one.

## TECHNICAL_RULES

- Capture only inputs relevant to the selected vehicle/configuration.
- Use validated OG evidence for externally confirmed application claims.
- Treat runtime/code mappings as implementation evidence, not automatic physical-field certification.
- Never assume a missing vehicle/configuration field.
- Automatic calculation is a starting point, not an immutable order.

Inputs that can change application include, when applicable:

- vehicle type/configuration;
- brand/model/year;
- axle/position;
- 4x2, 6x2, 6x4, 8x2 or other configured layout;
- suspension;
- reduction hub;
- wheel/rim;
- front axle included or not;
- target PSI/librage.

## TECHNICAL_EXCEPTIONS

An exception exists when any of these is true:

- the real vehicle/order is not represented by the current deterministic mapping;
- required configuration data is missing or ambiguous;
- code/history conflicts with a stronger validated OG source;
- the customer needs an authorized special order or manual item adjustment;
- the runtime can calculate a plausible result but physical/commercial confirmation is still absent.

Exceptions must remain visible. Do not force-fit them into the nearest known mapping.

## TECHNICAL_VALIDATIONS

Required result states:

- **Confirmada OG** — a validated OG source explicitly supports the application.
- **Precisa validar** — a plausible/current-code mapping exists but evidence is insufficient or conflicting.
- **Não determinada** — the system cannot determine safely.

Validation should preserve provenance: source file/document/photo/table, date/revision when available, and the specific configuration being confirmed.

A code mapping may support software behavior while still remaining **Precisa validar** for an external technical claim.

## TECHNICAL_FALLBACKS

When the engine cannot determine an application with sufficient evidence:

```text
STATUS = VALIDAR
```

Operational fallback:

AUTO → REVIEW → EDIT → REPLACE → ADD → REMOVE → NOTE → VALIDATE.

Rules:

- never invent a support code;
- never infer a physical application only from fuzzy/natural-language similarity;
- never block a legitimate special order because automation cannot model it;
- preserve manual review/override;
- unresolved application remains validation-required instead of being silently coerced into a known rule.

## Runtime mappings

`apps/sistema-og/data.js` and related current code contain operational mappings and catalog data. They are implementation evidence, not independent physical-field confirmation. When a mapping becomes externally used as a technical claim, preserve the OG source that validates it.

## Commercial claim guardrail

Fuel savings, tire-life gains, pressure limits, warranty, material specifications and other performance claims remain unconfirmed unless their approved OG source is attached/registered. Scenario calculations must be labeled as assumptions.
