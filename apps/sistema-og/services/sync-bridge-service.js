(function attachSyncBridge(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_SYNC_BRIDGE=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createSyncBridge(root){
  'use strict';
  const DB_NAME='sistema-og-sync';
  const DB_VERSION=3;
  const OUTBOX_STORE='outbox';
  const RECOVERY_STORE='recovery';
  const MUTATION_STORE='mutations';
  const OUTBOX_KEY='state';
  const CONFLICT_KEY='conflict';
  const REVIEW_KEY='review';

  function clone(value){return JSON.parse(JSON.stringify(value??null));}
  function uid(prefix='sync'){
    if(root?.crypto?.randomUUID)return prefix+'-'+root.crypto.randomUUID();
    return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  }
  function nowIso(value){const d=new Date(value||Date.now());if(Number.isNaN(d.getTime()))throw new Error('Data inválida');return d.toISOString();}
  function createQueuedRecord(body,options={}){
    if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Payload de sincronização inválido.');
    const revision=Number(body.revision);
    if(!Number.isInteger(revision)||revision<0)throw new Error('Revisão de sincronização inválida.');
    return Object.freeze({id:options.id||uid('state'),url:options.url||'/api/state',method:options.method||'PUT',queuedAt:nowIso(options.now),mutationIds:Array.isArray(options.mutationIds)?[...new Set(options.mutationIds.map(String).filter(Boolean))]:[],body:clone(body)});
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
        if(!db.objectStoreNames.contains(MUTATION_STORE)){
          const store=db.createObjectStore(MUTATION_STORE,{keyPath:'id'});
          store.createIndex('idempotencyKey','idempotencyKey',{unique:true});
          store.createIndex('createdAt','createdAt',{unique:false});
        }
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
  async function clearQueuedStateIf(id){const current=await readQueuedState();if(!current||String(current.id)!==String(id))return false;await clearQueuedState();return true;}

  function createMutationRecord(input={},options={}){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Mutation inválida.');
    const action=String(input.action||'').trim();
    if(!action)throw new Error('Mutation sem action.');
    const id=String(input.id||options.id||uid('mutation'));
    const idempotencyKey=String(input.idempotencyKey||id);
    const createdAt=nowIso(input.createdAt||options.now);
    return Object.freeze({
      id,
      idempotencyKey,
      action,
      entityType:String(input.entityType||'state'),
      entityId:String(input.entityId||''),
      label:String(input.label||action),
      status:'pending',
      attempts:Number.isInteger(Number(input.attempts))?Math.max(0,Number(input.attempts)):0,
      createdAt,
      updatedAt:createdAt,
      lastAttemptAt:'',
      lastError:'',
      metadata:clone(input.metadata||{})
    });
  }

  async function enqueueMutation(input={},options={}){
    const record=createMutationRecord(input,options);
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(MUTATION_STORE,'readwrite');
        const store=tx.objectStore(MUTATION_STORE);
        const index=store.index('idempotencyKey');
        let result=record;
        const lookup=index.get(record.idempotencyKey);
        lookup.onsuccess=()=>{
          if(lookup.result){result=clone(lookup.result);return;}
          store.put(clone(record));
        };
        lookup.onerror=()=>reject(lookup.error||new Error('Falha ao consultar mutation.'));
        tx.oncomplete=()=>resolve(clone(result));
        tx.onerror=()=>reject(tx.error||new Error('Falha ao persistir mutation.'));
        tx.onabort=()=>reject(tx.error||new Error('Persistência de mutation abortada.'));
      });
    }finally{db.close();}
  }

  async function listMutations(){
    const db=await openDb();
    try{
      const rows=await new Promise((resolve,reject)=>{
        const request=db.transaction(MUTATION_STORE,'readonly').objectStore(MUTATION_STORE).getAll();
        request.onsuccess=()=>resolve(request.result||[]);
        request.onerror=()=>reject(request.error||new Error('Falha ao listar mutations.'));
      });
      return rows.map(clone).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    }finally{db.close();}
  }

  async function markMutationAttempt(id,error=''){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(MUTATION_STORE,'readwrite');
        const store=tx.objectStore(MUTATION_STORE);
        const request=store.get(String(id));
        let result=null;
        request.onsuccess=()=>{
          if(!request.result)return;
          result={...request.result,attempts:Number(request.result.attempts||0)+1,lastAttemptAt:nowIso(),lastError:String(error||''),updatedAt:nowIso()};
          store.put(result);
        };
        request.onerror=()=>reject(request.error||new Error('Falha ao carregar mutation.'));
        tx.oncomplete=()=>resolve(result?clone(result):null);
        tx.onerror=()=>reject(tx.error||new Error('Falha ao atualizar mutation.'));
      });
    }finally{db.close();}
  }

  async function ackMutations(ids=[]){
    const unique=[...new Set((ids||[]).map(String).filter(Boolean))];
    if(!unique.length)return 0;
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(MUTATION_STORE,'readwrite');
        const store=tx.objectStore(MUTATION_STORE);
        unique.forEach(id=>store.delete(id));
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||new Error('Falha ao confirmar mutations.'));
        tx.onabort=()=>reject(tx.error||new Error('Confirmação de mutations abortada.'));
      });
      return unique.length;
    }finally{db.close();}
  }

  async function pendingMutationCount(){return (await listMutations()).length;}
  const saveConflict=conflict=>write(RECOVERY_STORE,CONFLICT_KEY,conflict);
  const loadConflict=()=>read(RECOVERY_STORE,CONFLICT_KEY);
  const clearConflict=()=>remove(RECOVERY_STORE,CONFLICT_KEY);
  const saveReview=review=>write(RECOVERY_STORE,REVIEW_KEY,review);
  const loadReview=()=>read(RECOVERY_STORE,REVIEW_KEY);
  const clearReview=()=>remove(RECOVERY_STORE,REVIEW_KEY);

  return{DB_NAME,DB_VERSION,OUTBOX_STORE,RECOVERY_STORE,MUTATION_STORE,createQueuedRecord,queueState,readQueuedState,clearQueuedState,clearQueuedStateIf,createMutationRecord,enqueueMutation,listMutations,markMutationAttempt,ackMutations,pendingMutationCount,saveConflict,loadConflict,clearConflict,saveReview,loadReview,clearReview};
}));