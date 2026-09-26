#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2] || path.resolve(process.cwd(),'docs/second-brain');
const read=(f)=>fs.existsSync(path.join(root,f))?fs.readFileSync(path.join(root,f),'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse):[];
const cycles=read('cycles.jsonl'); const ideas=read('ideas.jsonl'); const decisions=read('decisions.jsonl'); const exps=read('experiments.jsonl'); const oq=read('open-questions.jsonl'); const sources=read('sources.jsonl');
const tracked=cycles.filter(c=>c.brain_available && ['STANDARD','STRUCTURAL'].includes(c.scope_class));
const pct=(n,d)=>d?`${Math.round(n/d*100)}%`:'n/a';
const consulted=tracked.filter(c=>c.brain_consulted).length;
const updated=tracked.filter(c=>c.brain_updated).length;
const discarded=cycles.reduce((s,c)=>s+(Number(c.discarded_ideas)||0),0) + ideas.filter(i=>['rejected','deferred'].includes(i.status)).length;
const superseded=decisions.filter(d=>['superseded','deprecated'].includes(d.status)).length;
const completedExp=exps.filter(e=>['completed','implemented','validated'].includes(e.status)).length;
const resolved=oq.filter(q=>q.status==='resolved').length;
const blocked=cycles.filter(c=>c.gate_blocked===true).length;
const durations=tracked.map(c=>(Date.parse(c.completed_at)-Date.parse(c.started_at))/3600000).filter(x=>Number.isFinite(x)&&x>=0).sort((a,b)=>a-b);
const median=durations.length ? (durations.length%2?durations[(durations.length-1)/2]:(durations[durations.length/2-1]+durations[durations.length/2])/2) : null;
const md=[
'# DUTRA Builder Brain — Adoption & Outcome Metrics','',
'> Diagnostic metrics, not targets to game. A rejected idea or blocked release can be a healthy outcome.','',
'| Metric | Current |','|---|---:|',
`| Tracked STANDARD/STRUCTURAL cycles (brain available) | ${tracked.length} |`,
`| Brain consultation rate | ${pct(consulted,tracked.length)} |`,
`| Brain update completion rate | ${pct(updated,tracked.length)} |`,
`| Ideas rejected/deferred before code (tracked signal) | ${discarded} |`,
`| Decisions superseded/deprecated | ${superseded} |`,
`| Experiments completed/implemented | ${completedExp}/${exps.length} |`,
`| Open questions resolved | ${resolved}/${oq.length} |`,
`| Correctly blocked cycles/releases recorded | ${blocked} |`,
`| Median tracked cycle time | ${median===null?'n/a':median.toFixed(1)+' h'} |`,
`| Sources in brain | ${sources.length} |`,
'',
'## Interpretation','',
'- **Consultation rate** answers whether the brain is actually used before material decisions.',
'- **Update completion** answers whether new learning returns to the brain after work.',
'- **Rejected/deferred-before-code** is a waste-prevention signal, not a failure count.',
'- **Superseded decisions** should include rationale/provenance; reversals are expected when evidence changes.',
'- **Blocked gates** are positive when they prevent uncertified releases.',
'',
'## Review cadence','',
'Review these metrics every 5 tracked cycles or at the end of a major implementation horizon. If consultation/update rates fall, reduce ceremony, improve retrieval, or automate closeout before adding more knowledge.'
];
fs.writeFileSync(path.join(root,'BRAIN_METRICS.md'),md.join('\n'),'utf8');
console.log('Generated BRAIN_METRICS.md.');
