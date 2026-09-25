#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2] || path.resolve(process.cwd(),'docs/second-brain');
const files = fs.readdirSync(root).filter(f=>f.endsWith('.jsonl')).sort();
const rows=[];
for (const file of files) for (const line of fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/).filter(Boolean)) rows.push({...JSON.parse(line), _file:file});
const byType = new Map();
for (const r of rows) { const a=byType.get(r.type)||[]; a.push(r); byType.set(r.type,a); }
const activeDec=(byType.get('decision')||[]).filter(r=>['active','implemented'].includes(r.status));
const open=(byType.get('open_question')||[]).filter(r=>r.status==='open');
const ideas=(byType.get('idea')||[]).filter(r=>['candidate','planned','deferred'].includes(r.status));
const sources=(byType.get('source')||[]).slice().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).slice(0,10);
const patterns=(byType.get('pattern')||[]).filter(r=>['active','validated'].includes(r.status));
const md=[];
md.push('# DUTRA Builder Brain — Human Index','',`Generated from ${rows.length} records. Do not edit by hand; run \`npm run og:brain:refresh\`.`, '');
md.push('## Collections','', '| Type | Records |', '|---|---:|');
for (const [t,a] of [...byType.entries()].sort()) md.push(`| ${t} | ${a.length} |`);
function section(title, arr, extra=''){
  md.push('',`## ${title}`,'');
  if (!arr.length) { md.push('_None._'); return; }
  for (const r of arr) md.push(`- **${r.id} — ${r.title}** (${r.status}/${r.confidence})${extra ? extra+r[extra] : ''}`,`  ${r.statement}`);
}
section('Active decisions',activeDec);
section('Open questions',open);
section('Candidate / planned ideas',ideas);
section('Validated / active patterns',patterns);
section('Recent sources',sources);
md.push('','## Retrieval workflow','', '1. Start here.', '2. Search by ID/tag in the relevant JSONL collection.', '3. Follow `source_ids`, `derived_from`, and `supersedes` for provenance.', '4. Load only the records needed for the task.');
md.push('','## Relationship model','', '```mermaid','flowchart LR','  S[Source] --> K[Knowledge / Pattern]','  K --> I[Idea / Open Question]','  K --> D[Decision]','  I --> E[Experiment]','  D --> P[Implementation Package / Cycle]','  E --> D','  P --> L[Learning]','  L --> K','```','');
fs.writeFileSync(path.join(root,'BRAIN_INDEX.md'),md.join('\n'),'utf8');
console.log(`Generated BRAIN_INDEX.md from ${rows.length} records.`);
