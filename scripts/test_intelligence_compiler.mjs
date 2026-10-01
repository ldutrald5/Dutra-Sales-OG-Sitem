import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = p => fs.readFileSync(p,'utf8');
const exists = p => fs.existsSync(p);

const requiredSkills = [
  '.codex/skills/dutra-core/SKILL.md',
  '.codex/skills/dutra-dev/SKILL.md',
  '.codex/skills/dutra-sales/SKILL.md',
  '.codex/skills/dutra-crm/SKILL.md',
  '.codex/skills/dutra-og-tech/SKILL.md',
  '.codex/skills/dutra-fleet/SKILL.md',
  '.codex/skills/dutra-product/SKILL.md',
  '.codex/skills/dutra-qa-guardian/SKILL.md'
];

for (const path of requiredSkills) {
  assert.ok(exists(path), 'missing skill: '+path);
  const src=read(path);
  assert.ok(src.length < 12000, path+' must stay compact and reference deeper context');
  assert.doesNotMatch(src, /Lorentrans|Vendruscolo|Biener|Saulo Falchetto|Óleo Plan/i, path+' must not freeze dynamic customer data');
  assert.doesNotMatch(src, /(API_KEY|TOKEN|PASSWORD|SECRET)\s*[=:]\s*["']?[A-Za-z0-9_\-]{12,}/i, path+' may not embed secret values');
}

const intelligence=read('docs/intelligence/README.md').toLowerCase();
for(const rule of [
  'não reconstruir o dutra os do zero',
  'crm é base central; listas são coleções operacionais',
  'aplicação técnica incerta retorna validar',
  'trabalho offline não pode desaparecer',
  'métricas usam populações consistentes'
]) assert.ok(intelligence.includes(rule), 'missing permanent rule: '+rule);

const router=read('docs/intelligence/CONTEXT_ROUTER.md');
for(const skill of ['dutra-core','dutra-dev','dutra-sales','dutra-crm','dutra-og-tech','dutra-fleet','dutra-product','dutra-qa-guardian']) assert.match(router,new RegExp(skill));
for(const task of ['prospecção','aplicação técnica','Railway/deploy/runtime','bug/regressão','pós-venda']) assert.ok(router.toLowerCase().includes(task.toLowerCase()), 'router missing '+task);

const bugbook=read('docs/incidents/BUGBOOK.md');
for(const id of ['BUG-V3-001','BUG-TECH-001','BUG-TECH-002','BUG-METRIC-001','BUG-SYNC-001','BUG-QUOTE-001','BUG-TECH-003']) assert.match(bugbook,new RegExp(id));
assert.match(bugbook,/48400%/);
assert.match(bugbook,/mesma população/i);

const sales=read('docs/playbooks/SALES_PLAYBOOKS.md');
for(const mode of ['GATEKEEPER','DECISION MAKER','MEETING','FOLLOW-UP','PROPOSAL','CUSTOMER']) assert.match(sales,new RegExp(mode,'i'));
assert.match(sales,/pitch técnico completo/i);

const tech=read('docs/playbooks/TECHNICAL_APPLICATION.md')+'\n'+read('knowledge/TECHNICAL-RULES.md');
assert.match(tech,/STATUS = VALIDAR/);
assert.match(tech,/technical-application-core-v3\.js/);
assert.match(tech,/override|edição manual|manual/i);

const prompts=read('docs/prompts/PROMPT_LIBRARY.md');
for(const id of ['PROMPT-SALES-EXEC-001','PROMPT-REINTEGRATION-001','PROMPT-RECOVERY-001','PROMPT-INT-COMPILER-001']) assert.match(prompts,new RegExp(id));
assert.match(prompts,/SUPERSEDED BY SYSTEMIZED WORKFLOW/);

const adrs=read('docs/architecture/DUTRA_INTELLIGENCE_DECISIONS.md');
for(const id of ['ADR-INT-001','ADR-UX-001','ADR-DATA-001','ADR-TECH-001','ADR-AI-001','ADR-METRIC-001']) assert.match(adrs,new RegExp(id));

const agents=read('AGENTS.md');
assert.match(agents,/DUTRA Intelligence pre-flight/);
assert.match(agents,/docs\/intelligence\/CONTEXT_ROUTER\.md/);
assert.match(agents,/npm run og:intelligence:test/);

const brainFiles=['sources.jsonl','knowledge.jsonl','patterns.jsonl','decisions.jsonl','anti-patterns.jsonl','open-questions.jsonl','cycles.jsonl'];
const brain=brainFiles.flatMap(f=>read('docs/second-brain/'+f).split(/\r?\n/).filter(Boolean).map(JSON.parse));
const ids=new Set(brain.map(x=>x.id));
for(const id of ['SRC-INT-COMPILER-20261001','DEC-V3-SHELL-001','DEC-TECH-SINGLE-001','DEC-INT-COMPILER-001','ANTI-TECH-INFER-001','OQ-TECH-UNIFICATION-001','CYCLE-INT-COMPILER-001']) assert.ok(ids.has(id),'brain missing '+id);

console.log('DUTRA Intelligence knowledge regression: PASS');
