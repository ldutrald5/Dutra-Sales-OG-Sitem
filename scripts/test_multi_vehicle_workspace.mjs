import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

// Synthetic fixtures execute the mature engine and quotation calculator directly.
// No server, browser, persisted CRM, or replacement pricing implementation is used.
const app = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const dataContext = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../apps/sistema-og/data.js', import.meta.url), 'utf8'), dataContext);
const data = JSON.parse(vm.runInContext('JSON.stringify(OG_DATA)', dataContext));

function section(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `Production functions must remain extractable: ${startMarker}`);
  return app.slice(start, end);
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: expected ${expected}, received ${actual}`);
}

const constants = ['TIRE_BASE_LIFE_MONTHS', 'TIRE_LIFE_GAIN_RATE'].map(name => {
  const match = app.match(new RegExp(`  const ${name} = [^;]+;`));
  assert.ok(match, `Production constant must remain extractable: ${name}`);
  return match[0];
}).join('\n');
const context = vm.createContext({ OG_DATA: freeze(data), state: null, crypto: { randomUUID } });
vm.runInContext(`'use strict';\n${constants}\n${[
  section('  function resolveVehicleSupports(', '  function renderConsultantEngine('),
  section('  function quoteVehicleSignature(', '  function hydrateQuoteClientInputs('),
  section('  function resolveItemPrice(', '  function initQuoteImport('),
  section('  function calculateCompleteQuote(', '  function recalculateQuote(')
].join('\n')}`, context);

const rodAnswers = freeze({ brand: 'volvo', has_reduction: 'nao' });
const tocoAnswers = freeze({ brand: 'volvo' });
const rod = context.buildConsolidatedVehiclePieces('rodotrem_9eixos', rodAnswers, 120, false);
const toco = context.buildConsolidatedVehiclePieces('toco_4x2', tocoAnswers, 120, false);
const quantities = items => Object.fromEntries(items.map(item => [item.code, item.qty]));
assert.deepEqual(quantities(rod.resultList), {
  'EQ-120': 16, 'EQ-1145': 4, 'EQ-1040': 16, 'EQ-1043': 16, 'EQ-1135': 12
}, 'Rodotrem composition is per vehicle, before its fleet multiplier');
assert.deepEqual(quantities(toco.resultList), {
  'EQ-120': 2, 'EQ-1145': 2, 'EQ-1040': 2, 'EQ-1043': 2
}, 'Toco composition is per vehicle, before its fleet multiplier');
assert.equal(rod.resolution.suporteTracao.code, 'EQ-1145');
assert.equal(rod.resolution.suporteCarreta.code, 'EQ-1135');
assert.deepEqual(rodAnswers, { brand: 'volvo', has_reduction: 'nao' });
assert.deepEqual(tocoAnswers, { brand: 'volvo' });

const fleet = [
  {
    id: 'qa_rodotrem_stable', name: 'QA Rodotrem Volvo', vehicleTypeId: 'rodotrem_9eixos',
    libras: 120, includeDianteira: false, qty: 2, collapsed: false,
    technicalContext: { answers: { ...rodAnswers }, notes: 'Synthetic Rodotrem context' },
    items: JSON.parse(JSON.stringify(rod.resultList))
  },
  {
    id: 'qa_toco_stable', name: 'QA Toco Volvo', vehicleTypeId: 'toco_4x2',
    libras: 120, includeDianteira: false, qty: 3, collapsed: true,
    technicalContext: { answers: { ...tocoAnswers }, notes: 'Synthetic Toco context' },
    items: JSON.parse(JSON.stringify(toco.resultList))
  }
];

function calculate({ vehicles = fleet, extraItems = [], client = {} } = {}) {
  const source = freeze(structuredClone({
    vehicles, extraItems,
    client: { tier: 'lead_ie', paymentMethod: 'faturado', parcelasCount: 6, precoPneu: 1750, ...client }
  }));
  const before = JSON.stringify(source);
  context.state = source;
  const result = context.calculateCompleteQuote();
  assert.equal(JSON.stringify(source), before, 'Calculation must preserve every source item, context, and ID');
  assert.notEqual(result.vehicles, source.vehicles);
  result.vehicles.forEach((vehicle, index) => {
    assert.equal(vehicle.id, source.vehicles[index].id, 'Calculation preserves stable vehicle identity');
    assert.notEqual(vehicle.calculatedItems, source.vehicles[index].items);
  });
  return result;
}

const quote = calculate();
const consolidated = {};
for (const vehicle of quote.vehicles) {
  for (const item of vehicle.calculatedItems) {
    consolidated[item.code] = (consolidated[item.code] || 0) + item.qty * vehicle.qty;
  }
}
assert.deepEqual(consolidated, {
  'EQ-120': 38, 'EQ-1145': 14, 'EQ-1040': 38, 'EQ-1043': 38, 'EQ-1135': 24
});
assert.equal(quote.totalPecas, 152);
assert.equal(quote.totalEqualizadores, 38);
assert.equal(quote.totalPneus, 76);
assert.equal(quote.totalConjuntos, 5);
assert.equal(quote.vehicles[0].calculatedItems.find(item => item.code === 'EQ-120').qty, 16);
assert.equal(quote.vehicles[1].calculatedItems.find(item => item.code === 'EQ-120').qty, 2);
assert.equal(quote.vehicles[0].totalPecas, 128);
assert.equal(quote.vehicles[1].totalPecas, 24);
assert.equal(quote.vehicles[0].unitSubtotal, 4720);
assert.equal(quote.vehicles[0].totalSubtotal, 9440);
assert.equal(quote.vehicles[1].unitSubtotal, 590);
assert.equal(quote.vehicles[1].totalSubtotal, 1770);
assert.equal(quote.subtotalProdutos, 11210);
assert.equal(quote.totalFinalVenda, 11210, 'Principal total does not receive the comparative cash discount');
assert.equal(quote.taxaCartaoValor, 0);
close(quote.valorAVistaDesconto, 10873.7, 'Cash companion uses 0.97');
close(quote.valorParcela, 11210 / 6, 'Installments divide the principal total');
close(quote.valorParcela2x, 11210 / 2, 'Two installment companion');
close(quote.valorParcela3x, 11210 / 3, 'Three installment companion');
const originalState = context.state;
const originalStateSnapshot = JSON.stringify(originalState);
assert.deepEqual(JSON.parse(JSON.stringify(context.calculateCompleteQuote())), JSON.parse(JSON.stringify(quote)),
  'Repeated calculation cannot multiply or append the collection again');
assert.equal(context.state, originalState, 'Repeated calculation keeps the same source state object');
assert.equal(JSON.stringify(originalState), originalStateSnapshot);

const oneEach = calculate({ vehicles: fleet.map(vehicle => ({ ...vehicle, qty: 1 })) });
assert.equal(oneEach.totalPecas, 72);
assert.equal(oneEach.totalEqualizadores, 18);
assert.equal(oneEach.totalPneus, 36);
assert.equal(oneEach.totalConjuntos, 2);
assert.equal(oneEach.totalFinalVenda, 5310);
const extraToco = calculate({ vehicles: fleet.map(vehicle => ({ ...vehicle, qty: vehicle.qty + (vehicle.id === 'qa_toco_stable' ? 1 : 0) })) });
assert.equal(extraToco.totalPecas, 160);
assert.equal(extraToco.totalEqualizadores, 40);
assert.equal(extraToco.totalConjuntos, 6);
assert.equal(extraToco.totalFinalVenda, 11800, 'One additional Toco contributes its per-vehicle R$ 590 once');
assert.equal(extraToco.vehicles[0].totalSubtotal, quote.vehicles[0].totalSubtotal,
  'Changing one vehicle multiplier preserves its sibling subtotal');
const withExtras = calculate({ extraItems: [{ code: 'EQ-120', qty: 2, customPrice: 33.5 }] });
assert.equal(withExtras.extraSubtotal, 67);
assert.equal(withExtras.totalFinalVenda, 11277, 'Extra items contribute once without any vehicle multiplier');
assert.equal(withExtras.totalPecas, 154);
assert.equal(withExtras.totalEqualizadores, 40);
assert.equal(withExtras.totalPneus, 80);
assert.equal(withExtras.totalConjuntos, 5);
assert.equal(withExtras.vehicles[0].totalSubtotal, 9440);
assert.equal(withExtras.vehicles[1].totalSubtotal, 1770);

const cloneSource = structuredClone(fleet[0]);
Object.assign(cloneSource.technicalContext, {
  id: 'QA-TECH-DRAFT-original', handoffId: cloneSource.id, targetVehicleName: cloneSource.name,
  manualItems: structuredClone(cloneSource.items), manualConfirmed: true,
  editingVehicleId: cloneSource.id, editingSnapshot: context.quoteVehicleSignature(cloneSource)
});
freeze(cloneSource);
const cloneSnapshot = JSON.stringify(cloneSource);
const duplicateA = context.duplicateQuoteVehicle(cloneSource);
const duplicateB = context.duplicateQuoteVehicle(cloneSource);
assert.equal(JSON.stringify(cloneSource), cloneSnapshot, 'Duplication preserves its frozen source');
assert.notEqual(duplicateA.id, cloneSource.id);
assert.notEqual(duplicateB.id, cloneSource.id);
assert.notEqual(duplicateA.id, duplicateB.id, 'Successive duplicates own distinct stable vehicle IDs');
for (const duplicate of [duplicateA, duplicateB]) {
  assert.notEqual(duplicate.technicalContext.id, cloneSource.technicalContext.id);
  assert.equal(duplicate.technicalContext.handoffId, duplicate.id);
  assert.equal(duplicate.technicalContext.targetVehicleName, duplicate.name);
  assert.equal(duplicate.collapsed, false);
  assert.ok(!Object.hasOwn(duplicate.technicalContext, 'editingVehicleId'));
  assert.ok(!Object.hasOwn(duplicate.technicalContext, 'editingSnapshot'));
  assert.notEqual(duplicate.items, cloneSource.items);
  assert.notEqual(duplicate.items[0], cloneSource.items[0]);
  assert.notEqual(duplicate.technicalContext.answers, cloneSource.technicalContext.answers);
  assert.notEqual(duplicate.technicalContext.manualItems, cloneSource.technicalContext.manualItems);
  assert.deepEqual(JSON.parse(JSON.stringify(duplicate.items)), cloneSource.items);
}
assert.notEqual(duplicateA.technicalContext.id, duplicateB.technicalContext.id);
assert.equal(context.quoteVehicleSignature(cloneSource), context.quoteVehicleSignature(structuredClone(cloneSource)),
  'Vehicle signature follows content rather than object identity');
const signatureSource = structuredClone(cloneSource);
const contextSignature = context.quoteVehicleSignature(signatureSource);
signatureSource.technicalContext.notes = 'Context-only note changed while quote items stay unchanged';
assert.notEqual(context.quoteVehicleSignature(signatureSource), contextSignature,
  'A context-only notes change invalidates the captured vehicle signature');
signatureSource.technicalContext.notes = cloneSource.technicalContext.notes;
signatureSource.technicalContext.answers.brand = 'scania';
assert.notEqual(context.quoteVehicleSignature(signatureSource), contextSignature,
  'A context-only answers change invalidates the captured vehicle signature');
signatureSource.technicalContext.answers.brand = cloneSource.technicalContext.answers.brand;
assert.equal(context.quoteVehicleSignature(signatureSource), contextSignature);
signatureSource.technicalContext.editingSnapshot = 'Different captured metadata';
assert.equal(context.quoteVehicleSignature(signatureSource), contextSignature,
  'Editing snapshot metadata is excluded from the content signature');
for (let capture = 0; capture < 3; capture++) {
  signatureSource.technicalContext.editingSnapshot = context.quoteVehicleSignature(signatureSource);
  assert.equal(context.quoteVehicleSignature(signatureSource), contextSignature,
    'Repeated snapshot capture cannot recursively include or grow its own signature');
}
duplicateA.technicalContext.answers.brand = 'scania';
duplicateA.technicalContext.notes = 'Independent synthetic edit';
duplicateA.technicalContext.manualItems[0].qty = 9;
duplicateA.items[0].qty = 1;
duplicateA.items[0].customPrice = 0;
assert.equal(cloneSource.technicalContext.answers.brand, 'volvo');
assert.equal(duplicateB.technicalContext.answers.brand, 'volvo');
assert.equal(duplicateB.technicalContext.manualItems[0].qty, 16);
assert.equal(duplicateB.items[0].qty, 16);
assert.equal(duplicateB.items[0].customPrice, null);
assert.equal(JSON.stringify(cloneSource), cloneSnapshot, 'Editing a duplicate leaves every source field unchanged');
const signatureBefore = context.quoteVehicleSignature(duplicateB);
duplicateB.qty = 3;
assert.notEqual(context.quoteVehicleSignature(duplicateB), signatureBefore, 'Content changes invalidate the captured signature');
const duplicatedQuote = calculate({ vehicles: [cloneSource, duplicateB] });
assert.equal(duplicatedQuote.totalConjuntos, 5);
assert.equal(duplicatedQuote.totalPecas, 320);
assert.equal(duplicatedQuote.totalEqualizadores, 80);
assert.equal(duplicatedQuote.totalPneus, 160);
assert.equal(duplicatedQuote.totalFinalVenda, 23600);
assert.equal(duplicatedQuote.vehicles[0].id, cloneSource.id);
assert.equal(duplicatedQuote.vehicles[1].id, duplicateB.id);

const card = calculate({ client: { paymentMethod: 'cartao' } });
assert.equal(card.subtotalProdutos, 11210);
close(card.taxaCartaoValor, 1345.2, 'Card surcharge is twelve percent');
close(card.totalFinalVenda, 12555.2, 'Canonical card total');
close(card.valorParcela, 12555.2 / 6, 'Card installment division');
assert.equal(card.valorParcela.toFixed(2), '2092.53');
close(card.valorAVistaDesconto, 12555.2 * 0.97, 'Card cash companion follows the mature calculator');
const threeInstallments = calculate({ client: { parcelasCount: 3 } });
assert.equal(threeInstallments.totalFinalVenda, 11210);
assert.equal(threeInstallments.parcelas, 3);
close(threeInstallments.valorParcela, 11210 / 3, 'Changing installment count cannot change principal');
const revenda = calculate({ client: { tier: 'revenda' } });
assert.equal(revenda.totalFinalVenda, 9006);
assert.equal(revenda.totalPecas, 152);
assert.equal(revenda.vehicles[0].calculatedItems.find(item => item.code === 'EQ-120').priceUnit, 157);
assert.equal(revenda.vehicles[0].calculatedItems.find(item => item.code === 'EQ-1145').priceUnit, 20);

context.state = freeze({ client: { tier: 'lead_ie' } });
const zeroPrice = context.resolveItemPrice('EQ-120', 0);
assert.equal(zeroPrice.standardPrice, 213);
assert.equal(zeroPrice.finalUnitPrice, 0, 'Explicit zero cannot fall back to catalog price');
assert.equal(zeroPrice.isCustomPrice, true);
const overridePrice = context.resolveItemPrice('EQ-1145', 33.5);
assert.equal(overridePrice.standardPrice, 22);
assert.equal(overridePrice.finalUnitPrice, 33.5);
assert.equal(overridePrice.isCustomPrice, true);
for (const absentPrice of [undefined, null, NaN]) {
  assert.equal(context.resolveItemPrice('EQ-120', absentPrice).finalUnitPrice, 213);
}
assert.equal(context.resolveItemPrice('EQ-120', 213).isCustomPrice, false);
const overrides = structuredClone(fleet);
overrides[0].items.find(item => item.code === 'EQ-120').customPrice = 0;
overrides[1].items.find(item => item.code === 'EQ-1145').customPrice = 33.5;
const overridden = calculate({ vehicles: overrides, extraItems: [{ code: 'EQ-120', qty: 2, customPrice: 0 }] });
assert.equal(overridden.totalFinalVenda, 4463, 'Zero and explicit override apply per vehicle before its multiplier');
assert.equal(overridden.totalPecas, 154);
assert.equal(overridden.totalEqualizadores, 40);
assert.equal(overridden.totalPneus, 80);
assert.equal(overridden.extraSubtotal, 0);
assert.equal(overridden.extraItems[0].priceUnit, 0);
assert.equal(overridden.extraItems[0].isCustomPrice, true);
assert.equal(quote.totalFinalVenda, 11210, 'An independent override fixture leaves the original calculation unchanged');

console.log('Multi-vehicle mature engine, per-vehicle quantities, stable IDs, independent clones, finance, overrides, and source immutability: PASS');
