import assert from 'node:assert/strict';
import domain from '../apps/sistema-og/domain/canonical-domain.js';
import editor from '../apps/sistema-og/services/canonical-editor-service.js';

const now = '2026-09-26T12:00:00Z';
const empty = domain.createEmptyGraph();
const created = editor.saveCompany(empty, { id: 'C1', name: 'Dutra Transportes', legacyLeadId: 'L1', cnpj: '12.345.678/0001-90' }, { domain, now });
assert.equal(created.company.cnpj, '12345678000190');
assert.equal(created.company.legacyLeadId, 'L1');
assert.equal(created.graph.companies.length, 1);
assert.equal(empty.companies.length, 0, 'Editor não deve mutar o grafo de entrada');

const updated = editor.saveCompany(created.graph, { id: 'C1', name: 'Dutra Transportes SA', legacyLeadId: 'L1' }, { domain, now: '2026-09-27T12:00:00Z' });
assert.equal(updated.company.name, 'Dutra Transportes SA');
assert.equal(updated.graph.companies.length, 1);

assert.equal(updated.company.createdAt, new Date(now).toISOString(), 'createdAt original deve ser preservado');
assert.equal(updated.company.updatedAt, '2026-09-27T12:00:00.000Z', 'updatedAt deve avançar na edição');

const mixedLegacy = { ...updated.graph, contacts: [{ id: 'LEGACY-CONT-1', name: 'Contato legado sem entityType/companyId' }] };
const mixedSaved = editor.saveCompany(mixedLegacy, { id: 'C1', name: 'Dutra Transportes Compatível', legacyLeadId: 'L1' }, { domain, now });
assert.equal(mixedSaved.graph.contacts.length, 1, 'Contato legado deve ser preservado');
assert.equal(mixedSaved.graph.contacts[0].id, 'LEGACY-CONT-1');

const wrongTypedContact = { ...updated.graph, contacts: [{ id: 'BROKEN', entityType: 'company', name: 'Tipo explícito incorreto' }] };
assert.throws(() => editor.saveCompany(wrongTypedContact, { id: 'C1', name: 'Não deve salvar', legacyLeadId: 'L1' }, { domain, now }), /entityType inválido/);


assert.throws(() => editor.saveCompany(updated.graph, { id: 'C2', name: 'Duplicada', legacyLeadId: 'L1' }, { domain, now }), /já vinculado/);

const contact = editor.saveContact(updated.graph, { id: 'CT1', companyId: 'C1', name: 'Ana', role: 'Compras', phone: '(44) 99999-0000', email: 'ANA@EXAMPLE.COM', isDecisionMaker: true }, { domain, now });
assert.equal(contact.contact.phone, '44999990000');
assert.equal(contact.contact.email, 'ana@example.com');
assert.equal(contact.contact.isDecisionMaker, true);

const editedContact = editor.saveContact(contact.graph, { id: 'CT1', companyId: 'C1', name: 'Ana Silva', role: 'Diretora' }, { domain, now });
assert.equal(editedContact.graph.contacts.length, 1);
assert.equal(editedContact.contact.name, 'Ana Silva');

assert.throws(() => editor.saveContact(contact.graph, { id: 'CT2', companyId: 'MISSING', name: 'Órfão' }, { domain, now }), /companyId inexistente/);

console.log('Canonical editor service test: PASS');
