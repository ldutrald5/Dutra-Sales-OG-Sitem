import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

// CONVERGENCE-01 Stage 7: use only synthetic business records and the real
// quotation/history/transport functions. Never read persisted CRM or .data.
// Optional baseline proof requires Git history; the normal regression does not.
const repo = new URL('../', import.meta.url);
const baselineRevision = '6af84634ca8e873fef834e850eb74e88c12af1d4';
const baselineMode = process.argv.includes('--baseline-growth');
const app = baselineMode
  ? execFileSync('git', ['show', `${baselineRevision}:apps/sistema-og/app.js`], { cwd:repo, encoding:'utf8', maxBuffer:8_000_000 })
  : fs.readFileSync(new URL('apps/sistema-og/app.js', repo), 'utf8');
const server = fs.readFileSync(new URL('apps/sistema-og/server.mjs', repo), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const bytes = value => Buffer.byteLength(JSON.stringify(value), 'utf8');

// Existing VM tests extract production sections. These functions have an
// unindented closing brace relative to their body, including renderHistory's
// actual load-button callback; do not replace the save/reopen implementation.
function extractFunction(source, name) {
  const start = new RegExp(`^([ \\t]*)(?:async )?function ${name}\\(`, 'm').exec(source);
  assert.ok(start, `Production function must remain extractable: ${name}`);
  const endPattern = new RegExp(`^${start[1]}}`, 'gm');
  endPattern.lastIndex = start.index;
  const end = endPattern.exec(source);
  assert.ok(end, `Production function must have a closing brace: ${name}`);
  return source.slice(start.index, end.index + end[0].length);
}

function composition() {
  const client = {
    nome:'Cliente 0000', empresa:'Empresa 0000', internalCode:'FAKE-CODE-0000',
    cnpj:'', ie:'FAKE-IE-0000', socioAdmin:'Cliente 0000', telefone:'', cidadeUf:'Cidade 0000/UF',
    segmentId:'transportadora', tier:'lead_ie', paymentMethod:'faturado', parcelasCount:6,
    precoPneu:1750, freteTexto:'Frete 0000', prazoEntrega:'Prazo 0000',
    billingMetadata:{ reference:'FAKE-BILLING-0000', instructions:['Campo 0000'] }
  };
  const vehicles = ['rodotrem_9eixos', 'toco_4x2'].map((vehicleTypeId, index) => ({
    id:`FAKE-VEH-000${index}`, name:`Veículo 000${index}`, clientId:'FAKE-LEAD-0000',
    vehicleTypeId, libras:120, includeDianteira:Boolean(index), qty:index + 2, collapsed:Boolean(index),
    items:[{ code:'EQ-120', qty:index ? 2 : 16, customPrice:index ? 33.5 : 0 },
      { code:'EQ-1145', qty:2, customPrice:null }],
    technicalContext:{
      id:`FAKE-TECH-000${index}`, leadId:'FAKE-LEAD-0000', selectedVehicleId:vehicleTypeId,
      answers:{ brand:'volvo', has_reduction:'nao', review:{ reference:`FAKE-RULE-000${index}` } },
      libras:120, includeDianteira:Boolean(index), targetVehicleName:`Veículo 000${index}`, qty:index + 2,
      notes:`Contexto 000${index}`, handoffId:`FAKE-VEH-000${index}`,
      manualItems:[{ code:'EQ-120', qty:index ? 2 : 16, customPrice:index ? 33.5 : 0 }],
      manualConfirmed:true, rule:{ id:`FAKE-RULE-000${index}`, vehicleTypeId },
      editingVehicleId:`FAKE-VEH-000${index}`, editingSnapshot:`FAKE-SIGNATURE-000${index}`
    }
  }));
  return {
    activePdfTemplate:'executivo_roi', activeWhatsappFormat:'padrao', client, vehicles,
    extraItems:[{ code:'EQ-120', qty:3, customPrice:0 }, { code:'EQ-1145', qty:4, customPrice:22.5 }]
  };
}

function syntheticState() {
  const quote = composition();
  const leads = Array.from({ length:434 }, (_, index) => {
    const number = String(index).padStart(4, '0');
    return { id:`FAKE-LEAD-${number}`, internalCode:`FAKE-CODE-${number}`,
      nome:`Cliente ${number}`, empresa:`Empresa ${number}`, cnpj:'', telefone:'',
      interactions:[], nextAction:'Ação 0000', notes:'CRM_ONLY_0000 '.repeat(180) };
  });
  const history = Array.from({ length:8 }, (_, index) => ({
    id:`FAKE-OLD-QUOTE-000${index}`, date:'2026-10-07T12:00:00.000Z',
    clientId:'FAKE-LEAD-0000', clientInternalCode:quote.client.internalCode,
    clientName:quote.client.nome, clientCompany:quote.client.empresa, totalValue:1234, totalPecas:24,
    // Legacy whole-state payloads must remain readable and unchanged.
    payload:{ ...plain(quote), leads:[{ id:'FAKE-LEGACY-LEAD-0000', nome:'Cliente 0000' }],
      history:[{ id:'FAKE-NESTED-QUOTE-0000', note:'LEGACY_HISTORY_ONLY_0000' }],
      operations:{ notes:'LEGACY_OPERATIONS_ONLY_0000' },
      callAI:{ notes:'LEGACY_CALL_AI_ONLY_0000' }, legacyNotes:'OLD_HISTORY_ONLY_0000 '.repeat(1600) }
  }));
  return { ...quote, leads, history, operations:{
    quotes:[], generatedDocuments:[],
    activityEvents:Array.from({ length:150 }, (_, index) => ({
      id:`FAKE-EVENT-${String(index).padStart(4, '0')}`, notes:'OPERATIONS_ONLY_0000 '.repeat(100)
    }))
  }, callAI:{ notes:'CALL_AI_ONLY_0000 '.repeat(6000) },
  consultant:{ notes:'CONSULTANT_ONLY_0000' }, selectedLeadId:'FAKE-LEAD-0000', lastQuoteData:null };
}

function runtime(source, requireSnapshot = true) {
  const state = syntheticState();
  const calls = { calculator:0, operations:0, sync:[], queue:[], proposal:[], notifications:[], tabs:[], hydrated:0, recalculated:0, storage:new Map() };
  const loadButtons = [];
  const container = {
    innerHTML:'', appendChild() {},
    querySelectorAll(selector) {
      if (selector !== '.btn-load-hist') return [];
      loadButtons.length = 0;
      return state.history.map((_, index) => ({
        getAttribute:() => String(index),
        addEventListener(event, callback) { assert.equal(event, 'click'); loadButtons[index] = callback; }
      }));
    }
  };
  const calculatorResult = { totalFinalVenda:12345.67, totalPecas:152,
    vehicles:plain(state.vehicles), extraItems:plain(state.extraItems), totalConjuntos:5 };
  let tick = 0;
  class SyntheticDate extends Date {
    constructor(...args) { super(...(args.length ? args : [Date.UTC(2026, 9, 8, 12) + tick++])); }
    static now() { return Date.UTC(2026, 9, 8, 12) + tick++; }
  }
  const proposal = { prepareTrackingDraft(operations, input) {
    assert.equal(input.quoteState, input.quote.payload, 'Proposal callback receives the native saved snapshot');
    assert.equal(input.clientId, 'FAKE-LEAD-0000');
    calls.proposal.push(input);
    return { ...operations, generatedDocuments:[...operations.generatedDocuments, {
      id:`FAKE-PROPOSAL-${String(calls.proposal.length).padStart(4, '0')}`,
      documentType:'proposal_tracking', quoteId:input.quote.id, clientId:input.clientId
    }] };
  } };
  const context = vm.createContext({
    state, Date:SyntheticDate, Buffer, serverRevision:7, workingQuoteDraftId:null, activeProposalContext:null,
    quoteClientDefaults:plain(composition().client),
    crypto:{ randomUUID:() => '00000000-0000-4000-8000-000000000000' },
    window:{ OG_PROPOSAL_INTELLIGENCE:proposal }, OG_PROPOSAL_INTELLIGENCE:proposal, OG_OPERATIONS_MODEL:{},
    OG_CRM_SERVICE:{ getLeadById:(rows, id) => rows.find(row => row.id === id) },
    OG_SYNC_BRIDGE:{ queueState(payload) { calls.queue.push(bytes(payload)); return Promise.resolve(); } },
    localStorage:{ setItem:(key, value) => calls.storage.set(key, value) },
    calculateCompleteQuote() { calls.calculator++; return plain(calculatorResult); },
    saveOperationsToStorage() { calls.operations++; }, saveLeadsToStorage() {},
    scheduleServerSync() { calls.sync.push(bytes(context.currentSyncPayload())); },
    showNotification(message, level) { calls.notifications.push({ message, level }); },
    renderProposalTrackingStatus() {}, proposalDraftSignature:() => 'FAKE-PROPOSAL-SIGNATURE-0000',
    formatMoney:value => String(value), escapeHtml:value => String(value),
    hydrateQuoteClientInputs() { calls.hydrated++; }, recalculateQuote() { calls.recalculated++; },
    switchTab(tab) { calls.tabs.push(tab); },
    document:{ getElementById:id => id === 'history-container' ? container : null, createElement:() => ({}) },
    console:{ error(error) { throw error; } }
  });
  const names = ['currentSyncPayload', 'findLeadForClientData', 'resolveHistoryLead',
    'persistVehicleComposition', 'saveQuoteToHistory', 'renderHistory'];
  if (requireSnapshot) names.push('captureQuoteCompositionSnapshot');
  vm.runInContext(`'use strict';\n${names.map(name => extractFunction(source, name)).join('\n')}\n${extractFunction(server, 'readBody')}`, context);
  return { state, calls, context, loadButtons, calculatorResult };
}

async function readTransport(context) {
  const buffer = Buffer.from(JSON.stringify(context.currentSyncPayload()), 'utf8');
  async function* request() { yield buffer; }
  return { size:buffer.length, parsed:await context.readBody(request()) };
}

function assertDetached(source, snapshot, path = 'snapshot') {
  if (!source || typeof source !== 'object') return;
  assert.notEqual(snapshot, source, `${path} must own a deep copy`);
  for (const key of Object.keys(source)) assertDetached(source[key], snapshot[key], `${path}.${key}`);
}

if (baselineMode) {
  const { state, context } = runtime(app, false);
  const initialSize = bytes(context.currentSyncPayload());
  assert.ok(initialSize < 5_000_000, 'Synthetic initial transport is within the actual server limit');
  const sizes = [];
  for (let index = 0; index < 6; index++) {
    const saved = context.saveQuoteToHistory({ totalFinalVenda:-1 });
    assert.equal(saved.payload.leads.length, 434, 'Authorized baseline captures the entire CRM');
    assert.equal(saved.payload.history.length, 8 + index, 'Authorized baseline nests all previous history');
    sizes.push(bytes(context.currentSyncPayload()));
    if (sizes.at(-1) > 5_000_000) break;
    await readTransport(context);
  }
  assert.ok(sizes.length > 1 && sizes.at(-1) > 5_000_000, 'Repeated real baseline saves exceed readBody transport limit');
  assert.ok(sizes.at(-1) > sizes.at(-2) * 1.8, 'Previous-history nesting reproduces exponential growth');
  await assert.rejects(() => readTransport(context), /Payload muito grande/);
  assert.ok(state.history.length < 50, 'The reproduction does not invoke normal history retention');
  console.log(`Quote snapshot baseline ${baselineRevision.slice(0, 7)}: reproduced readBody rejection after ${sizes.length} saves; bytes ${initialSize} -> ${sizes.join(' -> ')} (limit 5000000)`);
} else {
  const { state, calls, context, loadButtons, calculatorResult } = runtime(app);
  const expectedComposition = composition();
  const snapshot = context.captureQuoteCompositionSnapshot();
  assert.deepEqual(plain(snapshot), expectedComposition, 'Snapshot preserves exactly the full quote composition');
  assertDetached(state.client, snapshot.client, 'client');
  assertDetached(state.vehicles, snapshot.vehicles, 'vehicles');
  assertDetached(state.extraItems, snapshot.extraItems, 'extraItems');
  snapshot.client.billingMetadata.instructions[0] = 'Campo 0001';
  snapshot.vehicles[0].technicalContext.manualItems[0].qty = 99;
  snapshot.extraItems[0].customPrice = 99;
  assert.deepEqual(plain(state.client), expectedComposition.client);
  assert.deepEqual(plain(state.vehicles), expectedComposition.vehicles);
  assert.deepEqual(plain(state.extraItems), expectedComposition.extraItems);
  state.client.billingMetadata.instructions.push('Campo 0002');
  assert.equal(snapshot.client.billingMetadata.instructions.length, 1, 'Source edits cannot change an already captured snapshot');
  state.client = plain(expectedComposition.client);

  const oldHistory = state.history.slice();
  const oldHistoryJSON = oldHistory.map(row => JSON.stringify(row));
  const initialSize = bytes(context.currentSyncPayload());
  const sizes = [];
  const snapshots = [];
  const saves = 12;
  assert.ok(initialSize > 1_000_000 && initialSize < 5_000_000, 'Fixture has substantial existing CRM/history/operations within transport limit');
  for (let index = 0; index < saves; index++) {
    const saved = context.saveQuoteToHistory({ totalFinalVenda:-1, totalPecas:-1 });
    assert.equal(state.history[0], saved, 'Actual save inserts its native history row');
    assert.equal(saved.clientId, 'FAKE-LEAD-0000', 'Native history retains canonical clientId');
    assert.equal(saved.clientInternalCode, expectedComposition.client.internalCode);
    assert.equal(saved.totalValue, calculatorResult.totalFinalVenda, 'Save recalculates current totals instead of retaining stale export arguments');
    assert.equal(saved.totalPecas, calculatorResult.totalPecas);
    assert.deepEqual(plain(saved.payload), expectedComposition, 'Every saved row owns only the exact composition contract');
    assertDetached(state.client, saved.payload.client, 'saved.client');
    assertDetached(state.vehicles, saved.payload.vehicles, 'saved.vehicles');
    assertDetached(state.extraItems, saved.payload.extraItems, 'saved.extraItems');
    if (snapshots.length) assertDetached(snapshots.at(-1), saved.payload, 'successive snapshots');
    for (const forbidden of ['leads', 'history', 'operations', 'callAI', 'consultant', 'lastQuoteData', 'selectedLeadId']) {
      assert.equal(Object.hasOwn(saved.payload, forbidden), false, `${forbidden} is outside the quote snapshot`);
    }
    snapshots.push(saved.payload);
    const transport = await readTransport(context);
    sizes.push(transport.size);
    assert.ok(transport.size < 5_000_000, 'Each repeated save remains readable by the actual server body parser');
    assert.equal(transport.parsed.history[0].clientId, 'FAKE-LEAD-0000');
    assert.deepEqual(plain(transport.parsed.history[0].payload), expectedComposition, 'Server body parsing preserves the complete bounded snapshot');
    assert.equal(transport.parsed.leads.length, 434);
  }
  assert.equal(calls.calculator, saves);
  assert.equal(calls.proposal.length, saves);
  assert.equal(calls.sync.length, saves);
  assert.equal(calls.queue.length, saves);
  assert.ok([...calls.sync, ...calls.queue].every(size => size < 5_000_000), 'Native scheduled and durable sync callbacks receive bounded transport');
  assert.equal(calls.notifications.length, saves);
  assert.ok(calls.notifications.every(item => item.level === 'success'));
  assert.deepEqual(JSON.parse(calls.storage.get('og_cotacoes_history')), plain(state.history));
  assert.ok(sizes.at(-1) - initialSize < saves * (bytes(expectedComposition) + 2000), 'Transport grows by bounded new rows rather than copied CRM/history');
  assert.equal(state.history.length, oldHistory.length + saves);
  assert.ok(state.history.length < 50, 'Normal retention is not reached');
  oldHistory.forEach((row, index) => {
    assert.equal(state.history[saves + index], row, 'Existing history row identity is preserved');
    assert.equal(JSON.stringify(row), oldHistoryJSON[index], 'Existing legacy payload is never rewritten or trimmed');
  });

  const reopen = index => { context.renderHistory(); assert.equal(typeof loadButtons[index], 'function'); loadButtons[index](); };
  const savedJSON = JSON.stringify(state.history[0]);
  const leadsOwner = state.leads;
  const callOwner = state.callAI;
  const originalClient = state.history[0].payload.client;
  state.client = { nome:'Cliente 0001', empresa:'Empresa 0001' };
  state.vehicles = [];
  state.extraItems = [];
  reopen(0);
  assert.deepEqual(plain(state.client), expectedComposition.client, 'Actual reopen restores full saved client');
  assert.deepEqual(plain(state.vehicles), expectedComposition.vehicles, 'Actual reopen restores both stable rows, rules, manual review, quantities and custom prices');
  assert.deepEqual(plain(state.extraItems), expectedComposition.extraItems);
  assert.notEqual(state.client, originalClient);
  state.client.billingMetadata.instructions[0] = 'Campo 0003';
  state.vehicles[0].technicalContext.answers.review.reference = 'FAKE-RULE-0003';
  state.extraItems[0].qty = 99;
  assert.equal(JSON.stringify(state.history[0]), savedJSON, 'Editing a reopened quote cannot mutate its saved snapshot');
  reopen(saves);
  assert.deepEqual(plain(state.client), expectedComposition.client, 'Legacy whole-state history still reopens through existing client fields');
  assert.deepEqual(plain(state.vehicles), expectedComposition.vehicles);
  assert.deepEqual(plain(state.extraItems), expectedComposition.extraItems);
  assert.equal(state.leads, leadsOwner, 'Legacy reopen preserves the CRM owner');
  assert.equal(state.callAI, callOwner, 'Legacy reopen preserves the Call AI owner');
  assert.deepEqual(oldHistory.map(row => JSON.stringify(row)), oldHistoryJSON, 'Reopening legacy history preserves every original payload');
  assert.equal(calls.hydrated, 2);
  assert.equal(calls.recalculated, 2);
  assert.deepEqual(calls.tabs, ['cotacao', 'cotacao']);
  console.log(`Quote composition snapshot: PASS; 434 synthetic leads, ${saves} real saves, deep independent composition, unchanged legacy history/reopen; transport ${initialSize} -> ${sizes.at(-1)} bytes (limit 5000000)`);
}
