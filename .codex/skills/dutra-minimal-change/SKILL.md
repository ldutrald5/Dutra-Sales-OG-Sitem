---
name: dutra-minimal-change
description: Apply YAGNI/minimal-change discipline to DUTRA OS engineering.
---
# DUTRA Minimal Change

Use before architectural/refactor work.

1. Read `docs/intelligence/CONTEXT_ROUTER.md` for the task.
2. Inspect the existing implementation and relevant tests.
3. Search `docs/incidents/BUGBOOK.md` and active decisions for related history.
4. State the concrete requirement and smallest reversible change.
5. Reuse an existing service/module before creating abstraction.
6. Do not add dependency unless current stack cannot solve the requirement simply.
7. Keep feature commits scoped; no unrelated refactors.
8. When moving business logic, preserve/add regression tests first.
9. Prefer extracting responsibility from app.js rather than growing it.
10. Preserve persistence contracts, manual escape and rollback paths.
11. Never invent OG technical mappings.
12. Finish with tests and durable-learning closeout when relevant.

Before saying “not implemented”, search the repository.
