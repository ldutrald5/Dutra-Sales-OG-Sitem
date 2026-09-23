(function attachMaterialStore(globalScope) {
  'use strict';
  const DB_NAME = 'og-commercial-library';
  const DB_VERSION = 1;
  const STORE = 'assets';

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!globalScope.indexedDB) return reject(new Error('IndexedDB indisponível'));
      const request = globalScope.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Falha ao abrir armazenamento local'));
    });
  }

  async function transact(mode, action) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Falha no arquivo local'));
        tx.onerror = () => reject(tx.error || new Error('Falha na transação local'));
      });
    } finally {
      db.close();
    }
  }

  async function put(id, file) {
    if (!id || !(file instanceof Blob)) throw new Error('Arquivo local inválido');
    await transact('readwrite', store => store.put({ id, blob: file, name: file.name || 'arquivo', type: file.type || '', size: file.size, savedAt: new Date().toISOString() }));
    return { id, name: file.name || 'arquivo', type: file.type || '', size: file.size };
  }

  async function get(id) { return id ? transact('readonly', store => store.get(id)) : null; }
  async function remove(id) { return id ? transact('readwrite', store => store.delete(id)) : undefined; }

  globalScope.OG_MATERIAL_STORE = { put, get, remove };
}(typeof globalThis !== 'undefined' ? globalThis : this));
