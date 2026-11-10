import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {project,ProjectionError,LIMITS} = require('../apps/sistema-og/services/present-projection-service.js');
const proposal = require('../apps/sistema-og/services/proposal-intelligence-service.js');
const implementation = fs.readFileSync('apps/sistema-og/services/present-projection-service.js','utf8');
assert.doesNotMatch(implementation,/\b(?:fetch|XMLHttpRequest|localStorage|indexedDB|WebSocket|sendBeacon)\b|process\.env|\brequire\s*\(/);
const copy = value => structuredClone(value);
const now = '2026-11-10T12:00:00.000Z';
const expiresAt = '2026-11-11T12:00:00.000Z';
const publicSessionRef = '123e4567-e89b-42d3-a456-426614174000';
const reviewed = {subjectName:'Empresa Sintética Alpha',vehicleNames:{'veh-a':'Cavalo sintético','veh-b':'Carreta sintética'},itemNames:{'veh-a:0':'Peça sintética A','veh-b:0':'Peça sintética B'},itemCodes:{'veh-a:0':'TEST-A','veh-b:0':'TEST-B'},applicationNames:{'veh-a:0':'Peça sintética A'},applicationCodes:{'veh-a:0':'TEST-A'},paymentTerms:'Teste: 30 dias',roiSources:{tirePrice:'Hipótese fornecida para teste',lifeMonths:'Hipótese fornecida para teste',lifeGainPct:'Hipótese fornecida para teste'}};
const roiField = (value,unit) => ({value,unit,source:'Hipótese fornecida para teste',status:'reviewed',version:1,updatedAt:now});
const snapshot = {
  schemaVersion:1,representationVersion:2,quoteId:'quote-alpha',clientId:'lead-alpha',preparedAt:now,templateId:'tecnico',
  client:{name:'Contato privado fictício',company:'Empresa Sintética Alpha',cnpj:'00.000.000/0000-00',city:'Cidade sintética',internalCode:'CANARY_INTERNAL_CODE'},
  commercial:{totalValue:2000,totalPieces:4,freightText:'',paymentTerms:'Teste: 30 dias',totalTires:8,totalVehicles:2,subtotalProducts:2000,cardFee:0,installments:1,installmentValue:2000,deliveryText:'',seller:'',validUntil:expiresAt,notes:'CANARY_PRIVATE_NOTES'},
  vehicles:[
    {id:'veh-a',name:'Cavalo sintético',vehicleTypeId:'tractor',libras:0,includeDianteira:false,qty:1,items:[],clientId:'lead-alpha',technicalContext:{leadId:'lead-alpha',notes:'CANARY_TECH_NOTES'},calculatedItems:[{code:'TEST-A',name:'Peça sintética A',category:'teste',qty:2,priceUnit:500,subtotal:1000,isCustomPrice:false}],unitSubtotal:1000,totalSubtotal:1000,totalTires:4,applicationRows:[{code:'TEST-A',name:'Peça sintética A',qty:2,scope:'validar',position:'validar',status:'validate',origin:'manual',path:['CANARY_PRIVATE_PATH']}]},
    {id:'veh-b',name:'Carreta sintética',vehicleTypeId:'trailer',libras:0,includeDianteira:false,qty:1,items:[],clientId:'lead-alpha',technicalContext:{leadId:'lead-alpha'},calculatedItems:[{code:'TEST-B',name:'Peça sintética B',category:'teste',qty:2,priceUnit:500,subtotal:1000,isCustomPrice:false}],unitSubtotal:1000,totalSubtotal:1000,totalTires:4,applicationRows:[]}
  ],extraItems:[],
  roi:{formulaVersion:'replacement-cycle-and-fuel-v1',status:'ready',investment:2000,totalTires:8,
    assumptions:{schemaVersion:1,tires:true,fuel:false,fields:{tirePrice:roiField(100,'BRL/pneu'),lifeMonths:roiField(18,'meses'),lifeGainPct:roiField(20,'%'),fuelMonthlyCost:roiField(null,'BRL/mês'),fuelSavingPct:roiField(null,'%')}},missing:[],tireMonthly:7.407407, fuelMonthly:0,monthlySavings:7.407407,annualSavings:88.888884,paybackMonths:270,roi12mPct:-95.5555558,lifeWithMonths:21.6}
};
const commercialSource = {kind:'proposal_revision',clientRef:{leadId:'lead-alpha'},record:{id:'proposal-alpha',clientId:'lead-alpha',quoteId:'quote-alpha',version:3,status:'internal_draft',snapshot}};
const commercialSelection = {subjectName:true,vehicleIds:['veh-a','veh-b'],showApplications:true,showCommercial:true,showEconomic:true};
const commercialPolicy = {schemaVersion:1,now,expiresAt,publicSessionRef,expectedRevision:{proposalId:'proposal-alpha',clientId:'lead-alpha',quoteId:'quote-alpha',version:3},expectedFixture:null,reviewedText:reviewed};
const demoSource = {kind:'demonstrative_fixture',clientRef:null,fixture:{fixtureId:'CONCEPT-1',fixtureVersion:1,fixtureFingerprint:'a'.repeat(64),subject:{name:'Operação demonstrativa'},fleetGroups:[{label:'Bitrens conceituais',quantity:5,unit:'conjunto',status:'demonstrative'},{label:'Cavalos adicionais conceituais',quantity:2,unit:'veículo',status:'demonstrative'}]}};
const demoSelection = {subjectName:true,vehicleIds:['demo-1','demo-2'],showApplications:false,showCommercial:false,showEconomic:false};
const demoPolicy = {schemaVersion:1,now,expiresAt,publicSessionRef,expectedRevision:null,expectedFixture:{fixtureId:'CONCEPT-1',fixtureVersion:1,fixtureFingerprint:'a'.repeat(64)},reviewedText:{subjectName:'Operação demonstrativa',vehicleNames:{'demo-1':'Bitrens conceituais','demo-2':'Cavalos adicionais conceituais'},itemNames:{},itemCodes:{},applicationNames:{},applicationCodes:{},roiSources:{}}};

let cases = 0;
function passes(source,selection,policy) { cases++; return project(source,selection,policy); }
function rejects(code, mutate, base = [commercialSource,commercialSelection,commercialPolicy]) {
  cases++;
  const args = base.map(copy);
  mutate(...args);
  assert.throws(() => project(...args), error => error instanceof ProjectionError && error.code === code, code);
}
const before = JSON.stringify(commercialSource);
const deepFreeze = value => {if (value && typeof value === 'object') {Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;};
deepFreeze(commercialSource);
deepFreeze(commercialSelection);
deepFreeze(commercialPolicy);
const dto = passes(commercialSource,commercialSelection,commercialPolicy);
assert.equal(JSON.stringify(commercialSource),before);
assert.equal(dto.subject.name,'Empresa Sintética Alpha');
assert.equal(dto.fleetGroups[0].quantity,1);
assert.equal(dto.fleetGroups[0].items[0].subtotal,1000);
assert.equal(dto.fleetGroups[0].items[0].code,'TEST-A');
assert.equal(dto.fleetGroups[0].technicalApplications[0].code,'TEST-A');
assert.equal(dto.approvedCommercial.investment,2000);
assert.equal(dto.economicScenario.results.roi12mPct,-95.5555558);
assert.equal(dto.economicScenario.results.lifeWithMonths,21.6);
assert.equal(dto.economicScenario.classification,'estimate');
assert.equal(dto.approvalStatus,'not_approved');
assert.equal(dto.fleetGroups[0].technicalApplications[0].status,'validate');
assert.ok(Object.isFrozen(dto) && Object.isFrozen(dto.fleetGroups[0]));
const bytes = JSON.stringify(dto);
for (const canary of ['CANARY_INTERNAL_CODE','CANARY_PRIVATE_NOTES','CANARY_TECH_NOTES','CANARY_PRIVATE_PATH','Contato privado fictício','lead-alpha','quote-alpha','proposal-alpha','00.000.000/0000-00']) assert.ok(!bytes.includes(canary),canary);
assert.ok(Buffer.byteLength(bytes) < LIMITS.MAX_DTO_BYTES);
const demo = passes(demoSource,demoSelection,demoPolicy);
assert.equal(demo.classification,'demonstrative');
assert.equal(demo.approvedCommercial,null);
assert.equal(demo.economicScenario,null);
assert.ok(!/lead|quote|proposal|companyId|clientId/.test(JSON.stringify(demo)));
const nativeSnapshot = proposal.buildSnapshot({
  clientId:'native-lead',quoteId:'native-quote',quote:{id:'native-quote',clientId:'native-lead',totalValue:500,totalPecas:1},
  quoteState:{client:{empresa:'Transportadora Sintética',proposalTerms:{validUntil:'2026-11-11',paymentTerms:'Pagamento sintético'}},vehicles:[{id:'native-vehicle',name:'Veículo sintético',qty:1,items:[],technicalContext:{leadId:'native-lead',notes:'CANARY_NATIVE_PRIVATE'}}],extraItems:[]},
  quoteData:{totalFinalVenda:500,totalPneus:2,totalConjuntos:1,subtotalProdutos:500,taxaCartaoValor:0,parcelas:1,valorParcela:500,vehicles:[{id:'native-vehicle',calculatedItems:[{code:'TEST-N',name:'Peça N',qty:1,priceUnit:500,subtotal:500}],unitSubtotal:500,totalSubtotal:500,totalPneus:2}],extraItems:[]}
},{now});
const nativeSource = {kind:'proposal_revision',clientRef:{leadId:'native-lead'},record:{id:'native-proposal',clientId:'native-lead',quoteId:'native-quote',version:1,status:'internal_draft',snapshot:nativeSnapshot}};
const nativeSelection = {subjectName:true,vehicleIds:['native-vehicle'],showApplications:false,showCommercial:true,showEconomic:true};
const nativePolicy = {schemaVersion:1,now,expiresAt,publicSessionRef,expectedRevision:{proposalId:'native-proposal',clientId:'native-lead',quoteId:'native-quote',version:1},expectedFixture:null,reviewedText:{subjectName:'Transportadora Sintética',vehicleNames:{'native-vehicle':'Veículo sintético'},itemNames:{'native-vehicle:0':'Peça N'},itemCodes:{'native-vehicle:0':'TEST-N'},applicationNames:{},applicationCodes:{},paymentTerms:'Pagamento sintético',roiSources:{tirePrice:'',lifeMonths:'',lifeGainPct:''}}};
const nativeDto = passes(nativeSource,nativeSelection,nativePolicy);
assert.equal(nativeDto.validation.status,'VALIDAR');
assert.equal(nativeDto.economicScenario.results,null);
assert.equal(nativeDto.approvedCommercial.investment,500);
assert.ok(!JSON.stringify(nativeDto).includes('CANARY_NATIVE_PRIVATE'));
const blankPrivate = copy(nativeSource);
blankPrivate.record.snapshot.vehicles[0].technicalContext.answers.unanswered = '';
blankPrivate.record.snapshot.vehicles[0].applicationRows = [{code:'TEST-N',name:'Peça N',qty:1,scope:'validar',position:'validar',status:'validate',origin:'manual',path:['']}];
assert.equal(passes(blankPrivate,nativeSelection,nativePolicy).approvedCommercial.investment,500);
blankPrivate.record.snapshot.vehicles[0].technicalContext.answers.unanswered = '\n';
assert.equal(passes(blankPrivate,nativeSelection,nativePolicy).approvedCommercial.investment,500);
const technicalOnlyReview = {...reviewed,roiSources:{}};
delete technicalOnlyReview.paymentTerms;
const technicalOnly = passes(commercialSource,{...commercialSelection,showCommercial:false,showEconomic:false},{...commercialPolicy,reviewedText:technicalOnlyReview});
assert.equal(technicalOnly.approvedCommercial,null);
assert.equal(technicalOnly.fleetGroups[0].subtotal,null);
assert.ok(!JSON.stringify(technicalOnly).includes('2000'));
assert.ok(!Object.hasOwn(technicalOnly.fleetGroups[0].items[0],'unitPrice'));

const oneVehicleSelection = {...commercialSelection,vehicleIds:['veh-a'],showApplications:false,showEconomic:false};
const oneVehiclePolicy = {...commercialPolicy,reviewedText:{...reviewed,vehicleNames:{'veh-a':'Cavalo sintético'},itemNames:{'veh-a:0':'Peça sintética A'},itemCodes:{'veh-a:0':'TEST-A'},applicationNames:{},applicationCodes:{},roiSources:{}}};
const partial = passes(commercialSource,oneVehicleSelection,oneVehiclePolicy);
assert.equal(partial.fleetGroups.length,1);
assert.equal(partial.fleetGroups[0].subtotal,1000);
assert.equal(partial.fleetGroups[0].totalTires,4);
assert.equal(partial.approvedCommercial,null);
assert.equal(partial.economicScenario,null);
assert.equal(partial.validation.status,'VALIDAR');
assert.ok(!JSON.stringify(partial).includes('Carreta sintética'));
assert.ok(!JSON.stringify(partial).includes('TEST-B'));
rejects('INVALID_SELECTION', (s,q,p) => {
  q.vehicleIds=['veh-a'];
  p.reviewedText.vehicleNames={'veh-a':'Cavalo sintético'};
  p.reviewedText.itemNames={'veh-a:0':'Peça sintética A'};
  p.reviewedText.itemCodes={'veh-a:0':'TEST-A'};
  p.reviewedText.applicationNames={'veh-a:0':'Peça sintética A'};
  p.reviewedText.applicationCodes={'veh-a:0':'TEST-A'};
});
assert.equal(dto.fleetGroups.length,2);
assert.equal(dto.approvedCommercial.totalPieces,4);
assert.equal(dto.approvedCommercial.totalTires,8);

rejects('UNKNOWN_FIELD', s => {s.record.snapshot.vehicles[0].calculatedItems[0].margin=42;});
rejects('TEXT_NOT_REVIEWED', s => {s.record.snapshot.vehicles[0].calculatedItems[0].code='CANARY_PRIVATE_ITEM_CODE';});
rejects('TEXT_NOT_REVIEWED', s => {s.record.snapshot.vehicles[0].applicationRows[0].code='CANARY_PRIVATE_APPLICATION_CODE';});
rejects('TEXT_NOT_REVIEWED', (s,q,p) => {delete p.reviewedText.itemCodes['veh-a:0'];});
rejects('UNKNOWN_FIELD', s => {s.record.snapshot.vehicles[0].privateContact='CANARY';});
rejects('UNKNOWN_FIELD', (s,q) => {q.extra=true;});
rejects('UNKNOWN_FIELD', (s,q,p) => {p.reviewedText.vehicleNames['veh-x']='X';});
rejects('UNKNOWN_FIELD', s => {s.record.snapshot.commercial.cost=99;});
rejects('UNKNOWN_FIELD', s => {s.record.snapshot.vehicles[0].technicalContext.privatePhone='CANARY';});
rejects('UNKNOWN_FIELD', s => {s.record.snapshot.roi.assumptions.fields.fuelMonthlyCost.privateMargin=1;});
rejects('INVALID_TEXT', s => {s.record.snapshot.vehicles[0].applicationRows[0].path.push({secret:'CANARY'});});
rejects('MIXED_SOURCE', s => {s.fixture=demoSource.fixture;});
rejects('IDENTITY_MISMATCH', s => {s.clientRef.leadId='lead-beta';});
rejects('IDENTITY_MISMATCH', s => {s.record.snapshot.clientId='lead-beta';});
rejects('IDENTITY_MISMATCH', s => {s.clientRef.leadId='lead-beta';s.record.clientId='lead-beta';s.record.snapshot.clientId='lead-beta';s.record.snapshot.vehicles.forEach(vehicle => {vehicle.clientId='lead-beta';vehicle.technicalContext.leadId='lead-beta';});});
rejects('IDENTITY_MISMATCH', s => {s.record.snapshot.vehicles[0].clientId='lead-beta';});
rejects('IDENTITY_MISMATCH', s => {s.record.snapshot.vehicles[0].technicalContext.leadId='lead-beta';});
rejects('IDENTITY_MISMATCH', s => {s.record.snapshot.vehicles[0].technicalContext.selectedVehicleId='veh-b';});
rejects('IDENTITY_MISMATCH', s => {s.record.snapshot.vehicles[1].id='veh-a';});
rejects('IDENTITY_MISMATCH', (s,q,p) => {p.expectedRevision.clientId='lead-beta';});
rejects('IDENTITY_MISMATCH', (s,q,p) => {p.expectedRevision.version=2;});
rejects('UNSUPPORTED_VERSION', s => {delete s.record.snapshot.representationVersion;});
rejects('UNSUPPORTED_VERSION', s => {s.record.snapshot.representationVersion=3;});
rejects('INVALID_NUMBER', s => {s.record.snapshot.commercial.totalValue=0;});
rejects('INVALID_NUMBER', s => {s.record.snapshot.commercial.totalPieces=0;});
rejects('INVALID_SELECTION', (s,q) => {q.showCommercial=false;});
rejects('EXPIRED_OR_MISSING_TERMS', s => {s.record.snapshot.commercial.validUntil='';});
rejects('EXPIRED_OR_MISSING_TERMS', s => {s.record.snapshot.commercial.validUntil='2026-11-09T12:00:00.000Z';});
rejects('EXPIRED_OR_MISSING_TERMS', (s,q,p) => {p.expiresAt='2026-11-12T12:00:00.000Z';});
rejects('INVALID_TEXT', s => {s.record.snapshot.commercial.paymentTerms='';});
rejects('EXPIRED', (s,q,p) => {p.expiresAt=now;});
rejects('INVALID_REFERENCE', (s,q,p) => {p.publicSessionRef='lead-alpha-session';});
rejects('DUPLICATE_REFERENCE', (s,q) => {q.vehicleIds=['veh-a','veh-a'];});
rejects('UNREVIEWED_PREMISE', s => {s.record.snapshot.roi.assumptions.fields.lifeGainPct.status='validate';});
rejects('UNREVIEWED_PREMISE', s => {s.record.snapshot.roi.assumptions.fields.lifeGainPct.source='';});
rejects('UNREVIEWED_PREMISE', s => {s.record.snapshot.roi.assumptions.fields.lifeGainPct.updatedAt='2026-11-12T12:00:00.000Z';});
rejects('UNSUPPORTED_ROI', s => {s.record.snapshot.roi.assumptions.fields.tirePrice.unit='%';});
rejects('UNSUPPORTED_ROI', s => {s.record.snapshot.roi.monthlySavings=null;});
rejects('UNSUPPORTED_ROI', s => {s.record.snapshot.roi.assumptions.tires=false;s.record.snapshot.roi.assumptions.fuel=false;});
rejects('MIXED_SOURCE', s => {s.clientRef={leadId:'lead-alpha'};}, [demoSource,demoSelection,demoPolicy]);
rejects('IDENTITY_MISMATCH', (s,q,p) => {p.expectedFixture.fixtureVersion=2;}, [demoSource,demoSelection,demoPolicy]);
rejects('INVALID_REFERENCE', s => {s.fixture.fixtureFingerprint='not-a-hash';}, [demoSource,demoSelection,demoPolicy]);
rejects('INVALID_DATE', (s,q,p) => {p.expiresAt='2026-11-31T12:00:00.000Z';}, [demoSource,demoSelection,demoPolicy]);
rejects('UNKNOWN_FIELD', s => {s.fixture.fleetGroups[0].cnpj='CANARY';}, [demoSource,demoSelection,demoPolicy]);
rejects('MIXED_SOURCE', (s,q) => {q.showCommercial=true;}, [demoSource,demoSelection,demoPolicy]);
rejects('UNKNOWN_FIELD', (s,q) => {q.vehicleIds=['lead-alpha','demo-2'];}, [demoSource,demoSelection,demoPolicy]);
rejects('TEXT_NOT_REVIEWED', (s,q,p) => {p.reviewedText.subjectName='Empresa Sintética Beta';});
rejects('TEXT_NOT_REVIEWED', (s,q,p) => {p.reviewedText.paymentTerms='Outra condição';});
rejects('TEXT_NOT_REVIEWED', (s,q,p) => {p.reviewedText.roiSources.lifeMonths='Outra origem';});
rejects('IDENTITY_MISMATCH', s => {s.record.snapshot.roi.investment=2001;});
rejects('UNSUPPORTED_APPLICATION', s => {s.record.snapshot.vehicles[0].applicationRows[0].scope='tractor';});
rejects('SIZE_LIMIT', s => {s.record.snapshot.vehicles[0].technicalContext.notes='X'.repeat(260000);});
rejects('CIRCULAR_OR_SHARED', s => {s.record.snapshot.vehicles[0].technicalContext=s.record.snapshot;}, [commercialSource,commercialSelection,commercialPolicy]);
cases++;
const tooDeep = copy(demoSource);
let nested = tooDeep.fixture;
for (let i=0; i<7000; i++) { nested.extra = {}; nested = nested.extra; }
assert.throws(() => project(tooDeep,demoSelection,demoPolicy), error => error instanceof ProjectionError && error.code === 'DEPTH_LIMIT');
cases++;
const tooWide = copy(demoSource);
tooWide.extra = Array(50001).fill(0);
assert.throws(() => project(tooWide,demoSelection,demoPolicy), error => error instanceof ProjectionError && error.code === 'COMPLEXITY_LIMIT');
cases++;
const accessor = copy(commercialSource);
Object.defineProperty(accessor.record.snapshot.client,'company',{get(){throw new Error('getter executado');}});
assert.throws(() => project(accessor,commercialSelection,commercialPolicy), error => error instanceof ProjectionError && error.code === 'INVALID_VALUE');
console.log(`PRES-S01 positive projection: PASS (${cases} synthetic cases)`);
