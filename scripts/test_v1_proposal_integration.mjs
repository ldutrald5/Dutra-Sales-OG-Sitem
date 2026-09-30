import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('preview-v2/proposal-entry-v3.js','utf8');
const handoff=fs.readFileSync('preview-v2/quote-handoff-v3.js','utf8');
const technical=fs.readFileSync('preview-v2/technical-center-v3.js','utf8');

assert.doesNotThrow(()=>new Function(ui),'editor de proposta deve possuir JavaScript válido');
assert.match(ui,/EDITOR V1 INTEGRADO/,'proposta deve abrir editor nativo da V1');
assert.match(ui,/prepareTrackingDraft/,'editor deve persistir pelo serviço oficial de propostas');
assert.match(ui,/core\(\)\.commit/,'rascunho deve usar persistência e fila offline centrais');
assert.match(ui,/SAVE_PROPOSAL_DRAFT/,'mutation deve ser tipada e idempotente');
assert.match(ui,/data-pe-qty/,'quantidade deve permanecer editável');
assert.match(ui,/data-pe-price/,'preço deve permanecer editável');
assert.match(ui,/data-pe-remove/,'item deve poder ser removido');
assert.match(ui,/DRAFT · ainda não enviado/,'salvar rascunho não pode simular envio');
assert.match(ui,/launchLegacy/,'fallback legado deve permanecer disponível durante migração');
assert.doesNotMatch(ui,/iframe class="peWorkspaceFrame"/,'fluxo principal não deve depender do iframe legado');
assert.match(handoff,/technical:tech/,'handoff deve transportar a aplicação técnica');
assert.match(technical,/DUTRA_QUOTE_HANDOFF/,'carrinho técnico deve entrar no contrato da proposta');

console.log('V1 proposal integration tests: PASS');
