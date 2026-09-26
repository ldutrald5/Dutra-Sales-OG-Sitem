# License and Code-Reuse Triage

Use this when an external repository may contribute **code**, not merely ideas/patterns.

This is an engineering triage, not legal advice. When reuse is material, commercial, ambiguous or high-risk, escalate for legal review.

## Step 1 — Identify exact license

Check the repository's root LICENSE/COPYING/NOTICE files, package-level licenses and relevant dependency licenses. Do not infer permission from “open source” wording alone.

No explicit license generally means **do not copy/reuse code** until permission is established. Studying behavior/patterns is different from copying protected expression.

## Step 2 — Classify broadly

### Permissive (e.g. MIT, BSD, Apache-2.0)
Often compatible with commercial reuse when notice/attribution obligations are honored. Apache-2.0 also includes explicit patent-related terms and NOTICE handling when applicable.

### Weak copyleft (e.g. MPL, LGPL)
May allow mixed/proprietary systems under conditions, but obligations can attach to modified files/libraries and distribution/linking details. Review exact terms before reuse.

### Strong/network copyleft (e.g. GPL, AGPL)
Can impose source-sharing obligations on derivative/distributed works; AGPL can also be triggered by network use. Do not import code into a proprietary architecture without explicit compatibility/legal review.

### Source-available / custom / proprietary
“Source visible” is not necessarily open source. Follow the exact grant/restrictions.

## Step 3 — Reuse decision

For each candidate, record:

- exact file/component considered;
- license and version;
- whether reuse is code, algorithm/idea, or interface pattern;
- attribution/NOTICE obligations;
- dependency/license transitivity concerns;
- coupling/security/maintenance implications;
- recommended action: `PATTERN ONLY / REUSE CANDIDATE / DO NOT REUSE / LEGAL REVIEW`.

## Safe default

Prefer **pattern reuse** over code reuse unless copying code materially saves effort and its license/security/maintenance costs are understood.
