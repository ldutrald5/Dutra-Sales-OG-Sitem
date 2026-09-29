import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const review=require('../apps/sistema-og/services/prospecting-review-service.js');
const crm=require('../apps/sistema-og/services/crm-service.js');

const candidate={reviewStatus:'ready_for_review',researchJobId:'r1',providerId:'public-search',companyName:'Nova Log',city:'Cascavel',state:'PR',segment:'transportadora',fleetSize:45,decisionMaker:'Carlos',contact:'45999999999',sources:[{url:'https://example.org/nova'}],fitReasons:['segment_match','fleet_threshold'],importAllowed:true};
const inbox=review.reviewInbox([{id:'r1',providerId:'public-search',candidates:[candidate,{...candidate,companyName:'Duplicada',duplicate:true,importAllowed:false}]}]);
assert.equal(inbox.length,2);
assert.equal(inbox[1].status,'duplicate');

const prepared=review.prepareCrmImport(inbox[0],{reviewedBy:'lucas',reviewedAt:'2026-09-28T21:30:00-03:00'});
assert.equal(prepared.sourceChannel,'dutra_research');
assert.equal(prepared.importMeta.sourceUrls.length,1);
assert.equal(prepared.fleetSize,45);

const result=review.importCandidate(inbox[0],[],{crm,id:'LEAD-NEW',now:'2026-09-28T21:31:00-03:00',reviewedBy:'lucas'});
assert.equal(result.status,'imported');
assert.equal(result.lead.id,'LEAD-NEW');
assert.equal(result.lead.fleetSize,45);
assert.equal(result.lead.importMeta.origin,'dutra_research');

const blocked=review.importCandidate(inbox[0],[{id:'EXISTE',empresa:'Nova Log'}],{crm});
assert.equal(blocked.status,'duplicate_blocked');
assert.throws(()=>review.prepareCrmImport({...inbox[0],sources:[]}),/evidência/i);
console.log('prospecting review tests: PASS');
