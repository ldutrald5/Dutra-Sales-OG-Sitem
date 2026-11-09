/* Private filesystem boundary for the existing shared-state owner; no CRM merge. */
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID, createHash} = require('node:crypto');
const safety = require('./services/data-safety-service.js');
const model = require('./operations-model.js');
const unavailable = () => Object.assign(new Error('Armazenamento do CRM indisponível. Preserve os dados e revise a recuperação.'), {code:'STATE_STORAGE_UNAVAILABLE'});
const refused = () => Object.assign(new Error('Recuperação recusada. Valide o backup e use um destino local novo ou já idêntico.'), {code:'STATE_RECOVERY_REFUSED'});
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function checkedState(value) {
  if (!object(value) || !Array.isArray(value.leads) || (value.history != null && !Array.isArray(value.history))
    || (value.operations != null && !object(value.operations))) throw unavailable();
  if (value.revision !== undefined && !['number','string'].includes(typeof value.revision)) throw unavailable();
  if (typeof value.revision === 'string' && !value.revision.trim()) throw unavailable();
  const revision = value.revision === undefined ? 0 : Number(value.revision);
  if (!Number.isSafeInteger(revision) || revision < 0 || value.revision === null || value.revision === '') throw unavailable();
  for (const item of [...value.leads,...(value.history || [])]) {
    if (!object(item) || !item.id || String(item.id).length > 160) throw unavailable();
    if (Object.keys(item).some(key => ['__proto__','prototype','constructor'].includes(key))) throw unavailable();
  }
  for (const key of model.ENTITY_KEYS) {
    if (value.operations?.[key] != null && !Array.isArray(value.operations[key])) throw unavailable();
  }
  return {...value, revision, updatedAt:value.updatedAt ?? null, history:value.history || [], operations:value.operations || {}};
}

// Sync file contents before atomic same-directory replacement. This does not claim
// power-loss guarantees for the volume or serialize independent server processes.
function atomicWrite(file, bytes, io = fs) {
  const temporary = `${file}.tmp.${randomUUID()}`;
  let fd;
  try {
    fd = io.openSync(temporary, 'wx', 0o600);
    io.writeFileSync(fd, bytes, 'utf8');
    io.fsyncSync(fd);
    io.closeSync(fd); fd = undefined;
    io.renameSync(temporary, file);
  } finally {
    if (fd !== undefined) { try { io.closeSync(fd); } catch {} }
    try { io.unlinkSync(temporary); } catch {}
  }
}

// Restore only creates names. A verified temp is linked atomically without
// replacing an entry that another process may have created after validation.
function atomicCreate(file, bytes, sameDirectory) {
  const temporary = `${file}.tmp.${randomUUID()}`;
  let fd, created;
  try {
    sameDirectory();
    fd = fs.openSync(temporary,'wx',0o600);
    created = fs.fstatSync(fd);
    sameDirectory();
    fs.writeFileSync(fd,bytes,'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    sameDirectory();
    fs.linkSync(temporary,file); // EEXIST refuses a concurrent destination.
  } finally {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
    if (created) try {
      const current = fs.lstatSync(temporary);
      if (current.dev === created.dev && current.ino === created.ino) fs.unlinkSync(temporary);
    } catch {}
  }
}

function backupDigest(backup) {
  return createHash('sha256').update(JSON.stringify({revision:backup.revision,stateUpdatedAt:backup.stateUpdatedAt ?? null,data:backup.data})).digest('hex');
}
function createRecoveryBackup(state) {
  const checked = checkedState(state);
  const backup = {...safety.createBackup(checked,{source:'shared-state-before-write',revision:checked.revision}),stateUpdatedAt:checked.updatedAt};
  backup.integrity = {algorithm:'sha256',value:backupDigest(backup)};
  return backup;
}
function stateFromBackup(backup) {
  try {
    if (!safety.validateBackup(backup).valid || !['number','string'].includes(typeof backup.revision) || !String(backup.revision).trim() || !Number.isSafeInteger(Number(backup.revision)) || Number(backup.revision) < 0) throw refused();
    if (backup.integrity && (!Object.hasOwn(backup,'stateUpdatedAt') || backup.integrity.algorithm !== 'sha256' || backup.integrity.value !== backupDigest(backup))) throw refused();
    return checkedState({revision:Number(backup.revision),updatedAt:Object.hasOwn(backup,'stateUpdatedAt') ? backup.stateUpdatedAt : backup.createdAt ?? null,leads:backup.data.leads,history:backup.data.history,operations:backup.data.operations});
  } catch { throw refused(); }
}

function createStateStore(dataDir, {io = fs} = {}) {
  const file = path.join(dataDir,'shared-state.json'), backupFile = file+'.backup', markerFile = file+'.initialized';
  let observedState = false;
  const exists = target => { try { io.lstatSync(target); return true; } catch(error) { if(error.code==='ENOENT')return false; throw error; } };
  function read() {
    try {
      const state = checkedState(JSON.parse(io.readFileSync(file,'utf8')));
      observedState = true;
      return state;
    } catch(error) {
      try {
        if (error.code === 'ENOENT' && !observedState && !exists(file)) {
          const names = io.readdirSync(dataDir);
          const evidence = names.some(name => name.startsWith('shared-state.json.') || ['.seed-history','public-proposals.json'].includes(name));
          if (!evidence) return {revision:0,updatedAt:null,leads:[],history:[],operations:model.createEmptyOperations()};
        }
      } catch {}
      throw unavailable();
    }
  }
  function write(next) {
    try {
      const checked = checkedState(next), current = read();
      if (checked.revision !== current.revision + 1) throw unavailable();
      const backup = createRecoveryBackup(current);
      atomicWrite(backupFile, JSON.stringify(backup,null,2), io);
      const verified = JSON.parse(io.readFileSync(backupFile,'utf8'));
      stateFromBackup(verified);
      if (verified.integrity.value !== backup.integrity.value) throw unavailable();
      if (!exists(markerFile)) atomicWrite(markerFile, JSON.stringify({format:'sistema-og-state-initialized',version:1}), io);
      atomicWrite(file, JSON.stringify(checked,null,2), io);
      observedState = true;
    } catch { throw unavailable(); }
  }
  return {read,write,file,backupFile,markerFile};
}

function exportBackup(sourceDir, destination) {
  try {
    const store = createStateStore(sourceDir);
    if (!fs.lstatSync(store.file).isFile()) throw refused();
    const backup = createRecoveryBackup(store.read());
    // Exclusive creation cannot replace a previously exported backup. A partial
    // export after interruption is not reported as successful and fails validation.
    const fd = fs.openSync(destination,'wx',0o600);
    try { fs.writeFileSync(fd,JSON.stringify(backup,null,2)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    const verified = JSON.parse(fs.readFileSync(destination,'utf8'));
    stateFromBackup(verified);
    if (verified.integrity.value !== backup.integrity.value) throw refused();
    return {status:'exported',revision:backup.revision,counts:safety.validateBackup(backup).counts};
  } catch { throw refused(); }
}
function restoreBackup(backupFile, targetDir) {
  try {
    const backup = JSON.parse(fs.readFileSync(backupFile,'utf8')), state = stateFromBackup(backup);
    const target = path.join(targetDir,'shared-state.json');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(path.dirname(targetDir),{recursive:true,mode:0o700});
      fs.mkdirSync(targetDir,{mode:0o700}); // Refuse a concurrent directory creator.
    }
    const directory = fs.lstatSync(targetDir), canonical = fs.realpathSync(targetDir);
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw refused();
    const sameDirectory = () => {
      const current = fs.lstatSync(targetDir);
      if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== directory.dev || current.ino !== directory.ino || fs.realpathSync(targetDir) !== canonical) throw refused();
    };
    if (fs.existsSync(target)) {
      if (!fs.lstatSync(target).isFile()) throw refused();
      const existing = JSON.parse(fs.readFileSync(target,'utf8'));
      sameDirectory();
      if (JSON.stringify(existing) === JSON.stringify(state)) return {status:'already_restored',revision:state.revision};
    }
    if (fs.readdirSync(targetDir).length) throw refused();
    atomicCreate(target+'.initialized',JSON.stringify({format:'sistema-og-state-initialized',version:1}),sameDirectory);
    atomicCreate(target,JSON.stringify(state,null,2),sameDirectory);
    sameDirectory();
    if (JSON.stringify(JSON.parse(fs.readFileSync(target,'utf8'))) !== JSON.stringify(state)) throw refused();
    return {status:'restored',revision:state.revision,counts:safety.validateBackup(backup).counts,integrityPresent:Boolean(backup.integrity)};
  } catch { throw refused(); }
}
module.exports = {createStateStore,createRecoveryBackup,stateFromBackup,exportBackup,restoreBackup};
