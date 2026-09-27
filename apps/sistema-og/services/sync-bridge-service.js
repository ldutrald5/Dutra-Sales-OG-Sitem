(function attachSyncBridge(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_SYNC_BRIDGE=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createSyncBridge(root){
  'use strict';
  const DB_NAME='sistema-og-sync';
  const DB_VERSION=2;
  const OUTBOX_STORE='outbox';
  const RECOVERY_STORE='recovery';
  const OUTBOX_KEY='state';
  const CONFLICT_KEY='conflict';
  const REVIEW_KEY='review';

  function clone(value){return JSON.parse(JSON.stringify(value??null));}
  function nowIso(value){const d=new Date(value||Date.now());if(Number.isNaN(d.getTime()))throw new Error('Data inválida');return d.toISOString();}
  function createQueuedRecord(body,options={}){
    if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Payload de sincronização inválido.');
    const revision=Number(body.revision);
    if(!Number.isInteger(revision)||revision<0)throw new Error('Revisão de sincronização inválida.');
    return Object.freeze({url:options.url||'/api/state',method:options.method||'PUT',queuedAt:nowIso(options.now),body:clone(body)});
  }
  function openDb(){
    const indexedDb=root?.indexedDB;
    if(!indexedDb) return Promise.reject(new Error('IndexedDB indisponível para Sync Bridge.'));
    return new Promise((resolve,reject)=>{
      const request=indexedDb.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(OUTBOX_STORE))db.createObjectStore(OUTBOX_STORE);
        if(!db.objectStoreNames.contains(RECOVERY_STORE))db.createObjectStore(RECOVERY_STORE);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Falha ao abrir Sync Bridge.'));
      request.onblocked=()=>reject(new Error('Atualização do Sync Bridge bloqueada por outra aba.'));
    });
  }
  async function write(store,key,value){
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(store,'readwrite');
        tx.objectStore(store).put(clone(value),key);
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||new Error('Falha ao persistir Sync Bridge.'));
        tx.onabort=()=>reject(tx.error||new Error('Persistência do Sync Bridge abortada.'));
      });
      return clone(value);
    }finally{db.close();}
  }
  async function read(store,key){
    const db=await openDb();
    try{return await new Promise((resolve,reject)=>{
      const request=db.transaction(store,'readonly').objectStore(store).get(key);
      request.onsuccess=()=>resolve(request.result?clone(request.result):null);
      request.onerror=()=>reject(request.error||new Error('Falha ao ler Sync Bridge.'));
    });}finally{db.close();}
  }
  async function remove(store,key){
    const db=await openDb();
    try{await new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Falha ao limpar Sync Bridge.'));
    });}finally{db.close();}
  }

  async function queueState(body,options={}){const record=createQueuedRecord(body,options);await write(OUTBOX_STORE,OUTBOX_KEY,record);return record;}
  const readQueuedState=()=>read(OUTBOX_STORE,OUTBOX_KEY);
  const clearQueuedState=()=>remove(OUTBOX_STORE,OUTBOX_KEY);
  const saveConflict=conflict=>write(RECOVERY_STORE,CONFLICT_KEY,conflict);
  const loadConflict=()=>read(RECOVERY_STORE,CONFLICT_KEY);
  const clearConflict=()=>remove(RECOVERY_STORE,CONFLICT_KEY);
  const saveReview=review=>write(RECOVERY_STORE,REVIEW_KEY,review);
  const loadReview=()=>read(RECOVERY_STORE,REVIEW_KEY);
  const clearReview=()=>remove(RECOVERY_STORE,REVIEW_KEY);

  return{DB_NAME,DB_VERSION,OUTBOX_STORE,RECOVERY_STORE,createQueuedRecord,queueState,readQueuedState,clearQueuedState,saveConflict,loadConflict,clearConflict,saveReview,loadReview,clearReview};
}));