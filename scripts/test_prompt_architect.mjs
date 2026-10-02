import assert from 'node:assert/strict';
import fs from 'node:fs';
import { lintPrompt } from './prompt-lint.mjs';

const mustExist=[
  '.codex/skills/dutra-prompt-architect/SKILL.md',
  '.claude/skills/dutra-prompt-architect/SKILL.md',
  'docs/prompts/architect/PROMPT-ARCHITECTURE.md',
  'docs/prompts/architect/TOKEN-ECONOMY.md',
  'docs/prompts/architect/DUTRA-GUARDRAILS.md',
  'docs/prompts/architect/PROMPT-TYPES.md',
  'docs/prompts/architect/EXECUTION-CONTRACT.md',
];
for(const file of mustExist) assert.ok(fs.existsSync(file),`missing ${file}`);

const skill=fs.readFileSync('.codex/skills/dutra-prompt-architect/SKILL.md','utf8');
assert.ok(skill.length < 12000,'Prompt Architect skill must stay compact');
for(const phrase of ['CONTEXT_MANIFEST','Progressive disclosure','SubagentPromptBuilder','L0','L1','L2','L3']) assert.match(skill,new RegExp(phrase,'i'));
assert.doesNotMatch(skill,/(API_KEY|TOKEN|PASSWORD|SECRET)\s*[=:]\s*["']?[A-Za-z0-9_\-]{12,}/i);

const l0=`# MISSION
Trocar o label X por Y no componente existente.

# ACCEPTANCE CRITERIA
- O label aparece como Y.`;
assert.equal(lintPrompt(l0,{level:'L0'}).ok,true);
assert.ok(lintPrompt(l0,{level:'L0'}).tokens < 700);

const l1=`# MISSION
Corrigir o estado de erro da ficha.
# CURRENT STATE
O erro não aparece.
# TARGET STATE
Erro visível sem perder dados.
# SCOPE
Ficha.
# ACCEPTANCE CRITERIA
- erro visível.
# TEST PLAN
Executar teste da ficha.`;
assert.equal(lintPrompt(l1,{level:'L1'}).ok,true);

const l2=`# MISSION
Evoluir Cliente 360.
# CURRENT STATE
Fluxo parcial.
# TARGET STATE
Fluxo editável.
# CONTEXT MANIFEST
required:
- docs/04-CRM.md
conditional:
- docs/incidents/BUGBOOK.md
do_not_load:
- knowledge/TECHNICAL-RULES.md
# SOURCE OF TRUTH
- CRM canônico
# PRE-FLIGHT
- auditar implementação
# SCOPE
- ficha
# OUT OF SCOPE
- motor técnico
# ACCEPTANCE CRITERIA
- salvar e recarregar
# TEST PLAN
- teste Company 360
# DEFINITION OF DONE
- testes passam`;
assert.equal(lintPrompt(l2,{level:'L2'}).ok,true);

const l3=l2+`
# EXECUTION PLAN
1. auditar
2. implementar
# REUSE FIRST
- serviços existentes
# DO NOT
- criar segunda base
# FINAL REPORT
- evidência e riscos`;
assert.equal(lintPrompt(l3,{level:'L3'}).ok,true);

const bad=l2+'\nAPI_KEY=abcdefghijklmnop';
assert.equal(lintPrompt(bad,{level:'L2'}).ok,false);

console.log('DUTRA Prompt Architect acceptance tests: PASS');
