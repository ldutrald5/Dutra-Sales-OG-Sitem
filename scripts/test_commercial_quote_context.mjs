import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crm from '../apps/sistema-og/services/crm-service.js';
import clientContext from '../apps/sistema-og/services/quote-client-context-service.js';

// Real bridge/guard functions; only local synthetic records and in-memory sinks.
const app = fs.readFileSync(new URL('../apps/sistema-og/app.js',import.meta.url),'utf8');
function extract(name) {
  const start = new RegExp(`^  (?:async )?function ${name}\\(`,'m').exec(app);
  assert.ok(start,`${name} exists`);
  const end = app.indexOf('\n  }',start.index);
  return app.slice(start.index,end+4);
}
const clone = value => JSON.parse(JSON.stringify(value));
const leads = [{id:'SYN-A',empresa:'Empresa A',internalCode:'CODE-A'}, {id:'SYN-B',empresa:'Empresa B',internalCode:'CODE-B'}];
const defaults = {empresa:'',nome:'',cnpj:'',telefone:'',segmentId:'transportadora',tier:'lead_ie',paymentMethod:'faturado',observacoes:''};
const originalVehicle = {id:'VEH-A',name:'Personal name A',vehicleTypeId:'toco_4x2',libras:120,includeDianteira:false,qty:3,clientId:'SYN-A',
  items:[{code:'EQ-120',qty:2,customPrice:99,applicationScope:'cavalo',customerNotes:'Private A'}],
  technicalContext:{id:'TECH-A',leadId:'SYN-A',notes:'Private A',answers:{brand:'volvo',customerName:'Private A'},applicationScope:'cavalo',handoffId:'VEH-A'}};
const data={vehicleConsultantRules:[{id:'toco_4x2',name:'Toco 4×2',questions:[{id:'brand',options:[{value:'volvo'}]}]}]};
let uid=0;
function harness(choice='clean') {
  const state={client:{...defaults,...leads[0],clientId:'SYN-A',observacoes:'Private A',proposalTerms:{notes:'Private A'},roiAssumptions:{value:123},proposalPresentation:{branding:{assetId:'ASSET-A'}}},
    vehicles:[clone(originalVehicle)],extraItems:[{code:'EQ-600',qty:2,customPrice:99}],consultant:{leadId:'SYN-A',notes:'Private A'},
    leads:clone(leads),history:[],operations:{quotes:[],generatedDocuments:[{id:'PROPOSAL-A',clientId:'SYN-A'}]},quoteImportImageBase64:'Private A',quoteImportItems:[{note:'Private A'}],lastQuoteData:{note:'Private A'}};
  const immutableOperations=clone(state.operations);const calls={persist:0,choices:0,notifications:[],tabs:[]};
  const ctx=vm.createContext({state,quoteClientDefaults:defaults,workingQuoteDraftId:'DRAFT-A',activeProposalContext:{clientId:'SYN-A'},OG_CRM_SERVICE:crm,OG_QUOTE_CLIENT_CONTEXT:clientContext,OG_DATA:data,
    crypto:{randomUUID:()=>`SYN-UUID-${++uid}`}, requestCommercialChoice:async()=>{calls.choices++;return choice;},
    emptyTechnicalDraft:leadId=>({id:`TECH-${++uid}`,leadId,notes:'',answers:{}}),
    hydrateQuoteClientInputs(){},persistVehicleComposition:async()=>{calls.persist++;},renderQuoteImportPreview(){},
    showNotification:(message,level)=>calls.notifications.push({message,level}),closeClientSheet(){},closeCommandCenter(){},switchTab:tab=>calls.tabs.push(tab),recalculateQuote(){},
    document:{getElementById:()=>null},JSON,Promise});
  vm.runInContext(['captureQuoteCompositionSnapshot','sameSavedQuoteComposition','findLeadForClientData','validProposalClient','validHistoricalProposal','proposalDocumentForContext','transitionQuoteClient','openDeskQuote','resolveHistoryLead'].map(extract).join('\n'),ctx);
  return {state,ctx,calls,immutableOperations};
}
{
  const h=harness('cancel');const before=JSON.stringify(h.state);
  assert.equal(await h.ctx.transitionQuoteClient(h.state.leads[1]),false);
  assert.equal(JSON.stringify(h.state),before,'Cancellation changes no state');assert.equal(h.calls.persist,0);
}
{
  const h=harness();await h.ctx.openDeskQuote(h.state.leads[1]);
  assert.equal(h.state.client.clientId,'SYN-B');assert.equal(h.state.client.empresa,'Empresa B');
  assert.deepEqual(clone(h.state.vehicles),[]);assert.deepEqual(clone(h.state.extraItems),[]);
  assert.equal(h.state.client.proposalTerms,undefined);assert.equal(h.state.client.roiAssumptions,undefined);assert.equal(h.state.client.proposalPresentation,undefined);
  assert.equal(h.state.quoteImportImageBase64,null);assert.deepEqual(clone(h.state.quoteImportItems),[]);
  assert.equal(h.state.consultant.leadId,'SYN-B');assert.equal(h.state.lastQuoteData,null);
  assert.equal(vm.runInContext('activeProposalContext',h.ctx),null);assert.equal(vm.runInContext('workingQuoteDraftId',h.ctx),null);
  assert.equal(h.calls.persist,1);assert.deepEqual(h.state.operations,h.immutableOperations,'Historical proposal/store is never rewritten');
}
{
  const h=harness('reuse');await h.ctx.transitionQuoteClient(h.state.leads[1]);const v=h.state.vehicles[0];
  assert.equal(v.clientId,'SYN-B');assert.equal(v.technicalContext.leadId,'SYN-B');assert.notEqual(v.id,'VEH-A');
  assert.equal(v.qty,3);assert.equal(v.items[0].qty,2);assert.equal(v.items[0].customPrice,null);
  assert.equal(v.technicalContext.notes,'');assert.equal(v.technicalContext.answers.customerName,undefined);
  assert.equal(v.technicalContext.manualConfirmed,false);assert.equal(v.clientReviewRequired,true);
  assert.equal(h.ctx.validProposalClient(h.state.leads[1]),false,'Technical reuse cannot become a prepared quote without review');
  assert.equal(h.ctx.validProposalClient(h.state.leads[1],{allowReviewDraft:true}),true,'A correctly linked review draft may persist');
  assert.equal(h.state.client.roiAssumptions,undefined);assert.equal(h.state.extraItems[0].customPrice,null);
}
{
  const h=harness();h.state.client.empresa='Empresa B';
  assert.equal(h.ctx.findLeadForClientData(h.state.client),null);assert.equal(h.ctx.validProposalClient(null),false,'Header B plus owner A is incompatible');
  assert.equal(h.ctx.resolveHistoryLead({clientId:'DELETED-A',payload:{client:{empresa:'Empresa B'}}}),null,'Deleted historical owner cannot fall back to homonym B');
  assert.equal(h.ctx.resolveHistoryLead({clientId:'SYN-A',payload:{client:{empresa:'Empresa A',clientId:'SYN-B'}}}),null,'An explicit contradictory payload cannot be hidden by the history anchor');
}
{
  const h=harness();h.state.leads.push({...h.state.leads[1],empresa:'Another B'});const before=JSON.stringify(h.state);
  assert.equal(await h.ctx.transitionQuoteClient(h.state.leads[1]),false,'Duplicate canonical IDs cannot pick the first record');
  assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.persist,0);
}
{
  const h=harness();const foreign={id:'PROP-B',documentType:'proposal_tracking',quoteId:'SHARED-Q',clientId:'SYN-B',snapshot:{clientId:'SYN-B',quoteId:'SHARED-Q',representationVersion:2,client:{company:'Empresa B'},commercial:{notes:'Private B'},roi:{assumptions:{value:999}},presentation:{branding:{clientId:'SYN-B'}}}};
  h.state.operations.generatedDocuments=[foreign];h.ctx.activeProposalContext={proposalId:foreign.id,quoteId:foreign.quoteId,clientId:'SYN-A'};
  assert.equal(h.ctx.proposalDocumentForContext(),null,'A quote cannot render a B snapshot even when quoteId collides');
  h.state.history=[{id:'SHARED-Q',date:'2026-10-13',clientId:'SYN-A',totalValue:0,totalPecas:0,payload:{client:{...defaults,...leads[0],clientId:'SYN-A'},vehicles:[],extraItems:[]}}];
  let load;const container={innerHTML:'',appendChild(){},querySelectorAll:selector=>selector==='.btn-load-hist'?[{getAttribute:()=> '0',addEventListener:(_name,callback)=>{load=callback;}}]:[]};
  h.ctx.document={getElementById:id=>id==='history-container'?container:null,createElement:()=>({})};h.ctx.escapeHtml=value=>String(value);
  const original=JSON.stringify(h.state.operations.generatedDocuments);
  vm.runInContext(extract('renderHistory'),h.ctx);h.ctx.renderHistory();load();
  assert.equal(h.state.client.clientId,'SYN-A');assert.equal(h.state.client.proposalTerms,undefined);assert.equal(h.state.client.roiAssumptions,undefined);assert.equal(h.state.client.proposalPresentation,undefined);
  assert.equal(h.state.quoteImportImageBase64,null,'History navigation clears previous client media');
  assert.equal(JSON.stringify(h.state.operations.generatedDocuments),original,'Incompatible historical snapshots remain unchanged, never migrated');
}
{
  const h=harness();h.ctx.requestCommercialChoice=async()=>{h.state.leads[1].empresa='Changed while reviewing';return 'clean';};
  assert.equal(await h.ctx.transitionQuoteClient(h.state.leads[1]),false,'A changed candidate must be reviewed again');
  assert.equal(h.state.client.clientId,'SYN-A');assert.equal(h.calls.persist,0);
}
{
  const h=harness();let writes=0;
  h.ctx.saveOperationsToStorage=()=>{writes++;};h.ctx.OG_SYNC_BRIDGE={queueState:async()=>{}};h.ctx.currentSyncPayload=()=>({});
  vm.runInContext(['validQuoteVehicleDraft','saveTechnicalDraft','openTechnicalQuote'].map(extract).join('\n'),h.ctx);
  const record=await h.ctx.saveTechnicalDraft({id:'UNLINKED',leadId:'',notes:'',answers:{}},{ready:false},false);
  assert.equal(record.clientId,null);assert.equal(record.payload.client.empresa,'','An anonymous technical draft cannot inherit linked A');
  assert.equal(record.payload.client.proposalTerms,undefined);assert.equal(record.payload.client.roiAssumptions,undefined);
  h.state.operations.quotes.push({id:'EXISTING-A',source:'technical_workspace',clientId:'SYN-A',payload:{client:{empresa:'Empresa A'}}});
  const before=JSON.stringify(h.state.operations);const writeCount=writes;
  await assert.rejects(h.ctx.saveTechnicalDraft({id:'EXISTING-A',leadId:'SYN-B'},{ready:false},false),/outro cliente/);
  assert.equal(JSON.stringify(h.state.operations),before,'A technical draft owned by A cannot be overwritten under B');assert.equal(writes,writeCount);
  h.state.consultant={id:'BAD-B',leadId:'SYN-B'};
  const context=JSON.stringify(h.state.client);
  await h.ctx.openTechnicalQuote({id:'BAD-B',clientId:'SYN-B',payload:{client:{empresa:'Empresa B',clientId:'SYN-B'},vehicles:[{...clone(originalVehicle),clientId:'SYN-A'}]}});
  assert.equal(JSON.stringify(h.state.client),context,'A foreign vehicle is rejected before any client transition');
}
{
  const h=harness();h.state.leads=[];h.state.client={...defaults,empresa:'Manual A',proposalTerms:{notes:'Private A'}};
  h.state.vehicles=[];h.state.extraItems=[];const events={};const input={value:'Manual B',addEventListener:(name,callback)=>{events[name]=callback;}};
  h.ctx.document={getElementById:id=>id==='client-company'?input:null};h.ctx.refreshQuoteClientSheetAccess=()=>{};
  vm.runInContext(extract('initClientInputs'),h.ctx);h.ctx.initClientInputs();events.focus();events.input({target:input});
  assert.equal(h.ctx.validProposalClient(null),false,'Unlinked manual company changes are blocked during typing, before confirmation');
  await events.change();assert.equal(h.state.client.empresa,'Manual B');assert.equal(h.state.client.proposalTerms,undefined);assert.equal(h.ctx.validProposalClient(null),true);
}
{
  const h=harness();const buttons={};let release;const opened=[];
  h.ctx.document={getElementById:id=>id.startsWith('btn-')?(buttons[id] ||= {}):null};
  h.ctx.navigator={clipboard:{writeText:()=>new Promise(resolve=>{release=resolve;})}};
  h.ctx.window={open:(...args)=>opened.push(args)};h.ctx.alert=()=>{throw new Error('stale text must not surface');};
  h.ctx.generateWhatsappText=()=> 'Synthetic A quotation';h.ctx.proposalIdentity=()=>JSON.stringify(h.state.client);
  h.ctx.publishActiveProposal=()=>{};h.ctx.renderProposalTrackingStatus=()=>{};
  vm.runInContext(extract('setupExportButtons'),h.ctx);h.ctx.setupExportButtons({});buttons['btn-copy-whatsapp-simple'].onclick();
  h.state.client=clientContext.clientForLead(h.state.leads[1],defaults);release();await Promise.resolve();await Promise.resolve();
  assert.equal(opened.length,0,'A delayed clipboard completion never opens B with A text');assert.equal(h.calls.notifications.length,0);
}
{
  const h=harness();const elements={};const readerInstances=[];let release;let parsed=0;let terminated=0;
  const element=id=>elements[id] ||= {value:'',disabled:false,textContent:'',classList:{contains:()=>false,add(){},remove(){}},events:{},addEventListener(name,callback){this.events[name]=callback;}};
  h.ctx.document={getElementById:element};h.ctx.window={addEventListener(){}};h.ctx.bindAppDialog=()=>{};h.ctx.openAppDialog=()=>{};h.ctx.closeAppDialog=()=>{};
  h.ctx.FileReader=class{constructor(){readerInstances.push(this);}readAsDataURL(){}};
  h.ctx.cropQuoteTableImage=async image=>image;h.ctx.parseImportedQuote=()=>{parsed++;};
  h.ctx.Tesseract={createWorker:async()=>({setParameters:async()=>{},recognize:()=>new Promise(resolve=>{release=resolve;}),terminate:async()=>{terminated++;}})};
  vm.runInContext(extract('initQuoteImport'),h.ctx);h.ctx.initQuoteImport();
  element('quote-ocr-file').events.change({target:{files:[{type:'image/png',name:'FICTICIO-A.png'}]}});
  h.state.client=clientContext.clientForLead(h.state.leads[1],defaults);h.ctx.workingQuoteDraftId='NEW-B';h.state.quoteImportImageBase64=null;
  readerInstances[0].onload({target:{result:'FICTICIO-A-IMAGE'}});assert.equal(h.state.quoteImportImageBase64,null,'Late A FileReader cannot restore its image in B');
  h.state.client=clientContext.clientForLead(h.state.leads[0],defaults);h.ctx.workingQuoteDraftId='NEW-A';h.state.quoteImportImageBase64='FICTICIO-A-IMAGE';
  const pending=element('btn-read-quote-image').events.click();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof release,'function');
  h.state.client=clientContext.clientForLead(h.state.leads[1],defaults);h.ctx.workingQuoteDraftId='ANOTHER-B';h.state.quoteImportImageBase64=null;
  release({data:{text:'FICTICIO-A-ITEMS'}});await pending;
  assert.equal(parsed,0,'Late A OCR cannot recreate its items in B');assert.equal(element('quote-ocr-text').value,'');assert.equal(terminated,1);
}
{
  const h=harness();const recorded=[];
  h.ctx.inspector={querySelector:()=>({addEventListener:(_event,callback)=>recorded.push(callback)})};h.ctx.lead=h.state.leads[1];
  const start=app.indexOf("    const applyQuoteBtn = inspector.querySelector('#btn-apply-lead-quote');");const end=app.indexOf('\n    }',start);
  assert.ok(start>=0&&end>start);vm.runInContext(app.slice(start,end+6),h.ctx);
  assert.equal(recorded.length,1);await recorded[0]();assert.equal(h.state.client.clientId,'SYN-B');assert.deepEqual(clone(h.state.vehicles),[]);
}
for (const kind of ['cancel','duplicate-id','stale-identity']) {
  const h=harness();h.state.leads.forEach(lead=>{lead.empresa='Homônimo fictício';});
  if(kind==='duplicate-id')h.state.leads[1].id=h.state.leads[0].id;
  let callback, writes=0;h.ctx.overlay={querySelector:()=>({addEventListener:(_event,cb)=>{callback=cb;}})};
  h.ctx.input={value:'Comando sintético'};h.ctx.window={confirm:()=>true};
  h.ctx.OG_PROSPECT_PARSER={parseNaturalCommand:()=>({company:'Homônimo fictício',commandText:'Comando sintético',result:'NO_ANSWER',confidence:'explicit'})};
  h.ctx.OG_INTERACTION_SERVICE={recordResult:()=>{writes++;},setNextAction:()=>{writes++;}};h.ctx.saveLeadsToStorage=()=>{writes++;};h.ctx.renderDayDashboard=()=>{};
  h.ctx.requestCommercialChoice=async()=>{if(kind==='stale-identity')h.state.leads[0].empresa='Outra empresa';return kind==='cancel'?'cancel':'SYN-A';};
  const start=app.indexOf("    overlay.querySelector('#command-natural').addEventListener('click', async () => {");
  const end=app.indexOf('\n    });\n  }',start);
  assert.ok(start>=0&&end>start);vm.runInContext(app.slice(start,end+8),h.ctx);await callback();
  assert.equal(writes,0,`${kind} never writes the interpreted command to an uncertain client`);
}
console.log('Commercial quote context: PASS (real bridges, cancellation, clean B, technical-only review, header and ID guards, orphan history, anonymous draft isolation, stale media/clipboard, legacy callback).');
