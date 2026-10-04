import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const jsonl = (p) => read(p).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));

const skills = [
  '.codex/skills/dutra-core/SKILL.md',
  '.codex/skills/dutra-dev/SKILL.md',
  '.codex/skills/dutra-sales/SKILL.md',
  '.codex/skills/dutra-crm/SKILL.md',
  '.codex/skills/dutra-og-tech/SKILL.md',
  '.codex/skills/dutra-fleet/SKILL.md',
  '.codex/skills/dutra-product/SKILL.md',
  '.codex/skills/dutra-qa-guardian/SKILL.md'
];

for (const skill of skills) {
  assert.ok(exists(skill), `Missing intelligence skill: ${skill}`);
  const body = read(skill);
  assert.match(body, /^---[\s\S]*name:\s*dutra-/m, `${skill} must declare a DUTRA skill name`);
  assert.ok(body.length < 9000, `${skill} should stay a thin router, not a copied master context`);
}

const dynamicNames = /Lorentrans|Vendruscolo|Saulo Falchetto|Oleoplan|Óleo Plan|Biener|Transalves/i;
for (const skill of skills) assert.doesNotMatch(read(skill), dynamicNames, `${skill} must not freeze volatile customer data`);

const router = read('docs/second-brain/CONTEXT_ROUTER.md');
assert.match(router, /Stable knowledge vs dynamic data/i);
assert.match(router, /Mandatory pre-flight/i);
assert.match(router, /technical application[\s\S]*dutra-og-tech/i);
assert.match(router, /bug \/ regression \/ incident[\s\S]*dutra-qa-guardian/i);
assert.match(router, /Supabase \/ schema \/ Edge Functions[\s\S]*INC-SUPABASE-DRIFT-001/i);

const incidents = jsonl('docs/second-brain/incidents.jsonl');
assert.ok(incidents.length >= 9, 'Recovered material incidents should be durable records');
for (const item of incidents) {
  assert.equal(item.type, 'incident');
  for (const field of ['id','title','symptom','root_cause','resolution','prevention','regression_test']) {
    assert.ok(String(item[field] || '').trim(), `${item.id || 'incident'} missing ${field}`);
  }
}
for (const id of ['INC-V3-BLACK-001','INC-METRIC-CLOSE-001','INC-SYNC-CONFLICT-001','INC-XLSX-REPAIR-001','INC-CALLINT-AUDIO-001','INC-WHISPER-DEPS-001','INC-SUPABASE-DRIFT-001']) {
  assert.ok(incidents.some((item) => item.id === id), `Missing incident ${id}`);
}
assert.ok(incidents.some((item) => item.id === 'INC-SUPABASE-DRIFT-001' && item.status === 'resolved'));

const checker = read('.codex/skills/dutra-builder-brain/scripts/brain-check.mjs');
assert.match(checker, /'incidents\.jsonl'/);
assert.match(checker, /root_cause/);
assert.match(checker, /regression_test/);

const playbook = read('docs/playbooks/SALES_PLAYBOOKS.md');
for (const heading of ['GATEKEEPER','DECISION MAKER','MEETING','PROPOSAL / NEGOTIATION','FOLLOW-UP','CUSTOMER / POST-SALE']) {
  assert.ok(playbook.includes(heading), `Missing sales playbook: ${heading}`);
}
assert.match(playbook, /Existing customer is not approached as a cold lead/i);

const tech = read('knowledge/OG-TECH-RULES.md');
assert.match(tech, /Confirmada OG/);
assert.match(tech, /Precisa validar/);
assert.match(tech, /Não determinada/);
assert.match(tech, /Never invent a support code/i);

const promptLibrary = read('docs/prompts/PROMPT_LIBRARY.md');
for (const id of ['PRM-SALES-EXEC-001','PRM-INTEL-COMPILER-001','PRM-V3-REINTEGRATION-001']) assert.ok(promptLibrary.includes(id));

const decisions = jsonl('docs/second-brain/decisions.jsonl');
assert.ok(decisions.some((item) => item.id === 'DEC-INTEL-COMPILER-001' && item.status === 'active'));

const anti = jsonl('docs/second-brain/anti-patterns.jsonl');
for (const id of ['ANTI-INTEL-001','ANTI-INTEL-002','ANTI-INTEL-003','ANTI-SALES-001','ANTI-TECH-001','ANTI-INFRA-001']) {
  assert.ok(anti.some((item) => item.id === id), `Missing anti-pattern ${id}`);
}

const openQuestions = jsonl('docs/second-brain/open-questions.jsonl');
assert.ok(openQuestions.some((item) => item.id === 'OQ-SUPABASE-VERSIONING-001' && item.status === 'resolved'));

const agents = read('AGENTS.md');
assert.match(agents, /DUTRA Intelligence pre-flight/);
assert.match(agents, /docs\/second-brain\/CONTEXT_ROUTER\.md/);

console.log('DUTRA Intelligence Compiler contract: PASS');
