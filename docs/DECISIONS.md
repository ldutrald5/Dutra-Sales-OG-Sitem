# DECISIONS — active human entrypoint

> Compact summary only. Canonical decision records, provenance and supersession history live in `docs/second-brain/decisions.jsonl`. Start from `docs/second-brain/BRAIN_INDEX.md` when a decision materially affects implementation.

## Active high-impact decisions

### 1. Evolve, do not rewrite
Preserve the differentiated commercial frontend/intelligence and replace weak foundations incrementally. No full rewrite without new evidence.

### 2. Canonical relational truth with individual identity
Supabase Postgres + Supabase Auth is the approved V1 direction for canonical commercial truth and individual identity. Activation remains subject to environment validation.

### 3. Keep vanilla JS for V1
No current evidence justifies a React/Next rewrite. Modularize incrementally when touched.

### 4. One entity, one identity, multiple views
CRM, prospecting, agenda, reports and AI should converge on canonical identities rather than create parallel copies.

### 5. Human-reviewed synchronization conflicts
Revision conflicts must not be silently overwritten. Preserve local/remote context and require explicit review where automatic resolution is unsafe.

### 6. Controlled legacy reconciliation
Legacy lead data may enter canonical Company/Contact only through dry-run classification, explicit selection, checkpoint, revalidation and reversible apply.

### 7. Hosted HTTPS is a protected preview
Railway hosting improves access, not data architecture. Hosted JSON/filesystem must not be treated as final canonical persistence.

### 8. Builder Brain governance
Use proportional MICRO / STANDARD / STRUCTURAL paths, evidence before architecture, small reversible packages, tests/gates, and durable brain closeout for meaningful work.

## Decision handling rule

Before introducing a conflicting architectural direction:

1. locate the canonical decision record;
2. inspect its evidence and `what would change the conclusion` context;
3. gather new evidence;
4. supersede explicitly if warranted;
5. never silently rewrite decision history.

## Where to look

- Generated human index: `docs/second-brain/BRAIN_INDEX.md`
- Canonical records: `docs/second-brain/decisions.jsonl`
- Architecture detail: `docs/01-ARQUITETURA.md`
- Runtime-specific contract: `docs/runtime/DUTRA_OS_RUNTIME.md`
