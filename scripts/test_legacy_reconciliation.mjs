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

const domain=require('../apps/sistema-og/domain/canonical-domain.js');
let seq=0;const idFactory=(kind,leadId)=>`${kind.toUpperCase()}-${leadId}-${++seq}`;
const applyGraph={...graph,contacts:[],opportunities:[],activities:[],tasks:[],activityEvents:[]};
const applyPlan=svc.buildPlan(leads,applyGraph);
const applied=svc.applyApproved(leads,applyGraph,applyPlan,[
  {leadId:'L2',action:'link_company',companyId:'C2',includeContact:false,confirmed:true},
  {leadId:'L4',action:'create_company',includeContact:true,confirmed:true}
],{domain,idFactory,now:'2026-09-27T01:00:00Z'});
assert.equal(applied.report.total,2);
assert.equal(applied.graph.companies.find(x=>x.id==='C2').legacyLeadId,'L2');
const createdCompany=applied.graph.companies.find(x=>x.legacyLeadId==='L4');assert.ok(createdCompany);
const createdContact=applied.graph.contacts.find(x=>x.entityType==='contact'&&x.companyId===createdCompany.id);assert.ok(createdContact);assert.equal(createdContact.isDecisionMaker,true);
assert.equal(applied.graph.activityEvents.filter(x=>x.type==='legacy.reconciliation.applied').length,2);
assert.equal(applyGraph.companies.find(x=>x.id==='C2').legacyLeadId,null,'apply não deve mutar grafo original');
assert.throws(()=>svc.applyApproved(leads,applyGraph,applyPlan,[{leadId:'L4',action:'create_company',confirmed:false}],{domain,idFactory,now:'2026-09-27T01:00:00Z'}),/confirmação explícita/);
assert.throws(()=>svc.applyApproved(leads,applyGraph,applyPlan,[{leadId:'L3',action:'link_company',companyId:'INEXISTENTE',confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'}),/não é candidata atual/);

const staleGraph={...applyGraph,companies:[...applyGraph.companies,{id:'C5',entityType:'company',name:'Empresa Nova',legacyLeadId:null,cnpj:'33333333000133',createdAt:'2026-09-27T00:00:00.000Z',updatedAt:'2026-09-27T00:00:00.000Z'}]};
assert.throws(()=>svc.applyApproved(leads,staleGraph,applyPlan,[{leadId:'L4',action:'create_company',confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'}),/não está mais elegível.*Gere nova prévia/);

const duplicateContactGraph={...applyGraph,contacts:[{id:'CT-EXIST',entityType:'contact',companyId:'C2',name:'Outro',phone:'44999990000',role:'contact',email:null,isDecisionMaker:false,createdAt:'2026-09-27T00:00:00.000Z',updatedAt:'2026-09-27T00:00:00.000Z'}]};
const leadWithContact={...leads[1],nome:'Contato CNPJ',telefone:'44 99999-0000'};
const duplicatePlan=svc.buildPlan([leadWithContact],duplicateContactGraph);
const deduped=svc.applyApproved([leadWithContact],duplicateContactGraph,duplicatePlan,[{leadId:'L2',action:'link_company',companyId:'C2',includeContact:true,confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'});
assert.equal(deduped.report.results[0].contactId,null);
assert.equal(deduped.report.results[0].contactSkippedDuplicateId,'CT-EXIST');

console.log('Legacy reconciliation controlled apply tests: PASS');
