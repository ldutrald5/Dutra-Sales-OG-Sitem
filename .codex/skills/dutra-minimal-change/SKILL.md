---
name: dutra-minimal-change
description: Apply YAGNI/minimal-change discipline to DUTRA OS engineering.
---
# DUTRA Minimal Change

Use this skill before architectural/refactor work.

1. Inspect existing implementation and relevant tests.
2. State the concrete requirement and the smallest testable change.
3. Reuse an existing service/module before creating a new abstraction.
4. Do not add a dependency unless the platform/current stack cannot solve the requirement simply.
5. Keep feature commits scoped; no unrelated refactors.
6. When moving business logic, write/keep regression tests first.
7. Prefer extracting responsibility from app.js rather than adding more to it.
8. Preserve persistence contracts and rollback paths.
9. Never invent OG technical mappings.
10. Finish with relevant tests and report known limitations.

Inspired by the minimalism/YAGNI approach of DietrichGebert/ponytail; this is a DUTRA-specific implementation and does not vendor third-party runtime code.
