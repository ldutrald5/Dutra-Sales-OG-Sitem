# OG Technical Rules — Operational Safety Context

This file stores stable technical decision rules. It is not a substitute for validated Olho de Gato application tables, photos or factory documentation.

## Source hierarchy for technical claims

1. Validated OG technical document/table/photo tied to the application.
2. Current confirmed product record in the project with provenance.
3. Current code as an implementation reference only.
4. Historical conversation or informal note.
5. General knowledge / model inference.

A lower level never silently overrides a higher one.

## Required result states

- **Confirmada OG** — source explicitly supports the application.
- **Precisa validar** — a plausible/current-code mapping exists but evidence is insufficient or conflicting.
- **Não determinada** — the system cannot determine safely.

If the engine cannot determine an application with sufficient evidence, return **Precisa validar / Não determinada**. Never invent a support code.

## Inputs that can change application

Capture only what is relevant to the selected vehicle/configuration, including when applicable:

- vehicle type/configuration;
- brand/model/year;
- axle/position;
- 4x2, 6x2, 6x4, 8x2 or other configured layout;
- suspension;
- reduction hub;
- wheel/rim;
- front axle included or not;
- target PSI/librage.

Do not assume missing values.

## Automation escape

Automatic calculation is a starting point. The authorized user must be able to:

AUTO → REVIEW → EDIT → REPLACE → ADD → REMOVE → NOTE → VALIDATE.

A special order must not be blocked because automation cannot model it.

## Runtime mappings

`apps/sistema-og/data.js` and related current code contain operational mappings and catalog data. They are implementation evidence, not independent physical-field confirmation. When a mapping becomes externally used as a technical claim, preserve the OG source that validates it.

## Commercial claim guardrail

Fuel savings, tire-life gains, pressure limits, warranty, material specifications and other performance claims remain unconfirmed unless their approved OG source is attached/registered. Scenario calculations must be labeled as assumptions.
