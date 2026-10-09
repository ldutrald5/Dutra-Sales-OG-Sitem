# DUTRA OS — Visual Co-Creation Playbook

Status: active
Owner: Product/QG + Lucas Dutra
Purpose: turn non-technical visual taste into repeatable, testable product direction before expensive implementation.

## Why this exists

Lucas should not need to specify CSS, spacing, tokens or component architecture to communicate visual intent.
The process must accept emotional and visual references, translate them into explicit product principles, test alternatives cheaply, and only then hand the selected direction to implementation.

## Evidence-backed practices

### 1. Test first impression, not only usability
NN/g recommends visual-design methods such as 5-second testing, first-click testing and preference testing to understand perception, brand impression and visual effectiveness.

DUTRA adaptation:
- show a concept for 5 seconds;
- ask: what did you understand, what felt premium, what do you remember, what action seems next?;
- use preference tests between 2–3 concepts;
- do not confuse aesthetic preference with business correctness.

### 2. Separate critique from roadmap decisions
Figma's critique practice treats critique as a space for focused feedback, not the forum for making every roadmap decision.

DUTRA adaptation:
- each review has a feedback question;
- visual critique evaluates the concept;
- QG/product decides scope and sequencing separately;
- avoid redesign discussions turning into uncontrolled feature expansion.

### 3. Use design tokens so change stays cheap
Figma's design-token guidance emphasizes named reusable values and semantic roles so global changes are fast and consistent.

DUTRA adaptation:
- primitive tokens: raw color/spacing/type scales;
- semantic tokens: surface, text, accent, success, warning, technical, premium;
- component tokens only when necessary;
- theme changes must not require editing many components manually.

### 4. Keep content and theme separable
Gamma's card/theme model demonstrates the value of flexible blocks and global themes where visual changes do not rewrite content.

DUTRA adaptation:
- one canonical content model;
- reusable story blocks;
- theme/layout configuration changes appearance and emphasis, not business truth;
- template changes must remain reversible.

## Weekly creative capture

Lucas can send any of the following at any time:
- screenshot;
- website/app;
- ad;
- car/interior/product/package;
- presentation;
- photo;
- rough sketch;
- voice note;
- "I like this";
- "I hate this";
- "this feels premium";
- "this feels boring".

For each reference QG captures:
- what triggered the reaction;
- what is transferable;
- what should not be copied;
- likely design principle;
- confidence: tentative / repeated / stable.

Do not promote one isolated reaction into a permanent design rule.

## Design DNA

Stable selected principles should be summarized under:

1. Emotional target
2. First-impression goal
3. Information density
4. Storytelling rhythm
5. Visual hierarchy
6. Color/contrast behavior
7. Typography feel
8. Card/shape language
9. Imagery/media behavior
10. Motion/interactivity
11. Mobile behavior
12. Desktop behavior
13. Export behavior
14. Editability requirements
15. Anti-patterns / what feels generic

## Concept sprint

For substantial visual work:

### A. Frame
Define:
- who sees it;
- what they must understand in 10 seconds;
- what they should feel;
- what action should follow;
- what information can be delayed.

### B. Create 3 directions
Default directions should be meaningfully different, not three color variations.

For proposal work:
- Impact / bold
- Executive / refined
- Operational storytelling / contextual

### C. 5-second test
For each direction:
- show first viewport only;
- ask what is remembered;
- ask perceived value/quality;
- ask what the product seems to be about;
- identify whether the main number/action is obvious.

### D. Preference + reason
Lucas chooses:
- A;
- B;
- C;
- or hybrid.

Capture *why*, not only which one.

### E. Tokenize
Convert stable choices into reusable semantic tokens and block variants.

### F. Prototype the flow
Prototype:
- first viewport;
- one mid-story section;
- one detail section;
- one CTA/next-step section;
- mobile + desktop.

### G. Implementation order
Only after direction is selected:
- implement shared tokens;
- implement reusable blocks;
- implement template config;
- implement editor controls;
- bind canonical data;
- test export and responsiveness.

## Proposal-specific north star

A proposal should be scannable before it is readable.

First viewport should normally answer:
- For whom?
- What scale?
- What is OG solving?
- What is the investment?
- What is the strongest proof/value signal?
- What is the next step?

Detailed technical evidence remains available progressively.

## Learning loop

After each meaningful cycle:
- stable preference repeated across contexts → Product Skill / Design DNA;
- selected structural direction → Decision;
- successful reusable method → Pattern;
- visual failure that caused waste/confusion → Incident;
- machine-checkable failure → regression test;
- temporary experiment → keep as experiment, do not fossilize.

## Cost-control rule

Do not spend Codex implementation cycles exploring aesthetics that can be decided in concepts/prototypes first.

QG should do the reasoning and narrow the space.
Builder should receive a selected direction and explicit contracts.

## Future beyond proposals

After Proposal Experience is validated, reuse the same method selectively for:
- Meu Dia;
- CRM account sheet;
- Technical Application;
- Call Intelligence;
- dashboards/reports;
- client-facing post-sale materials.

Do not redesign the whole product at once.
