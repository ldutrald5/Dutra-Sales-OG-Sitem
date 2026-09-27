import assert from 'node:assert/strict';
import domain from '../apps/sistema-og/domain/canonical-domain.js';
import operationsModel from '../apps/sistema-og/operations-model.js';

const now = '2026-09-26T12:00:00.000Z';
const company = domain.createCompany({ id: 'COMP-1', name: 'Transportadora Exemplo', legacyLeadId: 'LEAD-1', cnpj: '12.345.678/0001-90' }, { now });
const contact = domain.createContact({ id: 'CONT-1', companyId: company.id, name: 'João', phone: '(44) 99999-0000', isDecisionMaker: true }, { now });
const opportunity = domain.createOpportunity({ id: 'OPP-1', companyId: company.id, title: 'Frota principal', valueCents: 150000 }, { now });
const activity = domain.createActivity({ id: 'ACT-1', companyId: company.id, contactId: contact.id, opportunityId: opportunity.id, type: 'call', summary: 'Diagnóstico' }, { now });
const task = domain.createTask({ id: 'TASK-1', companyId: company.id, opportunityId: opportunity.id, title: 'Retornar proposta', dueAt: '2026-09-27T15:00:00-03:00' }, { now });

assert.equal(company.legacyLeadId, 'LEAD-1');
assert.equal(company.cnpj, '12345678000190');
assert.equal(contact.phone, '44999990000');
assert.equal(opportunity.valueCents, 150000);
assert.equal(activity.occurredAt, now);
assert.equal(task.dueAt, '2026-09-27T18:00:00.000Z');

const graph = { ...domain.createEmptyGraph(), companies: [company], contacts: [contact], opportunities: [opportunity], activities: [activity], tasks: [task] };
assert.deepEqual(domain.validateGraph(graph), { valid: true, errors: [] });

const orphan = { ...graph, contacts: [{ ...contact, id: 'CONT-2', companyId: 'MISSING' }] };
assert.equal(domain.validateGraph(orphan).valid, false);
assert.match(domain.validateGraph(orphan).errors.join('\n'), /companyId inexistente/);

const orphanContactActivity = { ...graph, activities: [{ ...activity, id: 'ACT-2', contactId: 'MISSING' }] };
assert.equal(domain.validateGraph(orphanContactActivity).valid, false);
assert.match(domain.validateGraph(orphanContactActivity).errors.join('\n'), /contactId inexistente/);

assert.throws(() => domain.createCompany({ id: 'COMP-X' }, { now }), /name/);
assert.throws(() => domain.createContact({ id: 'CONT-X', name: 'Sem empresa' }, { now }), /companyId/);
assert.throws(() => domain.createOpportunity({ id: 'OPP-X' }, { now }), /companyId/);
assert.throws(() => domain.createTask({ id: 'TASK-X', companyId: 'COMP-1' }, { now }), /title/);

const operationsV2 = operationsModel.migrateOperations({
  schemaVersion: 1,
  contacts: [{ id: 'LEGACY-CONT-1', name: 'Contato legado sem companyId' }],
  activityEvents: [{ id: 'LEGACY-EVT-1', type: 'legacy', at: now }]
}, { now });
assert.equal(operationsV2.schemaVersion, 2);
assert.equal(operationsV2.contacts.length, 1, 'Coleção contacts legada deve continuar intacta');
assert.deepEqual(operationsV2.companies, [], '01R não deve migrar leads automaticamente');
assert.deepEqual(operationsV2.opportunities, []);
assert.deepEqual(operationsV2.activities, []);
assert.deepEqual(operationsV2.tasks, []);

const canonicalGraph = {
  schemaVersion: domain.SCHEMA_VERSION,
  companies: [company],
  contacts: [contact],
  opportunities: [opportunity],
  activities: [activity],
  tasks: [task]
};
assert.equal(domain.validateGraph(canonicalGraph).valid, true);

const mixedContactGraph = { ...canonicalGraph, contacts: [{ id: 'LEGACY-CONT-2', name: 'Legado preservado' }, contact] };
assert.equal(domain.validateGraph(mixedContactGraph).valid, true, 'Contato legado sem entityType não deve bloquear escrita canônica');
const explicitWrongTypeGraph = { ...canonicalGraph, contacts: [{ id: 'WRONG-TYPE', entityType: 'company', name: 'Inválido' }] };
assert.equal(domain.validateGraph(explicitWrongTypeGraph).valid, false, 'entityType explícito incorreto continua inválido');

console.log('Canonical domain contract test: PASS');
