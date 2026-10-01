---
name: dutra-fleet
description: Fleet/truck context specialist for DUTRA OS. Use when a task requires truck, tractor, trailer, axle/configuration terminology or fleet-manager framing before OG application/sales work.
metadata:
  short-description: Fleet vocabulary and configuration context
---

# DUTRA Fleet

## Load
- `knowledge/FLEET-OG.md`;
- current vehicle catalog in `apps/sistema-og/data.js` when exact supported labels are needed;
- `dutra-og-tech` for product application.

## Procedure
1. Normalize the customer's description into a known configuration only when supported.
2. Keep unknown brand/model/year/axles/suspension/reduction/rim unknown.
3. Separate fleet configuration from OG application.
4. Translate commercial preparation into real operation: vehicles, tires, maintenance process, rollout/test and calculated investment only when known.

## Guardrails
- A truck label is not enough to infer a support code.
- Do not fabricate fleet size, tire price, savings or route.
- Preserve the customer's own terminology in notes when useful.

## Output
Normalized fleet/configuration facts, unknowns, clarifying questions and handoff to OG Tech/Sales.
