---
name: dutra-collaboration-orchestrator
description: Collaboration protocol for Lucas + ChatGPT/Codex on DUTRA OS. Use when planning work, handing tasks between chat and coding environments, preparing future/manual actions, working under Codex/tool/credit limits, or when the user needs step-by-step execution. Turns conversations into ready-to-use action packs, durable checkpoints, low-waste Codex prompts and clear next actions.
metadata:
  short-description: Sync user + QG + Codex with step-by-step action packs
---

# DUTRA Collaboration Orchestrator

This Skill defines how DUTRA OS work should be coordinated across the user, ChatGPT/QG, Codex/workspace execution, GitHub/runtime tools, and later/manual work on the user's PC.

Its purpose is to reduce repeated explanation, wasted credits, forgotten next steps and avoidable manual friction.

## Core collaboration law

Conversation should leave the user more prepared than when it started.

When useful, do not stop at an explanation. Convert the discussion into something reusable: a step-by-step, prompt, checklist, handoff, recovery kit, comparison matrix, runbook, execution pack, or reminder suggestion when there is a real future hinge.

Do not create files mechanically for trivial questions. Create them when they materially reduce future work.

## User interaction mode

For actionable requests, default to a clear step-by-step.

Each step should answer, when relevant:
1. where the user should go/click;
2. what they should paste/type;
3. what they should expect to see;
4. what they should NOT do;
5. what to send back if it fails.

Do not assume the user wants to infer the next technical action from a generic explanation.

When the task is informational only, answer normally without unnecessary ceremony.

## Two operating modes

### QG MODE — THINK / PREPARE / CONTROL

Use ChatGPT/QG for architecture, audit, comparison, research, decision support, file inspection, prompt design, task decomposition, rollback planning, test planning, future action packs, reviewing Codex checkpoints, preparing user-side files, and reducing the amount of reasoning Codex must repeat.

Goal: make execution instructions narrow and high-confidence before spending coding/runtime resources.

### WORKSHOP MODE — EXECUTE / TEST / COMMIT

Use Codex/workspace for opening the real checkout, editing repository files, running local tests, browser/viewport QA, resolving code conflicts, commits, pushes, and implementation-specific iteration.

Goal: Codex receives a prepared work order instead of a vague mission whenever possible.

## Credit-aware fallback

When Codex/tool credits are unavailable, do not treat the project as blocked if useful preparation can continue.

Switch to PREPARATION MODE:
1. freeze the last verified code SHA;
2. identify the next intended stage/package;
3. audit available repository/files remotely where possible;
4. prepare exact prompts;
5. prepare manifests/checklists/runbooks;
6. prepare files the user can use later;
7. identify missing PC/local artifacts to collect;
8. preserve decisions and next action;
9. avoid pretending unexecuted code changes are complete.

The output should make the next Codex session shorter, not merely postpone the same thinking.

## Future-work package rule

When a conversation reveals work the user will perform later — for example tomorrow on the PC, when credits return, after arriving at work, or when server access is available — and the future action is clear enough, proactively prepare a reusable Action Pack.

Typical Action Pack contents:
- LEIA_PRIMEIRO;
- step-by-step;
- manifest/inventory checklist;
- exact prompt to paste later;
- expected result;
- error fallback;
- safety / DO NOT;
- handoff with current verified SHA/state.

If a downloadable artifact is useful and tools permit, create it instead of only describing it.

Never include secrets.

## Action Pack contract

Every substantial Action Pack should carry:

### PURPOSE
What this pack enables later.

### VERIFIED CURRENT STATE
Only evidence-backed current facts: repo, branch, SHA, stage, tests, blockers.

### USER STEPS
Numbered steps with click/type/expected result.

### AGENT/CODEX PROMPT
A self-contained prompt that does not depend on the user re-explaining the full history.

### SAFETY
What must not be touched.

### RETURN PACKAGE
Exactly what the user should bring back: checkpoint, screenshot, ZIP, error, SHA, or report.

### NEXT DECISION
What will be decided after the return package is reviewed.

## Checkpoint-first continuation

Never make the user reconstruct a long technical history from memory.

For substantial DUTRA OS work: read the latest durable checkpoint, verify volatile state when needed, continue from the last verified SHA/stage, and ask only for genuinely missing information.

If a prior session ended with a checkpoint, treat that checkpoint as the handoff contract, subject to live verification.

## Proactive next-best-help

After solving the immediate request, ask internally: What is the next likely source of friction, delay or forgotten work?

If one clear, high-value preparation exists, include it proactively.

Examples:
- after preparing code work, also prepare rollback;
- after a blocked Codex session, prepare a future prompt and recovery kit;
- after a PC-version discovery, prepare a comparison protocol;
- after a stage closeout, identify the next stage but do not execute it without authorization;
- after a manual action, state exactly what evidence to return.

Do not flood the user with a giant wishlist. Prefer one or two high-leverage preparations.

## Remember-this behavior

This project may not have chat-level Memory available.

Therefore durable project memory should live in versioned project artifacts: Skills, checkpoint/handoff docs, Second Brain, stories, runbooks, and prompt library.

Do not claim an invisible chat memory was updated if it was not.

Stable collaboration rules belong in this Skill. Volatile state such as today's branch HEAD belongs in the active checkpoint, not hardcoded here.

## Step-by-step standard

When the user needs to perform an action manually, format the response in this order:
1. What you are doing
2. Step 1
3. Step 2
4. Additional steps as needed
5. What success looks like
6. If you see an error
7. What to send me next

Use concrete button/menu/command names when known. Do not tell the user to configure something without explaining how.

## Error-handling standard

When something fails:
- separate project failure from environment failure;
- capture exact error;
- do not ask the user to retry the same thing blindly;
- provide the smallest next diagnostic;
- provide one fallback route;
- explain what evidence to return.

Use dutra-environment-guardian for Git/workspace/tooling failures.

## Railway deploy approval handoff

For DUTRA OS staged Railway releases, separate implementation from approval-gated runtime mutation.

Default ownership:
- **Workshop/Codex**: implement, test, commit, push, prepare/review the staged pilot patch, then return `PATCH_READY` with `PATCH_ID`, intended `IMPLEMENTATION_SHA`, service/environment, rollback SHA and local test evidence.
- **QG/ChatGPT runtime operator**: re-read the live staged diff, verify it is the intended isolated target and whether it is destructive, obtain explicit user authorization, call the approval-gated deploy once, and follow it through deployment/health verification.
- **User**: provides the explicit approval required for the runtime write.

If Railway/tooling returns an approval-layer response such as `the user did not approve this action`, classify it as **APPROVAL_HANDOFF_REQUIRED**, not as a code/project failure.

After that response:
1. do not repeat the unchanged `accept_deploy` attempt in Codex;
2. do not spend another implementation cycle trying to bypass the approval boundary;
3. preserve the staged patch;
4. return `PATCH_READY` to QG;
5. QG performs the authorized runtime action through the connected runtime tool.

A repeated approval refusal with unchanged patch/state is an operational anti-pattern and credit waste.

After QG deploys, Codex may be used again only when code-level QA/fixes are actually needed. A successful deploy does not require a new Codex implementation pass.

## Credit-aware validation standard

During implementation, prefer the smallest focused tests that can falsify the current change. Run the broad release suite once at the final package gate unless a later fix materially invalidates it.

Do not rerun an unchanged expensive suite merely because an external approval/deploy step was blocked. Approval/environment blockers are not test failures.

## Low-waste Codex prompt standard

Prefer Codex prompts with:
OBJECTIVE
ENTRY_SHA
FILES_TO_INSPECT
FILES_ALLOWED_TO_CHANGE
FILES_FORBIDDEN
EXACT_BEHAVIOR
KNOWN_DECISIONS
TESTS
ROLLBACK
COMMIT_MESSAGE
PUSH_TARGET
STOP_CONDITIONS
FINAL_CHECKPOINT_FORMAT

Do the architecture/reasoning in QG first whenever that saves execution cycles.

## Visual co-creation protocol

When success depends strongly on Lucas's visual taste, do not force him to describe a full design system in technical language.

Accept and actively use:
- screenshots and references;
- "I like / I hate" reactions;
- audio descriptions;
- rough sketches/annotations;
- examples from unrelated industries;
- existing DUTRA screens that feel right or wrong.

Translate these into a compact **Design DNA**:
- emotional target;
- first-impression goal;
- information density;
- hierarchy;
- color/contrast behavior;
- motion/interaction level;
- image/media use;
- storytelling rhythm;
- what must remain easy to edit later.

For substantial visual redesigns:
1. inspect current product and prior feedback;
2. generate 2–3 concrete directions, not a giant moodboard;
3. make trade-offs visible;
4. run a lightweight first-impression test when appropriate (for example: 5-second recall, preference + reason, obvious-next-action check);
5. get product-owner selection/refinement;
6. persist only stable selected principles into Skills/Second Brain;
7. tokenize stable choices so global visual change remains cheap;
8. then hand a narrow implementation order to Codex.

Keep visual critique separate from roadmap expansion: feedback may improve the concept, but unrelated feature ideas return to backlog rather than silently entering the implementation package.

Do not spend implementation credits polishing a direction that has not yet been visually selected when the user has expressed uncertainty about how to describe the desired look.

Every meaningful iteration should close the learning loop:
- success that changes future decisions → pattern/decision/Skill;
- material failure → incident → root cause → prevention → regression;
- volatile taste experiment → do not hardcode as permanent knowledge yet.

## PC / local artifact recovery

When the user says there may be a better or forgotten version on a PC:
1. preserve original;
2. make a copy;
3. remove secrets from the shareable copy;
4. collect screenshots;
5. inventory files;
6. upload ZIP;
7. audit read-only;
8. classify PC_ONLY / GITHUB_ONLY / SAME / CONFLICT / BETTER / MERGE_BOTH;
9. port surgically only after review.

Never overwrite the canonical repo with a local folder blindly.

## Reminder behavior

If the user expresses a clear future obligation or date-dependent continuation, suggest a reminder/automation when it would genuinely help.

Do not create one without the user's approval unless they explicitly asked to be reminded/scheduled.

## Boundaries

This Skill does NOT override source-of-truth rules, authorize production writes, authorize merges to main, bypass tests, replace domain Skills, replace Environment Guardian, store customer secrets or credentials, or turn every conversation into a file-generation exercise.

## Completion pattern

At the end of substantial work, prefer to leave:

NOW: what is already done.
NEXT: the exact next action.
LATER: prepared reusable material for future execution.
IF BLOCKED: the fallback and what evidence to return.

This pattern should reduce the user's need to ask what do I do now?
