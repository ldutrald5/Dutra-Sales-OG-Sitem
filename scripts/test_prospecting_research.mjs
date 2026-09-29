import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const research=require('../apps/sistema-og/services/prospecting-research-service.js');
const intake=require('../apps/sistema-og/services/prospecting-intake-service.js');
const territory=require('../apps/sistema-og/services/territory-readiness-service.js');

const mission=intake.buildResearchMission({location:'Cascavel - PR',segment:'transportadora',minFleet:30,requestedCount:10},{territoryReadiness:territory});
const job=research.createResearchJob(mission,{id:'r1',now:'2026-09-28T21:00:00-03:00'});
const queue=research.createResearchQueue();
queue.enqueue(job);
assert.equal(queue.next().id,'r1');

const provider=research.createProvider({id:'fixture-public-search',search:async()=>[
 {companyName:'Nova Log',city:'Cascavel',state:'PR',segment:'transportadora',fleetSize:45,sources:[{url:'https://example.org/nova',supports:['company','fleet']}]},
 {companyName:'Sem Fonte',city:'Cascavel',state:'PR',segment:'transportadora',fleetSize:50,sources:[]},
 {companyName:'Ja Existe',city:'Cascavel',state:'PR',segment:'transportadora',fleetSize:80,sources:[{url:'https://example.org/existe'}]}
]});
const result=await research.runResearchJob(job,{provider,intake,leads:[{company:'Ja Existe'}],now:'2026-09-28T21:05:00-03:00'});
assert.equal(result.status,'completed');
assert.equal(result.summary.found,3);
assert.equal(result.summary.readyForReview,1);
assert.equal(result.summary.insufficientEvidence,1);
assert.equal(result.summary.duplicates,1);
assert.equal(result.candidates.find(x=>x.companyName==='Nova Log').importAllowed,true);
assert.equal(result.candidates.find(x=>x.companyName==='Ja Existe').importAllowed,false);
queue.replace(result);
assert.equal(queue.list('completed').length,1);
console.log('prospecting research tests: PASS');
