import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const svc=require('../apps/sistema-og/services/legacy-reconciliation-service.js');

const graph={companies:[
 {id:'C1',entityType:'company',name:'Já vinculada',legacyLeadId:'L1',cnpj:'11111111000111'},
 {id:'C2',entityType:'company',name:'CNPJ Match',legacyLeadId:null,cnpj:'22222222000122'},
 {id:'C3',entityType:'company',name:'Nome Ambíguo',legacyLeadId:null,cnpj:null},
 {id:'C4',entityType:'company',name:'Nome Ambíguo',legacyLeadId:null,cnpj:null}
],contacts:[]};
const leads=[
 {id:'L1',empresa:'Já vinculada',cnpj:'11111111000111'},
 {id:'L2',empresa:'Outro nome',cnpj:'22.222.222/0001-22'},
 {id:'L3',empresa:'Nome Ambíguo'},
 {id:'L4',empresa:'Empresa Nova',cnpj:'33.333.333/0001-33',nome:'Maria',telefone:'44 99999-0000',decisionMaker:'Maria'},
 {id:'L5',empresa:''}
];
assert.equal(svc.inspectLead(leads[0],graph).status,'linked');
const review=svc.inspectLead(leads[1],graph);assert.equal(review.status,'review');assert.equal(review.candidates[0].companyId,'C2');assert.ok(review.candidates[0].signals.includes('cnpj'));
assert.equal(svc.inspectLead(leads[2],graph).status,'ambiguous');
const proposed=svc.inspectLead(leads[3],graph);assert.equal(proposed.status,'proposed');assert.equal(proposed.proposal.company.legacyLeadId,'L4');assert.equal(proposed.proposal.company.cnpj,'33333333000133');assert.equal(proposed.proposal.contact.isDecisionMaker,true);
assert.equal(svc.inspectLead(leads[4],graph).status,'blocked');
const plan=svc.buildPlan(leads,graph);assert.equal(plan.mode,'dry_run');assert.equal(plan.total,5);assert.deepEqual(plan.counts,{linked:1,review:1,ambiguous:1,proposed:1,blocked:1});assert.equal(svc.validatePlan(plan).valid,true);
assert.equal(svc.validatePlan({mode:'apply',rows:[]}).valid,false);
assert.equal(svc.validatePlan({mode:'dry_run',rows:[{leadId:'L1'},{leadId:'L1'}]}).valid,false);
assert.equal(graph.companies.length,4,'dry-run não pode mutar grafo');
console.log('Legacy reconciliation dry-run tests: PASS');
