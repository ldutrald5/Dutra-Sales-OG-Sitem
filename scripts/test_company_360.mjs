import assert from 'node:assert/strict';
import company360 from '../apps/sistema-og/services/company-360-service.js';

const graph = {
  companies: [
    { id: 'C1', entityType: 'company', name: 'Transportes Dutra', legacyLeadId: 'L1' },
    { id: 'C2', entityType: 'company', name: 'Outra' }
  ],
  contacts: [
    { id: 'CT2', entityType: 'contact', companyId: 'C1', name: 'Bruno', isDecisionMaker: false },
    { id: 'CT1', entityType: 'contact', companyId: 'C1', name: 'Ana', isDecisionMaker: true },
    { id: 'LEGACY', companyId: 'C1', name: 'Contato legado sem contrato' },
    { id: 'CT3', entityType: 'contact', companyId: 'C2', name: 'Fora', isDecisionMaker: true }
  ],
  opportunities: [
    { id: 'O1', entityType: 'opportunity', companyId: 'C1', stage: 'open', valueCents: 100000, updatedAt: '2026-09-20T10:00:00Z' },
    { id: 'O2', entityType: 'opportunity', companyId: 'C1', stage: 'won', valueCents: 900000, updatedAt: '2026-09-21T10:00:00Z' },
    { id: 'O3', entityType: 'opportunity', companyId: 'C1', stage: 'proposal', valueCents: null, updatedAt: '2026-09-22T10:00:00Z' }
  ],
  activities: [
    { id: 'A1', entityType: 'activity', companyId: 'C1', type: 'call', occurredAt: '2026-09-22T10:00:00Z' },
    { id: 'A2', entityType: 'activity', companyId: 'C1', type: 'note', occurredAt: '2026-09-24T10:00:00Z' }
  ],
  tasks: [
    { id: 'T3', entityType: 'task', companyId: 'C1', title: 'Sem prazo', status: 'open', dueAt: null },
    { id: 'T2', entityType: 'task', companyId: 'C1', title: 'Feita', status: 'done', dueAt: '2026-09-25T10:00:00Z' },
    { id: 'T1', entityType: 'task', companyId: 'C1', title: 'Ligar', status: 'open', dueAt: '2026-09-26T10:00:00Z' }
  ]
};

const view = company360.buildCompany360(graph, 'C1');
assert.equal(view.company.name, 'Transportes Dutra');
assert.deepEqual(view.contacts.map(item => item.id), ['CT1', 'CT2']);
assert.deepEqual(view.decisionMakers.map(item => item.id), ['CT1']);
assert.deepEqual(view.opportunities.map(item => item.id), ['O3', 'O2', 'O1']);
assert.deepEqual(view.openOpportunities.map(item => item.id), ['O3', 'O1']);
assert.equal(view.summary.pipelineValueCents, 100000);
assert.equal(view.summary.lastActivityAt, '2026-09-24T10:00:00Z');
assert.equal(view.summary.nextTaskAt, '2026-09-26T10:00:00Z');
assert.deepEqual(view.openTasks.map(item => item.id), ['T1', 'T3']);
assert.equal(Object.isFrozen(view), true);
assert.equal(Object.isFrozen(view.contacts), true);

assert.equal(company360.buildCompany360(graph, 'missing'), null);
assert.throws(() => company360.buildCompany360(graph, ''), /companyId é obrigatório/);
assert.deepEqual(company360.listCompanies360(graph).map(item => item.company.id), ['C1', 'C2']);

const legacyOnly = { companies: [], contacts: [{ id: 'OLD', name: 'Não converter' }], opportunities: [], activities: [], tasks: [] };
assert.deepEqual(company360.listCompanies360(legacyOnly), []);

console.log('Company 360 read model test: PASS');
