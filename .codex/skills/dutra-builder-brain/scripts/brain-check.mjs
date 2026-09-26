#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || path.resolve(process.cwd(), 'docs/second-brain');
const specs = {
  'sources.jsonl': { type: 'source', extra: ['source_kind','origin'] },
  'knowledge.jsonl': { type: 'knowledge', extra: ['evidence_summary'] },
  'patterns.jsonl': { type: 'pattern', extra: ['applicability'] },
  'decisions.jsonl': { type: 'decision', extra: ['rationale'] },
  'ideas.jsonl': { type: 'idea', extra: ['problem','smallest_test','non_goals'] },
  'experiments.jsonl': { type: 'experiment', extra: ['hypothesis'] },
  'open-questions.jsonl': { type: 'open_question', extra: ['decision_impact'] },
  'anti-patterns.jsonl': { type: 'anti_pattern', extra: ['risk'] },
  'cycles.jsonl': { type: 'cycle', extra: ['scope_class','brain_available','brain_consulted','brain_updated','outcome','started_at','completed_at'] },
};
const allowedConfidence = new Set(['low','medium','high']);
const allowedStatus = new Set(['candidate','validated','active','planned','implemented','rejected','superseded','deprecated','open','resolved','completed','deferred']);
const allowedScopeClass = new Set(['MICRO','STANDARD','STRUCTURAL']);
const common = ['id','type','title','statement','status','confidence','project_scope','tags','source_ids','derived_from','created_at','updated_at'];
const ids = new Map();
const rows = [];
let errors = 0;
let warnings = 0;
function err(msg){ console.error(`ERROR ${msg}`); errors++; }
function warn(msg){ console.warn(`WARN ${msg}`); warnings++; }
function nonEmptyString(v){ return typeof v === 'string' && v.trim().length > 0; }
function validDate(v){ return nonEmptyString(v) && !Number.isNaN(Date.parse(v)); }

for (const [file,spec] of Object.entries(specs)) {
  const full = path.join(root,file);
  if (!fs.existsSync(full)) { err(`MISSING ${file}`); continue; }
  const lines = fs.readFileSync(full,'utf8').split(/\r?\n/).filter(Boolean);
  lines.forEach((line,idx)=>{
    let obj;
    try { obj = JSON.parse(line); } catch(e) { err(`${file}:${idx+1} invalid JSON: ${e.message}`); return; }
    for (const field of common) if (!(field in obj)) err(`${file}:${idx+1} missing ${field}`);
    for (const field of spec.extra) if (!(field in obj)) err(`${file}:${idx+1} missing ${field}`);
    if (obj.type !== spec.type) err(`${file}:${idx+1} type ${obj.type} != ${spec.type}`);
    if (!nonEmptyString(obj.id) || !nonEmptyString(obj.title) || !nonEmptyString(obj.statement) || !nonEmptyString(obj.project_scope)) err(`${file}:${idx+1} empty required text field`);
    if (!allowedConfidence.has(obj.confidence)) err(`${file}:${idx+1} invalid confidence ${obj.confidence}`);
    if (!allowedStatus.has(obj.status)) err(`${file}:${idx+1} invalid status ${obj.status}`);
    if (!Array.isArray(obj.tags) || !Array.isArray(obj.source_ids) || !Array.isArray(obj.derived_from)) err(`${file}:${idx+1} tags/source_ids/derived_from must be arrays`);
    if (!validDate(obj.created_at) || !validDate(obj.updated_at)) err(`${file}:${idx+1} invalid created_at/updated_at`);
    if (obj.type === 'idea' && !Array.isArray(obj.non_goals)) err(`${file}:${idx+1} idea.non_goals must be array`);
    if (obj.type === 'experiment' && ['implemented','completed','validated'].includes(obj.status) && !nonEmptyString(obj.result)) err(`${file}:${idx+1} completed experiment requires result`);
    if (obj.type === 'cycle') {
      if (!allowedScopeClass.has(obj.scope_class)) err(`${file}:${idx+1} invalid scope_class ${obj.scope_class}`);
      for (const b of ['brain_available','brain_consulted','brain_updated']) if (typeof obj[b] !== 'boolean') err(`${file}:${idx+1} ${b} must be boolean`);
      if (!validDate(obj.started_at) || !validDate(obj.completed_at)) err(`${file}:${idx+1} invalid cycle timestamps`);
    }
    if (ids.has(obj.id)) err(`${file}:${idx+1} duplicate id also in ${ids.get(obj.id)}`);
    else ids.set(obj.id,`${file}:${idx+1}`);
    rows.push({file,line:idx+1,obj});
  });
}

// Referential integrity and provenance quality.
for (const {file,line,obj} of rows) {
  const refs = [...(obj.source_ids||[]), ...(obj.derived_from||[])];
  for (const id of refs) if (!ids.has(id)) err(`${file}:${line} references missing id ${id}`);
  if (obj.supersedes && !ids.has(obj.supersedes)) err(`${file}:${line} supersedes missing id ${obj.supersedes}`);
  if (obj.type !== 'source' && obj.type !== 'cycle' && refs.length === 0) err(`${file}:${line} requires source_ids or derived_from provenance`);
  if (obj.type === 'source' && (obj.source_ids?.length || obj.derived_from?.length)) {
    for (const id of obj.source_ids || []) if (!id.startsWith('SRC-')) warn(`${file}:${line} source_ids ideally reference SRC-* records (${id})`);
  }
}

// Generated human surfaces should not be stale.
const generated = ['BRAIN_INDEX.md','BRAIN_METRICS.md'];
const sourceFiles = Object.keys(specs).map(f=>path.join(root,f)).filter(fs.existsSync);
const newestSource = sourceFiles.length ? Math.max(...sourceFiles.map(f=>fs.statSync(f).mtimeMs)) : 0;
for (const file of generated) {
  const full = path.join(root,file);
  if (!fs.existsSync(full)) err(`MISSING generated ${file}; run npm run og:brain:refresh`);
  else if (fs.statSync(full).mtimeMs + 5 < newestSource) err(`STALE generated ${file}; run npm run og:brain:refresh`);
}

if (errors) {
  console.error(`DUTRA brain check FAIL — ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}
console.log(`DUTRA brain check PASS — ${ids.size} records across ${Object.keys(specs).length} collections; ${warnings} warning(s).`);
