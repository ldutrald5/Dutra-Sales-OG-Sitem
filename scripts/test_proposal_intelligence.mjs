import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const proposal = require('../apps/sistema-og/services/proposal-intelligence-service.js');
const operationsModel = require('../apps/sistema-og/operations-model.js');

const quoteState = {
  activePdfTemplate:'lorentrans',
  client:{ nome:'Lucas', empresa:'Transportadora Teste', cnpj:'12.345.678/0001-90', cidadeUf:'Maringá - PR', freteTexto:'Incluso' },
  vehicles:[{ id:'v1', name:'Rodotrem 9 eixos', vehicleTypeId:'rodotrem', libras:120, includeDianteira:true, qty:2, items:[{code:'EQ-120',qty:8,customPrice:249}] }],
  extraItems:[{code:'EQ-700',qty:1,customPrice:1678}]
};
const quote = { id:'COT-123456', clientId:'LEAD-1', clientInternalCode:'15517', clientName:'Lucas', clientCompany:'Transportadora Teste', totalValue:41518, totalPecas:161, payload:quoteState };

const snapshot = proposal.buildSnapshot({quote,quoteState,clientId:'LEAD-1'}, {now:'2026-09-28T05:00:00.000Z'});
assert.equal(snapshot.clientId,'LEAD-1');
assert.equal(snapshot.quoteId,'COT-123456');
assert.equal(snapshot.templateId,'lorentrans');
assert.equal(snapshot.commercial.totalValue,41518);
assert.equal(snapshot.vehicles[0].name,'Rodotrem 9 eixos');
assert.equal(snapshot.vehicles[0].items[0].name,'');
assert.equal(snapshot.client.internalCode,'15517');
assert.equal(proposal.validatePublicSnapshot(snapshot),true);
assert.throws(()=>proposal.validatePublicSnapshot({...snapshot,secret:'x'}),/Campo proibido/);

const ops=operationsModel.createEmptyOperations('2026-09-28T04:59:00.000Z');
const prepared=proposal.prepareTrackingDraft(ops,{quote,quoteState,clientId:'LEAD-1'},{operationsModel,now:'2026-09-28T05:00:00.000Z'});
assert.equal(prepared.quotes.length,1);
assert.equal(prepared.generatedDocuments.length,1);
assert.equal(prepared.generatedDocuments[0].status,'internal_draft');
assert.equal(prepared.generatedDocuments[0].proposalStatus,'DRAFT');
assert.equal(prepared.generatedDocuments[0].total,41518);
assert.equal(prepared.generatedDocuments[0].items[0].code,'EQ-120');
assert.equal(prepared.generatedDocuments[0].items[0].vehicleName,'Rodotrem 9 eixos');
assert.equal(prepared.generatedDocuments[0].createdAt,'2026-09-28T05:00:00.000Z');
assert.ok(proposal.PROPOSAL_STATUSES.includes('ACCEPTED'));
assert.equal(prepared.generatedDocuments[0].publication.publicEnabled,false);
assert.equal(prepared.generatedDocuments[0].publication.publicToken,null);
assert.equal(prepared.activityEvents[0].type,'proposal.prepared');
assert.equal(proposal.canPublish(prepared.generatedDocuments[0]),true);

const revised=proposal.prepareTrackingDraft(prepared,{proposalId:prepared.generatedDocuments[0].id,quote:{...quote,totalValue:40000},quoteState,clientId:'LEAD-1'},{operationsModel,now:'2026-09-28T05:10:00.000Z'});
assert.equal(revised.generatedDocuments.length,1,'editar rascunho não deve duplicar proposta');
assert.equal(revised.generatedDocuments[0].version,2);
assert.equal(revised.generatedDocuments[0].createdAt,'2026-09-28T05:00:00.000Z');
assert.equal(revised.generatedDocuments[0].updatedAt,'2026-09-28T05:10:00.000Z');
assert.equal(revised.generatedDocuments[0].total,40000);

assert.throws(()=>proposal.recordServerEvent({id:'PROP-1'},{type:'proposal_opened'}),/backend confiável/);
const opened=proposal.recordServerEvent({id:'PROP-1'},{id:'EV-1',type:'proposal_opened',at:'2026-09-28T05:03:00Z'},{trustedServer:true});
assert.equal(opened.source,'trusted_server');
assert.equal(opened.type,'proposal.opened','ingresso legado deve ser normalizado para taxonomia canônica');
assert.equal(proposal.normalizeProposalEventType('proposal_reopened'),'proposal.reopened');
assert.equal(proposal.normalizeProposalEventType('proposal.sent'),'proposal.sent');

assert.throws(()=>proposal.recordUserEvent(prepared,{type:'proposal.sent',clientId:'LEAD-1',proposalId:'PROP-1'},{operationsModel}),/confirmação explícita/);
const sentOps=proposal.recordUserEvent(prepared,{
  id:'EV-SENT',
  type:'proposal_sent',
  at:'2026-09-28T05:05:00Z',
  clientId:'LEAD-1',
  proposalId:'PROP-1',
  quoteId:'COT-123456'
},{operationsModel,confirmedByUser:true});
assert.ok(sentOps.activityEvents.some(item=>item.id==='EV-SENT'&&item.type==='proposal.sent'&&item.source==='user_confirmed'));

const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(app,/OG_PROPOSAL_INTELLIGENCE\.prepareTrackingDraft/);
assert.match(app,/rascunho de proposta rastreável preparado com segurança/);
assert.match(html,/proposal-intelligence-service\.js/);
assert.match(sw,/proposal-intelligence-service\.js/);
assert.match(sw,/SW_VERSION = 'v\d+'/);
assert.doesNotMatch(app,/proposal_opened.*appendActivity/s);

console.log('PROP-01A proposal intelligence contracts: PASS');
