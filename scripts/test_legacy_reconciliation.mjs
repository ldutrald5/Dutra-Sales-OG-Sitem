import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const svc=require('../apps/sistema-og/services/legacy-reconciliation-service.js');
const domain=require('../apps/sistema-og/domain/canonical-domain.js');
let seq=0;const idFactory=(kind,leadId)=>`${kind.toUpperCase()}-${leadId}-${++seq}`;

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
const singleNameGraph={companies:[{id:'C-NAME',entityType:'company',name:'Empresa Nome Igual',legacyLeadId:null,cnpj:null}],contacts:[]};
const singleNameLead={id:'L-NAME',empresa:'Empresa Nome Igual'};
const singleNamePlan=svc.buildPlan([singleNameLead],singleNameGraph);
assert.equal(singleNamePlan.rows[0].status,'review','match único por nome deve exigir revisão em vez de criar duplicata');
assert.equal(singleNamePlan.rows[0].reason,'name_match_requires_confirmation');
const singleNameApplied=svc.applyApproved([singleNameLead],{...singleNameGraph,opportunities:[],activities:[],tasks:[],activityEvents:[]},singleNamePlan,[{leadId:'L-NAME',action:'link_company',companyId:'C-NAME',confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'});
assert.equal(singleNameApplied.graph.companies[0].legacyLeadId,'L-NAME');

const occupiedGraph={companies:[{id:'C-OCC',entityType:'company',name:'Empresa Ocupada',legacyLeadId:'L-OUTRO',cnpj:'44444444000144'}],contacts:[]};
const occupiedLead={id:'L-OCC',empresa:'Empresa Ocupada',cnpj:'44.444.444/0001-44'};
const occupiedRow=svc.inspectLead(occupiedLead,occupiedGraph);
assert.equal(occupiedRow.status,'blocked');
assert.equal(occupiedRow.candidates[0].occupiedByLeadId,'L-OUTRO');

const alphaGraph={companies:[{id:'C-ALPHA',entityType:'company',name:'Alpha',legacyLeadId:null,cnpj:'12ABC34501DE35'}],contacts:[]};
const alphaLead={id:'L-ALPHA',empresa:'Outro nome',cnpj:'12.ABC.345/01DE-35'};
const alphaReview=svc.inspectLead(alphaLead,alphaGraph);
assert.equal(alphaReview.status,'review');
assert.ok(alphaReview.candidates[0].signals.includes('cnpj'));

const invalidCnpjLead={id:'L-INVALID-CNPJ',empresa:'Sem Correspondência',cnpj:'123'};
const invalidCnpjGraph={companies:[{id:'C-INVALID',entityType:'company',name:'Outro Nome',legacyLeadId:null,cnpj:'123'}],contacts:[]};
assert.equal(svc.inspectLead(invalidCnpjLead,invalidCnpjGraph).status,'proposed','CNPJ incompleto não pode ser sinal forte');

const invalidProposal=svc.inspectLead({id:'L-BAD-PROP',empresa:'Empresa CNPJ Ruim',cnpj:'12345'},graph);
assert.equal(invalidProposal.status,'proposed');
assert.equal(invalidProposal.proposal.company.cnpj,null,'CNPJ legado incompleto não deve ser promovido ao canônico');
assert.deepEqual(invalidProposal.warnings,['invalid_cnpj_not_promoted']);

const plan=svc.buildPlan(leads,graph);assert.equal(plan.mode,'dry_run');assert.equal(plan.total,5);assert.deepEqual(plan.counts,{linked:1,review:1,ambiguous:1,proposed:1,blocked:1});assert.equal(svc.validatePlan(plan).valid,true);
assert.equal(svc.validatePlan({mode:'apply',rows:[]}).valid,false);
assert.equal(svc.validatePlan({mode:'dry_run',rows:[{leadId:'L1'},{leadId:'L1'}]}).valid,false);
assert.equal(graph.companies.length,4,'dry-run não pode mutar grafo');

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


const reviewWithWeakCandidateGraph={...applyGraph,companies:[...applyGraph.companies,{id:'C-WEAK',entityType:'company',name:'Outro nome',legacyLeadId:null,cnpj:null,createdAt:'2026-09-27T00:00:00.000Z',updatedAt:'2026-09-27T00:00:00.000Z'}]};
const reviewLead={...leads[1],empresa:'Outro nome'};
const reviewWithWeakPlan=svc.buildPlan([reviewLead],reviewWithWeakCandidateGraph);
assert.equal(reviewWithWeakPlan.rows[0].status,'review');
assert.throws(()=>svc.applyApproved([reviewLead],reviewWithWeakCandidateGraph,reviewWithWeakPlan,[{leadId:'L2',action:'link_company',companyId:'C-WEAK',confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'}),/não corresponde ao CNPJ confirmado/);

const staleGraph={...applyGraph,companies:[...applyGraph.companies,{id:'C5',entityType:'company',name:'Empresa Nova',legacyLeadId:null,cnpj:'33333333000133',createdAt:'2026-09-27T00:00:00.000Z',updatedAt:'2026-09-27T00:00:00.000Z'}]};
assert.throws(()=>svc.applyApproved(leads,staleGraph,applyPlan,[{leadId:'L4',action:'create_company',confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'}),/não está mais elegível.*Gere nova prévia/);


const rolled=svc.rollbackApplied(applied.graph,applyGraph,applied.report,{domain,idFactory,now:'2026-09-27T01:05:00Z'});
assert.equal(rolled.report.total,2);
assert.equal(rolled.graph.companies.find(x=>x.id==='C2').legacyLeadId,null,'rollback deve restaurar vínculo anterior');
assert.equal(rolled.graph.companies.some(x=>x.id===createdCompany.id),false,'rollback deve remover Company criada');
assert.equal(rolled.graph.contacts.some(x=>x.id===createdContact.id),false,'rollback deve remover Contact criado pela aplicação');
assert.equal(rolled.graph.activityEvents.some(x=>x.type==='legacy.reconciliation.applied'),false,'eventos da aplicação revertida devem sair');
assert.equal(rolled.graph.activityEvents.some(x=>x.type==='legacy.reconciliation.rolled_back'),true,'rollback deve deixar auditoria');

const changedAfterApply=JSON.parse(JSON.stringify(applied.graph));
changedAfterApply.companies.find(x=>x.id==='C2').name='Editada depois';
assert.throws(()=>svc.rollbackApplied(changedAfterApply,applyGraph,applied.report,{domain,idFactory,now:'2026-09-27T01:06:00Z'}),/Rollback bloqueado.*mudou após/);

const relatedAfterApply=JSON.parse(JSON.stringify(applied.graph));
relatedAfterApply.tasks.push({id:'T-AFTER',entityType:'task',companyId:createdCompany.id,title:'Trabalho posterior',status:'open',dueAt:null,createdAt:'2026-09-27T01:02:00.000Z',updatedAt:'2026-09-27T01:02:00.000Z'});
assert.throws(()=>svc.rollbackApplied(relatedAfterApply,applyGraph,applied.report,{domain,idFactory,now:'2026-09-27T01:06:00Z'}),/Rollback bloqueado.*recebeu relações/);

const duplicateContactGraph={...applyGraph,contacts:[{id:'CT-EXIST',entityType:'contact',companyId:'C2',name:'Outro',phone:'44999990000',role:'contact',email:null,isDecisionMaker:false,createdAt:'2026-09-27T00:00:00.000Z',updatedAt:'2026-09-27T00:00:00.000Z'}]};
const leadWithContact={...leads[1],nome:'Contato CNPJ',telefone:'44 99999-0000'};
const duplicatePlan=svc.buildPlan([leadWithContact],duplicateContactGraph);
const deduped=svc.applyApproved([leadWithContact],duplicateContactGraph,duplicatePlan,[{leadId:'L2',action:'link_company',companyId:'C2',includeContact:true,confirmed:true}],{domain,idFactory,now:'2026-09-27T01:00:00Z'});
assert.equal(deduped.report.results[0].contactId,null);
assert.equal(deduped.report.results[0].contactSkippedDuplicateId,'CT-EXIST');

console.log('Legacy reconciliation controlled apply tests: PASS');
