import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const crm = require('../apps/sistema-og/services/crm-service.js');
const importer = require('../apps/sistema-og/services/spreadsheet-import-service.js');
const now = '2026-10-11T20:00:00.000Z';
const leads = [
  { id: 'IDENTITY-A', empresa: 'Empresa A FICTÍCIA', internalCode: 'OG-A', telefone: '11990000001', email: 'a.b@example.invalid', cnpj: '11111111000111', observacoes: 'Nota privada A', interactions: [{ id: 'H-A' }] },
  { id: 'IDENTITY-B', empresa: 'Empresa B FICTÍCIA', internalCode: 'OG-B', telefone: '11990000002', email: 'a-b@example.invalid', cnpj: '22222222000122', observacoes: 'Nota privada B', interactions: [{ id: 'H-B' }] }
];
const snapshot = JSON.stringify(leads);

assert.equal(crm.emailIdentity(' A.B@EXAMPLE.INVALID '), 'a.b@example.invalid');
assert.notEqual(crm.emailIdentity('a.b@example.invalid'), crm.emailIdentity('a-b@example.invalid'));
assert.notEqual(crm.emailIdentity('a+b@example.invalid'), crm.emailIdentity('ab@example.invalid'));
assert.equal(crm.emailIdentity('Nome <a.b@example.invalid>'), '', 'display-name wrappers are not comparison identities');
assert.equal(crm.emailIdentity('<a.b@example.invalid>'), '');
assert.equal(crm.emailIdentity('a b@example.invalid'), '');
assert.equal(crm.phoneIdentity('+55 (11) 99000-0001'), crm.phoneIdentity('(11) 99000-0001'));
assert.equal(crm.phoneIdentity('+55 (11) 3300-0001'), crm.phoneIdentity('(11) 3300-0001'));
assert.notEqual(crm.phoneIdentity('55011990000001'), crm.phoneIdentity('011990000001'), 'an invalid Brazilian DDD does not justify stripping 55');
assert.notEqual(crm.phoneIdentity('+1 551 199 000 001'), crm.phoneIdentity('11990000001'), 'foreign numbers retain country identity');
assert.notEqual(crm.phoneIdentity('5520990000001'), crm.phoneIdentity('20990000001'), 'unassigned DDD cannot create a Brazilian alias');
assert.notEqual(crm.phoneIdentity('551170000001'), crm.phoneIdentity('1170000001'), 'unsupported subscriber shape cannot create an alias');

const emailRows = [
  { sourceRow: 2, company: leads[0].empresa, email: 'a.b@example.invalid' },
  { sourceRow: 3, company: leads[1].empresa, email: 'a-b@example.invalid' }
];
assert.deepEqual(importer.preview(emailRows, leads).map(item => item.matchedLeadId), ['IDENTITY-A', 'IDENTITY-B']);
assert.deepEqual(importer.preview(emailRows, []).map(item => item.status), ['NEW', 'NEW']);
assert.equal(importer.candidateMatches({ company: 'Empresa sem vínculo', email: 'a-b@example.invalid' }, [leads[0]]).length, 0);
assert.equal(crm.findPossibleDuplicates([leads[0]], { empresa: 'Outra empresa', email: 'a-b@example.invalid' }).length, 0);
const ddiRow = { sourceRow: 2, company: leads[0].empresa, phone: '5511990000001' };
assert.equal(importer.candidateMatches(ddiRow, leads)[0].leadId, 'IDENTITY-A');
assert.equal(importer.preview([ddiRow], leads)[0].status, 'UNCHANGED', 'DDI presentation alone must not rewrite the number');
assert.equal(crm.findPossibleDuplicates(leads, { empresa: 'Outra empresa', telefone: ddiRow.phone })[0].id, 'IDENTITY-A');
const repeatedPhones = importer.preview([{ ...ddiRow, sourceRow: 2 }, { ...ddiRow, sourceRow: 3, phone: '11990000001' }], []);
assert.ok(repeatedPhones.every(item => item.status === 'POSSIBLE_DUPLICATE'));

assert.equal(crm.resolveClientIdentity(leads, { clientId: 'IDENTITY-B', empresa: leads[1].empresa, internalCode: 'OG-B' }).lead.id, 'IDENTITY-B');
assert.equal(crm.resolveClientIdentity(leads, { empresa: leads[1].empresa, internalCode: 'OG-A' }).status, 'CONFLICT');
assert.equal(crm.resolveClientIdentity(leads, { clientId: 'IDENTITY-A', empresa: leads[1].empresa }).status, 'CONFLICT');
assert.equal(crm.resolveClientIdentity(leads, { clientId: 'IDENTITY-A', leadId: 'IDENTITY-B' }).status, 'CONFLICT');
assert.equal(crm.resolveClientIdentity(leads, { internalCode: 'OG-A', cnpj: leads[1].cnpj }).status, 'CONFLICT');
assert.equal(crm.resolveClientIdentity(leads, { clientId: 'REMOVED', empresa: leads[0].empresa }).status, 'NONE');
assert.equal(crm.resolveClientIdentity([{ id: 'SIMILAR', empresa: 'Empresa-A FICTÍCIA' }], { empresa: 'Empresa A FICTÍCIA' }).status, 'NONE', 'punctuation-stripped similar company names cannot establish a quote identity');
const homonyms = [{ ...leads[0], empresa: 'Empresa Homônima FICTÍCIA' }, { ...leads[1], empresa: 'Empresa Homônima FICTÍCIA' }];
assert.equal(crm.resolveClientIdentity(homonyms, { empresa: homonyms[0].empresa }).status, 'AMBIGUOUS');
assert.equal(crm.resolveClientIdentity(homonyms, { clientId: 'IDENTITY-B', empresa: homonyms[1].empresa }).lead.id, 'IDENTITY-B');
const sharedContacts = [{ ...leads[0] }, { ...leads[1], telefone: leads[0].telefone, email: leads[0].email }];
assert.equal(crm.resolveClientIdentity(sharedContacts, { clientId: 'IDENTITY-B', empresa: leads[1].empresa, telefone: leads[0].telefone, email: leads[0].email }).lead.id, 'IDENTITY-B', 'explicit ID permits a contact already belonging to the selected company even when shared');
assert.equal(crm.resolveClientIdentity(sharedContacts, { empresa: leads[1].empresa, telefone: leads[0].telefone }).status, 'CONFLICT', 'shared contact alone cannot choose the company');
assert.equal(crm.resolveClientIdentity([leads[0], { ...leads[1], telefone: '', email: '' }], { clientId: 'IDENTITY-B', empresa: leads[1].empresa, telefone: leads[0].telefone }).status, 'CONFLICT', 'a contact from A cannot fill a missing B identity silently');
assert.equal(crm.resolveClientIdentity([{ ...leads[0] }, { ...leads[1], cnpj: leads[0].cnpj }], { clientId: 'IDENTITY-B', empresa: leads[1].empresa, cnpj: leads[0].cnpj }).status, 'CONFLICT', 'explicit selection cannot legitimize conflicting company documents');
assert.equal(crm.resolveClientIdentity([{id:'PARTIAL',empresa:'Cadastro parcial',cnpj:'11111111',cpf:'12345'}],{cnpj:'11111111'}).status,'NONE','partial CNPJ cannot establish identity');
assert.equal(crm.resolveClientIdentity([{id:'PARTIAL',empresa:'Cadastro parcial',cnpj:'11111111',cpf:'12345'}],{cpf:'12345'}).status,'NONE','partial CPF cannot establish identity');
assert.equal(crm.resolveClientIdentity([{id:'CPF',empresa:'Cadastro CPF',cpf:'12345678901'}],{cpf:'123.456.789-01'}).lead.id,'CPF');
const extraPhoneLead={...leads[1],additionalPhones:[{label:'Oficina',phone:'4433000004'}]};
assert.equal(crm.resolveClientIdentity([leads[0],extraPhoneLead],{clientId:extraPhoneLead.id,empresa:extraPhoneLead.empresa,telefone:'+55 (44) 3300-0004'}).lead.id,extraPhoneLead.id,'additional CRM phones belong to the explicit selected company');
assert.equal(importer.preview([{sourceRow:2,company:extraPhoneLead.empresa,phone:'554433000004'}],[extraPhoneLead])[0].status,'SAFE_UPDATE');
const contradictoryRow={sourceRow:2,company:'Empresa incompatível FICTÍCIA',externalCode:'OG-OUTRO',document:'33333333000133',phone:leads[0].telefone,email:leads[0].email};
const contradictoryPreview=importer.preview([contradictoryRow],leads);
assert.equal(contradictoryPreview[0].status,'POSSIBLE_DUPLICATE','shared contact cannot rename an unrelated company automatically');
assert.equal(importer.recommendDecision(contradictoryPreview[0]).action,'ignore');
assert.equal(importer.matchLead(contradictoryRow,leads),null,'convenience matcher cannot expose contradictory identity as a resolved lead');
assert.throws(()=>importer.applyPreview(contradictoryPreview,leads,{2:{action:'update',targetLeadId:'IDENTITY-A'}},{now}),/confirmação explícita/);
const safeEnrichment=importer.preview([{sourceRow:2,company:leads[0].empresa,email:leads[0].email,city:'Cidade FICTÍCIA / PR'}],leads);
assert.equal(safeEnrichment[0].status,'SAFE_UPDATE');
const identityChanged=leads.map(lead=>lead.id==='IDENTITY-A'?{...lead,cnpj:'44444444000144'}:lead);
assert.throws(()=>importer.applyPreview(safeEnrichment,identityChanged,{2:{action:'update',targetLeadId:'IDENTITY-A',identityConfirmed:true}},{now}),/mudou desde o preview/,'approval does not apply to a changed canonical identity');
assert.throws(()=>importer.applyPreview(contradictoryPreview,identityChanged,{2:{action:'create',identityConfirmed:true}},{now}),/mudaram desde o preview/,'explicit new-company approval must also reject changed review candidates');
const notesChanged=leads.map(lead=>lead.id==='IDENTITY-A'?{...lead,observacoes:'Nova nota legítima',interactions:[...lead.interactions,{id:'NEW-A'}]}:lead);
const enrichedNotes=importer.applyPreview(safeEnrichment,notesChanged,{2:{action:'update'}},{now});
assert.equal(enrichedNotes.leads[0].observacoes,'Nova nota legítima','unrelated CRM changes are not discarded by identity review');
assert.deepEqual(enrichedNotes.leads[0].interactions,notesChanged[0].interactions);
assert.ok(contradictoryPreview[0].candidates[0].identitySignature.length<800);
assert.doesNotMatch(contradictoryPreview[0].candidates[0].identitySignature,/interactions|observacoes|history|state/,'approval signature contains only bounded identity metadata');
const zeroPaddedCode=importer.preview([{sourceRow:2,externalCode:'12',company:'Empresa número FICTÍCIA',city:'Cidade FICTÍCIA / PR'}],[{id:'NUMERIC',internalCode:'0012',empresa:'Empresa número FICTÍCIA'}]);
assert.equal(zeroPaddedCode[0].status,'SAFE_UPDATE','existing numeric OG-code comparison survives canonical identity validation');

const row = { sourceRow: 2, company: 'Empresa nova FICTÍCIA', phone: '44990000003', email: 'nova@example.invalid', notes: 'Nota própria nova' };
const created = importer.applyPreview(importer.preview([row], leads), leads, { 2: { action: 'create' } }, { now });
assert.equal(created.leads.length, 3);
assert.equal(new Set(created.leads.map(lead => lead.id)).size, 3);
assert.deepEqual(created.leads.slice(0, 2), leads, 'existing IDs, history and notes remain intact');
const secondPreview = importer.preview([row], created.leads);
assert.equal(secondPreview[0].status, 'UNCHANGED');
const repeated = importer.applyPreview(secondPreview, created.leads, importer.recommendedDecisionMap(secondPreview), { now });
assert.equal(repeated.leads.length, 3);
assert.equal(repeated.applied, 0);
assert.throws(() => importer.applyPreview(importer.preview([row], leads), created.leads, { 2: { action: 'create' } }, { now }), /já identificado/, 'stale create decisions cannot duplicate an imported row');
assert.throws(() => importer.applyPreview(importer.preview([row], leads), leads, { 2: { action: 'create' } }, { now, idFactory: () => 'IDENTITY-A' }), /ID de cliente/, 'colliding factories never emit duplicate IDs');
const afterDeletion = created.leads.filter(lead => lead.id !== 'IDENTITY-A');
const otherRow = { sourceRow: 3, company: 'Outra empresa nova FICTÍCIA', phone: '44990000004' };
const afterDeleteImport = importer.applyPreview(importer.preview([otherRow], afterDeletion), afterDeletion, { 3: { action: 'create' } }, { now });
assert.equal(new Set(afterDeleteImport.leads.map(lead => lead.id)).size, afterDeleteImport.leads.length);
assert.ok(afterDeleteImport.leads.some(lead => lead.id === 'IDENTITY-B'));

const weakRow = { sourceRow: 2, company: homonyms[0].empresa, notes: 'Texto do arquivo' };
const ambiguousPreview = importer.preview([weakRow], homonyms);
assert.equal(ambiguousPreview[0].status, 'POSSIBLE_DUPLICATE');
assert.equal(ambiguousPreview[0].candidates.length, 2);
assert.throws(() => importer.applyPreview(ambiguousPreview, homonyms, { 2: { action: 'update', targetLeadId: 'IDENTITY-B' } }, { now }), /confirmação explícita/);
assert.throws(() => importer.applyPreview(ambiguousPreview, homonyms, { 2: { action: 'update', identityConfirmed: true } }, { now }), /não existe|explicitamente/);
const cancelled = importer.applyPreview(ambiguousPreview, homonyms, { 2: { action: 'ignore' } }, { now });
assert.deepEqual(cancelled.leads, homonyms);
assert.equal(cancelled.applied, 0);
const reviewed = importer.applyPreview(ambiguousPreview, homonyms, { 2: { action: 'update', targetLeadId: 'IDENTITY-B', identityConfirmed: true, fields: { notes: 'keep' } } }, { now });
assert.deepEqual(reviewed.leads, homonyms);
assert.equal(importer.preview([{ sourceRow: 2, company: leads[0].empresa }], leads)[0].status, 'POSSIBLE_DUPLICATE', 'name-only input always requires review, including without city');

const atomicRows = [row, { ...weakRow, sourceRow: 3 }];
assert.throws(() => importer.applyPreview(importer.preview(atomicRows, homonyms), homonyms, { 2: { action: 'create' }, 3: { action: 'update', targetLeadId: 'IDENTITY-A' } }, { now }), /confirmação explícita/);
assert.equal(JSON.stringify(leads), snapshot, 'failed or cancelled imports never mutate the input CRM');
assert.deepEqual(homonyms.map(lead => lead.observacoes), ['Nota privada A', 'Nota privada B']);
assert.throws(() => importer.applyPreview([], [leads[0], leads[0]], {}, { now }), /IDs ausentes ou duplicados/);
const generated = Array.from({ length: 50 }, () => crm.createLeadId([], { now }));
assert.equal(new Set(generated).size, 50, 'same-timestamp generation remains unique');
assert.ok(generated.every(id=>id.startsWith('LEAD-')));

console.log('CRM identity integrity: PASS (synthetic fixtures; e-mail punctuation, structural DDI, no ambiguous writes, idempotence and atomic import).');
