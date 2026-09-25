# Brain record examples

One line per JSONL record. IDs and dates are illustrative.

## Source
```json
{"id":"SRC-EX-001","type":"source","title":"Example CRM repo","statement":"Repository inspected for timeline patterns.","status":"validated","confidence":"high","project_scope":"Example Project","tags":["crm","timeline"],"source_ids":[],"derived_from":[],"created_at":"2026-09-25","updated_at":"2026-09-25","source_kind":"repository","origin":"external"}
```

## Knowledge
```json
{"id":"KB-EX-001","type":"knowledge","title":"Timeline reads canonical activities","statement":"Current code renders timeline from the central Activity store.","status":"validated","confidence":"high","project_scope":"Example Project","tags":["timeline","data"],"source_ids":["SRC-EX-001"],"derived_from":["SRC-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","evidence_summary":"Confirmed in activity repository and timeline query."}
```

## Pattern
```json
{"id":"PAT-EX-001","type":"pattern","title":"One activity stream, multiple views","statement":"Timeline, dashboard and account page should consume one canonical event stream.","status":"active","confidence":"high","project_scope":"Reusable","tags":["timeline","canonical-data"],"source_ids":["SRC-EX-001"],"derived_from":["KB-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","applicability":"Systems with multiple UI views over customer history."}
```

## Decision
```json
{"id":"DEC-EX-001","type":"decision","title":"Keep one Activity entity","statement":"Do not create a second timeline-specific history table.","status":"active","confidence":"high","project_scope":"Example Project","tags":["architecture"],"source_ids":["SRC-EX-001"],"derived_from":["PAT-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","rationale":"Avoid duplicate truth and reconciliation work.","adr":"docs/adr/ADR-012.md"}
```

## Idea
```json
{"id":"IDEA-EX-001","type":"idea","title":"Timeline quick filters","statement":"Add Calls / WhatsApp / Proposals filters to the canonical timeline.","status":"candidate","confidence":"medium","project_scope":"Example Project","tags":["ux"],"source_ids":["SRC-EX-001"],"derived_from":["PAT-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","problem":"Long timelines are slow to scan.","smallest_test":"Prototype three client-side filters using existing canonical activities.","non_goals":["new timeline database","AI classification"]}
```

## Experiment
```json
{"id":"EXP-EX-001","type":"experiment","title":"Quick-filter usability test","statement":"Test whether filters reduce time to find last proposal.","status":"completed","confidence":"medium","project_scope":"Example Project","tags":["ux","experiment"],"source_ids":["SRC-EX-001"],"derived_from":["IDEA-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","hypothesis":"Users find the last proposal faster with channel filters.","result":"Median lookup time improved in the test sample."}
```

## Open question
```json
{"id":"OQ-EX-001","type":"open_question","title":"Need server-side timeline search?","statement":"Current evidence does not show whether client-side filtering remains adequate at target scale.","status":"open","confidence":"medium","project_scope":"Example Project","tags":["scale"],"source_ids":["SRC-EX-001"],"derived_from":["IDEA-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","decision_impact":"Determines whether a search index/server query belongs in a later package."}
```

## Anti-pattern
```json
{"id":"ANTI-EX-001","type":"anti_pattern","title":"Second timeline store","statement":"Do not create a UI-specific history database to make timeline rendering easier.","status":"active","confidence":"high","project_scope":"Reusable","tags":["data"],"source_ids":["SRC-EX-001"],"derived_from":["PAT-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","risk":"Creates duplicate truth, sync bugs and ambiguous ownership."}
```

## Cycle
```json
{"id":"CYCLE-EX-001","type":"cycle","title":"Timeline filters standard cycle","statement":"Bounded UX improvement validated against canonical Activity model.","status":"completed","confidence":"high","project_scope":"Example Project","tags":["cycle","ux"],"source_ids":["SRC-EX-001"],"derived_from":["IDEA-EX-001"],"created_at":"2026-09-25","updated_at":"2026-09-25","scope_class":"STANDARD","brain_available":true,"brain_consulted":true,"brain_updated":true,"outcome":"implemented","started_at":"2026-09-25T10:00:00-03:00","completed_at":"2026-09-25T12:00:00-03:00","discarded_ideas":1,"gate_blocked":false}
```
