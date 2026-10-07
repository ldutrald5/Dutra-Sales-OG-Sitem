import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('../apps/sistema-og/assets/vendor/xlsx.full.min.js');
const spreadsheet = require('../apps/sistema-og/services/spreadsheet-import-service.js');
const crm = require('../apps/sistema-og/services/crm-service.js');
const safety = require('../apps/sistema-og/services/data-safety-service.js');
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clean = value => String(value ?? '').trim();
const clone = value => JSON.parse(JSON.stringify(value));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const comparable = value => spreadsheet.norm(value).replace(/\s/g, '');
const empty = value => value == null || value === '' || (Array.isArray(value) && value.length === 0);

// ODS is transport only. The bundled reader and existing spreadsheet/CRM owners
// remain responsible for parsing, normalization, matching and applying fields.
export function readPilotWorkbook(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.length > spreadsheet.IMPORT_LIMITS.maxFileBytes) throw new Error('Pilot workbook exceeds the existing 5 MB limit.');
  const parsed = XLSX.read(bytes, { type: 'buffer', cellDates: true, cellFormula: false, cellStyles: false, sheetRows: 5001 });
  const workbook = { SheetNames: [], sheets: {} };
  for (const original of parsed.SheetNames) {
    const name = original.replace(/_(HOJE|CRM|LISTA|CONTATOS)$/, ' $1');
    const grid = XLSX.utils.sheet_to_json(parsed.Sheets[original], { header: 1, raw: true, defval: '', blankrows: true });
    workbook.SheetNames.push(name);
    // Spreadsheet dates are calendar/wall-clock values, without a timezone.
    // Do not turn a follow-up on a given day into the previous day in Brazil.
    workbook.sheets[name] = grid.map(row => row.map(value => value instanceof Date ? value.toISOString().slice(0, 19) : clean(value)));
  }
  spreadsheet.validateSanitizedWorkbook(workbook);
  return { workbook, fingerprint: hash(bytes) };
}

function tabularRows(workbook, sheet, overrides = {}) {
  const grid = workbook.sheets[sheet] || [];
  const headerRow = grid.findIndex(row => row.some(value => /^(empresa \/ nome|raz[aã]o social|raz[aã]o social \/ nome)$/i.test(clean(value))));
  if (headerRow < 0) return [];
  const mapping = { ...spreadsheet.suggestMapping(grid[headerRow]), ...overrides };
  return spreadsheet.rowsFromSource(workbook, { sheetName: sheet, headerRow, mapping }).map(row => ({ ...row, company: row.company || row.primaryContact }));
}

function withSource(rows, kind, sheet, fingerprint, workbook) {
  return rows.map(row => ({ ...row, _source: { kind, sheet, row: row.sourceRow, fingerprint, values: clone(workbook.sheets[sheet]?.[row.sourceRow - 1] || []) } }));
}

function rowStats(rows) {
  const valid = rows.filter(row => clean(row.company || row.primaryContact));
  return {
    totalRows: rows.length, validRows: valid.length, invalidRows: rows.length - valid.length,
    rowsWithCnpj: valid.filter(row => spreadsheet.digits(row.document).length === 14).length,
    rowsWithPhone: valid.filter(row => spreadsheet.digits(row.phone)).length,
    rowsWithEmail: valid.filter(row => clean(row.email)).length,
    rowsWithCity: valid.filter(row => clean(row.city)).length,
    rowsWithStatus: valid.filter(row => clean(row.status)).length
  };
}

function canonicalSourceLabels(row) {
  // Input labels are translated into the existing canonical enums, never scored.
  // An explicit source status wins over an inference from historical notes.
  const key = spreadsheet.norm(row.status);
  const labels = {
    'em conversa': ['contatado', 'talked'], interessado: ['contatado', 'interested'],
    'aguardando retorno': ['contatado', 'waiting_response'], cliente: ['fechado', 'customer'],
    'cliente fidelizado': ['fechado', 'loyal_customer'], 'nao tem interesse': ['perdido', 'not_interested'],
    negociacao: ['negociacao', 'negotiation'], 'nao abordado': ['novo', 'first_contact']
  };
  const [status, conversationStage] = labels[key] || [row.status, row.conversationStage];
  return { ...row, status, conversationStage };
}

function stableId(row) {
  const identity = clean(row.externalCode) || spreadsheet.digits(row.document) || spreadsheet.digits(row.phone) || clean(row.email).toLowerCase() || comparable(row.company);
  return `PILOT-ODS-${hash(`${row._source.kind}|${identity}|${comparable(row.company)}`).slice(0, 24).toUpperCase()}`;
}

function proposedLead(row, now) {
  const normalizedRow = canonicalSourceLabels(row);
  const preview = spreadsheet.preview([normalizedRow], []);
  const result = spreadsheet.applyPreview(preview, [], { [row.sourceRow]: { action: 'create' } }, { now, idFactory: () => stableId(row) });
  return crm.normalizeLead(result.leads[0]);
}

function matches(row, leads, now) {
  const proposed = proposedLead(row, now);
  const combined = new Map(crm.findPossibleDuplicates(leads, proposed).map(lead => [String(lead.id), lead]));
  for (const item of spreadsheet.candidateMatches(row, leads)) combined.set(String(item.leadId), item.lead);
  return { proposed, candidates: [...combined.values()] };
}

function sameCompany(row, lead) {
  return Boolean(comparable(row.company) && [lead.empresa || lead.nome, lead.importMeta?.legalName].some(value => comparable(value) === comparable(row.company)));
}

function verifiedMatch(row, lead) {
  const reasons = spreadsheet.candidateMatches(row, [lead])[0]?.reasons || [];
  if (lead.id === stableId(row)) return true;
  // Name matching is the existing CRM comparison, accepted only when unique.
  // Code/phone-only mismatches from different exports stay in private review.
  if (sameCompany(row, lead)) return true;
  return reasons.includes('CNPJ/CPF') || reasons.includes('E-mail') || (reasons.includes('Telefone') && reasons.includes('Código OG'));
}

function sourceMeta(lead, row) {
  const meta = lead.importMeta && typeof lead.importMeta === 'object' ? clone(lead.importMeta) : {};
  const sources = Array.isArray(meta.pilotSources) ? meta.pilotSources : [];
  const sourceKey = item => [item.kind, item.sheet, item.row, item.fingerprint].join('|');
  if (!sources.some(item => sourceKey(item) === sourceKey(row._source))) sources.push(clone(row._source));
  return { ...meta, pilotReal: true, pilotSources: sources, originalStatus: meta.originalStatus || row.status || '', legalName: meta.legalName || row.legalName || '' };
}

function fillMissing(lead, row, now) {
  const normalizedRow = canonicalSourceLabels(row);
  const item = spreadsheet.preview([normalizedRow], [lead])[0];
  const changes = spreadsheet.FIELD_DEFS.map(def => ({ field: def.key, current: def.current(lead), incoming: def.incoming(normalizedRow), protected: Boolean(def.protected) }))
    .filter(change => !empty(change.incoming) && empty(change.current));
  const fields = Object.fromEntries(spreadsheet.FIELD_DEFS.map(def => [def.key, 'keep']));
  for (const change of changes) fields[change.field] = 'excel';
  const updated = changes.length ? spreadsheet.applyPreview([{ ...item, changes }], [lead], { [row.sourceRow]: { action: 'update', targetLeadId: lead.id, fields } }, { now }).leads[0] : clone(lead);
  // Leave existing identity, interactions, opportunities, manual values and tasks
  // byte-for-byte intact. No broad re-normalization of a user's existing record.
  if (empty(updated.lastContactAt) && clean(row.lastInteraction)) updated.lastContactAt = clean(row.lastInteraction);
  updated.importMeta = sourceMeta(updated, row);
  return updated;
}

function privateReview(row, reason, candidates = []) {
  return { reason, source: clone(row._source), row: clone(row), candidateIds: candidates.map(lead => lead.id) };
}

export function preparePilotImport({ backup, ods, xlsx, fingerprints = {}, now = backup.createdAt || '2026-10-07T00:00:00.000Z' }) {
  const validation = safety.validateBackup(backup);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  const originalIds = backup.data.leads.map(lead => clean(lead.id));
  if (originalIds.some(id => !id) || new Set(originalIds).size !== originalIds.length) throw new Error('Backup has missing or duplicate canonical IDs; human review required.');
  spreadsheet.validateWorkbook(ods);
  const odsPrint = fingerprints.ods || hash(JSON.stringify(ods));
  const xlsxPrint = fingerprints.xlsx || hash(JSON.stringify(xlsx));
  const crmRows = withSource(spreadsheet.readCrmRows(ods), 'primary-ods', '📋 CRM', odsPrint, ods);
  const listRows = withSource(tabularRows(ods, '📥 LISTA', { sourceLabel: 5, potential: 6, notes: 7, priority: 8 }), 'primary-ods', '📥 LISTA', odsPrint, ods);
  const contacts = withSource(tabularRows(ods, '👥 CONTATOS', { phone: 4, notes: 7 }), 'ods-contact', '👥 CONTATOS', odsPrint, ods);
  const secondary = [];
  for (const sheet of xlsx.SheetNames) {
    if (sheet === 'Como usar') continue;
    const overrides = sheet === 'Clientes Únicos' ? { summary: 5, conversationStage: undefined } : {};
    secondary.push(...withSource(tabularRows(xlsx, sheet, overrides), 'secondary-xlsx', sheet, xlsxPrint, xlsx));
  }
  const state = { ...clone(backup.data), revision: Number(backup.revision || 0), updatedAt: backup.createdAt || now };
  const review = [], metrics = { added: 0, matchedPrimary: 0, primaryReview: 0, secondaryMatched: 0, secondaryUnmatched: 0, secondaryReview: 0, contactsAdded: 0, contactReview: 0, duplicatesFound: 0 };
  for (const row of [...crmRows, ...listRows]) {
    if (!clean(row.company || row.primaryContact)) { review.push(privateReview(row, 'invalid_primary_row')); continue; }
    const { proposed, candidates } = matches(row, state.leads, now);
    if (candidates.length > 1 || (candidates.length === 1 && !verifiedMatch(row, candidates[0]))) {
      review.push(privateReview(row, candidates.length > 1 ? 'ambiguous_primary_identity' : 'primary_code_namespace_collision', candidates));
      metrics.primaryReview++; metrics.duplicatesFound++; continue;
    }
    if (candidates.length === 1) {
      const index = state.leads.findIndex(lead => lead.id === candidates[0].id);
      state.leads[index] = fillMissing(state.leads[index], row, now);
      metrics.matchedPrimary++; metrics.duplicatesFound++;
    } else {
      proposed.importMeta = sourceMeta(proposed, row);
      if (clean(row.lastInteraction)) proposed.lastContactAt = clean(row.lastInteraction);
      state.leads.push(proposed); metrics.added++;
    }
  }
  const secondarySeen = new Set();
  for (const row of secondary) {
    if (!clean(row.company || row.primaryContact)) { review.push(privateReview(row, 'invalid_secondary_row')); continue; }
    const { candidates } = matches(row, state.leads, now);
    if (candidates.length !== 1 || !verifiedMatch(row, candidates[0])) {
      review.push(privateReview(row, !candidates.length ? 'secondary_not_in_primary_seed' : 'secondary_identity_review', candidates));
      metrics[candidates.length ? 'secondaryReview' : 'secondaryUnmatched']++; continue;
    }
    const index = state.leads.findIndex(lead => lead.id === candidates[0].id);
    state.leads[index] = fillMissing(state.leads[index], row, now);
    secondarySeen.add(candidates[0].id);
  }
  metrics.secondaryMatched = secondarySeen.size;
  for (const row of contacts) {
    const { candidates } = matches(row, state.leads, now);
    const companyCandidates = candidates.filter(lead => sameCompany(row, lead));
    if (companyCandidates.length !== 1) {
      review.push(privateReview(row, 'unresolved_contact_parent', candidates)); metrics.contactReview++; continue;
    }
    const lead = companyCandidates[0];
    const contact = { name: clean(row.primaryContact), phone: spreadsheet.digits(row.phone), role: clean(row._source.values[3]), notes: clean(row.notes), source: clone(row._source) };
    if (!contact.name && !contact.phone) continue;
    const phones = crm.findPossibleDuplicates(state.leads, { telefone: contact.phone }).filter(item => item.id !== lead.id);
    if (contact.phone && phones.length) { review.push(privateReview(row, 'contact_phone_belongs_to_another_entity', phones)); metrics.contactReview++; continue; }
    lead.contacts = Array.isArray(lead.contacts) ? lead.contacts : [];
    if (!lead.contacts.some(item => comparable(item.name || item.nome) === comparable(contact.name) && spreadsheet.digits(item.phone || item.telefone) === contact.phone)) {
      lead.contacts.push(contact); metrics.contactsAdded++;
    }
    lead.importMeta = sourceMeta(lead, row);
  }
  if (new Set(state.leads.map(lead => lead.id)).size !== state.leads.length) throw new Error('Generated canonical identity collision.');
  if (JSON.stringify(state.history) !== JSON.stringify(backup.data.history) || JSON.stringify(state.operations) !== JSON.stringify(backup.data.operations)) throw new Error('Backup history/operations preservation failed.');
  for (const original of backup.data.leads) {
    const next = state.leads.find(lead => lead.id === original.id);
    for (const [key, value] of Object.entries(original)) {
      if (['importMeta', 'contacts', 'updatedAt'].includes(key)) continue;
      if (!empty(value) && JSON.stringify(next[key]) !== JSON.stringify(value)) throw new Error('Existing pilot lead value preservation failed.');
    }
    for (const contact of original.contacts || []) {
      if (!(next.contacts || []).some(item => JSON.stringify(item) === JSON.stringify(contact))) throw new Error('Existing pilot contact preservation failed.');
    }
  }
  const report = {
    canonicalOwner: 'OG_CRM_SERVICE / state.leads', primarySource: 'CRM OG dr.ods', secondarySource: 'Clientes_Pos_Venda_OG_Final.xlsx',
    ods: { ...rowStats([...crmRows, ...listRows]), crmRows: crmRows.length, listRows: listRows.length, contactRows: contacts.length },
    xlsx: rowStats(secondary), metrics, backupLeadCount: backup.data.leads.length,
    finalLeadCount: state.leads.length, sourceImportedRealLeads: state.leads.filter(lead => lead.importMeta?.pilotReal === true).length,
    historyPreserved: true, operationsPreserved: true, sourceFingerprints: { ods: odsPrint, xlsx: xlsxPrint }
  };
  const seedId = `PILOT-67-${hash([fingerprints.backup || hash(JSON.stringify(backup)), odsPrint, xlsxPrint].join('|')).slice(0, 32)}`;
  const originalState = { ...clone(backup.data), revision: Number(backup.revision || 0), updatedAt: backup.createdAt || now };
  const seed = { seedId, sourceSha256: hash(`${odsPrint}|${xlsxPrint}`), leads: clone(state.leads), fallbackState: originalState, reviewSummary: { backupValidated: true, realDataValidated: true, privateReviewCount: review.length, primaryReview: metrics.primaryReview, secondaryReview: metrics.secondaryReview } };
  const real = state.leads.filter(lead => lead.importMeta?.pilotReal === true).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const selected = new Map();
  const select = lead => { if (lead && selected.size < 20) selected.set(lead.id, lead); };
  real.filter(lead => lead.cnpj).forEach(select);
  select(real.find(lead => lead.email));
  for (const status of new Set(real.map(lead => lead.status))) select(real.find(lead => lead.status === status));
  for (const city of new Set(real.map(lead => lead.cidadeUf).filter(Boolean))) select(real.find(lead => lead.cidadeUf === city));
  select(real.find(lead => !lead.telefone));
  select(real.find(lead => lead.accountSummary));
  select(real.find(lead => !lead.accountSummary));
  real.forEach(select);
  const samples = [...selected.values()].map(lead => clone(lead));
  return { state, seed, report, review, samples };
}

export function preparePilotImportFiles({ backupFile, odsFile, xlsxFile, outputDir }) {
  const output = path.resolve(outputDir);
  const relative = path.relative(repository, output);
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) throw new Error('Private pilot outputs must remain outside the Git repository.');
  const backupBytes = fs.readFileSync(backupFile), backup = JSON.parse(backupBytes.toString('utf8'));
  const ods = readPilotWorkbook(odsFile), xlsx = readPilotWorkbook(xlsxFile);
  const result = preparePilotImport({ backup, ods: ods.workbook, xlsx: xlsx.workbook, fingerprints: { backup: hash(backupBytes), ods: ods.fingerprint, xlsx: xlsx.fingerprint } });
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(output, 'original-backup.snapshot.json'), backupBytes, { mode: 0o600 });
  for (const [name, value] of Object.entries({ 'consolidated-state.json': result.state, 'hosted-pilot-seed.json': result.seed, 'import-report.json': result.report, 'private-review.json': result.review, 'identity-samples.json': result.samples })) {
    fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2), { mode: 0o600 });
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).reduce((out, value, index, all) => value.startsWith('--') ? [...out, [value.slice(2), all[index + 1]]] : out, []));
  try {
    if (!args.backup || !args.ods || !args.xlsx || !args['out-dir']) throw new Error('Usage: --backup <JSON> --ods <ODS> --xlsx <XLSX> --out-dir <private directory>');
    const result = preparePilotImportFiles({ backupFile: args.backup, odsFile: args.ods, xlsxFile: args.xlsx, outputDir: args['out-dir'] });
    console.log(JSON.stringify(result.report));
  } catch (error) {
    console.error(`PILOT_IMPORT_ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
