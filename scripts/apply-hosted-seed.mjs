import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const clean = value => String(value ?? '').trim();
const digits = value => clean(value).replace(/\D/g, '');
const codeKey = value => {
  const raw = clean(value).replace(/\s+/g, '');
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return String(Number.parseInt(raw, 10));
  return raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
};
const isEmpty = value => value == null || value === '' || (Array.isArray(value) && value.length === 0);
const safeSeedId = value => clean(value).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);

function stateRevision(state) {
  const value = Number(state?.revision || 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function validState(state) {
  return Boolean(state && typeof state === 'object' && !Array.isArray(state) && Array.isArray(state.leads) && Array.isArray(state.history));
}

function readState(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return validState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function newestState(states) {
  return states.filter(Boolean).sort((a, b) => {
    const revisionDiff = stateRevision(b.state) - stateRevision(a.state);
    if (revisionDiff) return revisionDiff;
    return String(b.state.updatedAt || '').localeCompare(String(a.state.updatedAt || ''));
  })[0] || null;
}

function leadKeys(lead = {}) {
  const keys = [];
  const code = codeKey(lead.internalCode || lead.codigo);
  if (code) keys.push(`code:${code}`);
  const cnpj = digits(lead.cnpj);
  const cpf = digits(lead.cpf);
  if (cnpj) keys.push(`doc:${cnpj}`);
  if (cpf) keys.push(`doc:${cpf}`);
  const phones = [lead.telefone, ...(Array.isArray(lead.additionalPhones) ? lead.additionalPhones.map(item => typeof item === 'string' ? item : item?.phone) : [])];
  for (const phone of phones) {
    const normalized = digits(phone);
    if (normalized) keys.push(`phone:${normalized}`);
  }
  return [...new Set(keys)];
}

function mergeUniqueObjects(existing, incoming, keyFn) {
  const out = [];
  const seen = new Set();
  for (const item of [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])]) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function mergeLead(existing, imported) {
  const merged = { ...imported, ...existing, id: existing.id };
  for (const [field, value] of Object.entries(imported || {})) {
    if (field === 'id') continue;
    if (isEmpty(existing?.[field]) && !isEmpty(value)) merged[field] = value;
  }
  merged.additionalPhones = mergeUniqueObjects(existing.additionalPhones, imported.additionalPhones, item => digits(typeof item === 'string' ? item : item?.phone));
  merged.contacts = mergeUniqueObjects(existing.contacts, imported.contacts, item => {
    const phone = digits(item?.phone || item?.telefone);
    const name = clean(item?.name || item?.nome).toLowerCase();
    return phone || name;
  });
  merged.referrals = mergeUniqueObjects(existing.referrals, imported.referrals, item => [clean(item?.name).toLowerCase(), clean(item?.company).toLowerCase(), digits(item?.phone)].join('|'));
  merged.interactions = Array.isArray(existing.interactions) ? existing.interactions : [];
  merged.opportunities = Array.isArray(existing.opportunities) ? existing.opportunities : [];
  merged.tasks = Array.isArray(existing.tasks) ? existing.tasks : [];
  merged.importMeta = {
    ...(imported.importMeta && typeof imported.importMeta === 'object' ? imported.importMeta : {}),
    ...(existing.importMeta && typeof existing.importMeta === 'object' ? existing.importMeta : {}),
    mergedIntoExisting: true
  };
  return merged;
}

export function mergeSeedLeads(existingLeads = [], importedLeads = []) {
  const output = existingLeads.map(item => ({ ...item }));
  const indexByKey = new Map();

  function rebuildIndex() {
    indexByKey.clear();
    output.forEach((lead, idx) => {
      for (const key of leadKeys(lead)) {
        const bucket = indexByKey.get(key) || [];
        bucket.push(idx);
        indexByKey.set(key, bucket);
      }
    });
  }

  rebuildIndex();
  let added = 0, matched = 0, ambiguous = 0;

  for (const imported of importedLeads) {
    if (!imported || typeof imported !== 'object' || Array.isArray(imported) || !clean(imported.id)) continue;
    const candidateIndexes = new Set();
    for (const key of leadKeys(imported)) {
      const bucket = indexByKey.get(key) || [];
      if (bucket.length === 1) candidateIndexes.add(bucket[0]);
      else if (bucket.length > 1) bucket.forEach(idx => candidateIndexes.add(idx));
    }

    if (candidateIndexes.size === 1) {
      const [idx] = candidateIndexes;
      output[idx] = mergeLead(output[idx], imported);
      matched += 1;
      rebuildIndex();
      continue;
    }

    const idExists = output.some(item => String(item.id) === String(imported.id));
    const next = idExists ? { ...imported, id: `${imported.id}-SEED-${added + 1}` } : { ...imported };
    if (candidateIndexes.size > 1) {
      next.importMeta = { ...(next.importMeta || {}), seedAmbiguousStrongMatch: true };
      ambiguous += 1;
    }
    output.push(next);
    added += 1;
    rebuildIndex();
  }

  return { leads: output, added, matched, ambiguous };
}

function seedPayloadFromEnv(env) {
  const direct = clean(env.OG_STATE_SEED_GZIP_B64);
  if (direct) return direct;
  return Object.keys(env)
    .map(key => {
      const match = key.match(/^OG_STATE_SEED_GZIP_B64_(\d+)$/);
      return match ? { n: Number(match[1]), value: clean(env[key]) } : null;
    })
    .filter(item => item?.value)
    .sort((a, b) => a.n - b.n)
    .map(item => item.value)
    .join('');
}

function decodeSeed(encoded) {
  const bytes = Buffer.from(encoded, 'base64');
  const json = zlib.gunzipSync(bytes).toString('utf8');
  const payload = JSON.parse(json);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Seed hospedado inválido.');
  if (!safeSeedId(payload.seedId)) throw new Error('Seed hospedado sem identificador.');
  if (!Array.isArray(payload.leads) || payload.leads.length > 10000) throw new Error('Seed hospedado com lista de leads inválida.');
  if (payload.fallbackState != null && !validState(payload.fallbackState)) throw new Error('Seed hospedado com fallback inválido.');
  return payload;
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, file);
}

export function applyHostedSeed(options = {}) {
  const env = options.env || process.env;
  const encoded = seedPayloadFromEnv(env);
  if (!encoded) return { status: 'no_seed' };

  const payload = decodeSeed(encoded);
  const seedId = safeSeedId(payload.seedId);
  const volumeRoot = clean(env.RAILWAY_VOLUME_MOUNT_PATH);
  const dataDir = path.resolve(clean(env.OG_DATA_DIR) || (volumeRoot ? path.join(volumeRoot, 'sistema-og') : '/data/sistema-og'));
  const dataFile = path.join(dataDir, 'shared-state.json');
  const markerDir = path.join(dataDir, '.seed-history');
  const markerFile = path.join(markerDir, `${seedId}.json`);
  if (fs.existsSync(markerFile)) {
    const marker = readState(markerFile) || JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    return { status: 'already_applied', seedId, marker };
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(markerDir, { recursive: true });

  const candidates = [{ file: dataFile, state: readState(dataFile) }];
  if (volumeRoot) {
    const legacyAtVolumeRoot = path.join(volumeRoot, 'shared-state.json');
    if (legacyAtVolumeRoot !== dataFile) candidates.push({ file: legacyAtVolumeRoot, state: readState(legacyAtVolumeRoot) });
  }
  const legacyDefault = '/data/shared-state.json';
  if (legacyDefault !== dataFile && (!volumeRoot || legacyDefault !== path.join(volumeRoot, 'shared-state.json'))) {
    candidates.push({ file: legacyDefault, state: readState(legacyDefault) });
  }

  let selected = newestState(candidates);
  let base = selected?.state || null;
  let baseSource = selected?.file || null;
  if ((!base || (stateRevision(base) === 0 && base.leads.length === 0 && base.history.length === 0)) && payload.fallbackState) {
    base = payload.fallbackState;
    baseSource = 'fallbackState';
  }
  if (!base) base = { revision: 0, updatedAt: null, leads: [], history: [], operations: {} };

  const backupDir = path.join(dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `pre-seed-${seedId}.json`);
  if (!fs.existsSync(backupFile)) atomicWriteJson(backupFile, base);

  const merged = mergeSeedLeads(base.leads || [], payload.leads || []);
  const next = {
    ...base,
    revision: stateRevision(base) + 1,
    updatedAt: new Date().toISOString(),
    leads: merged.leads,
    history: Array.isArray(base.history) ? base.history : [],
    operations: base.operations && typeof base.operations === 'object' && !Array.isArray(base.operations) ? base.operations : {}
  };
  atomicWriteJson(dataFile, next);

  const marker = {
    seedId,
    appliedAt: next.updatedAt,
    sourceSha256: clean(payload.sourceSha256),
    baseSource,
    baseRevision: stateRevision(base),
    revision: next.revision,
    existingLeadCount: (base.leads || []).length,
    importedCandidateCount: (payload.leads || []).length,
    added: merged.added,
    matched: merged.matched,
    ambiguous: merged.ambiguous,
    finalLeadCount: next.leads.length,
    review: payload.reviewSummary && typeof payload.reviewSummary === 'object' ? payload.reviewSummary : {}
  };
  atomicWriteJson(markerFile, marker);
  return { status: 'applied', ...marker, dataFile, backupFile };
}
