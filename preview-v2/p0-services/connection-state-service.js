(function attachConnectionState(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_CONNECTION_STATE=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createConnectionState(root){
  'use strict';

  const STATUSES=Object.freeze(['CONNECTING','CONNECTED','OFFLINE','SYNCING','ERROR']);
  const SAVE_PHASES=Object.freeze(['IDLE','SAVING','SAVED','QUEUED','FAILED']);
  const listeners=new Set();

  function iso(value){
    const date=new Date(value||Date.now());
    if(Number.isNaN(date.getTime()))throw new Error('Data inválida para Connection State.');
    return date.toISOString();
  }
  function freeze(value){return Object.freeze({...value,save:Object.freeze({...value.save})});}

  let current=freeze({
    status:'CONNECTING',
    detail:'',
    pendingCount:0,
    lastSyncedAt:'',
    error:'',
    updatedAt:iso(),
    save:{phase:'IDLE',mutationId:'',label:'',message:'',retryable:false,updatedAt:iso()}
  });

  function snapshot(){return current;}

  function notify(){
    const value=snapshot();
    for(const listener of [...listeners]){
      try{listener(value);}catch(error){console.warn?.('[DUTRA] connection listener',error);}
    }
    try{
      root?.dispatchEvent?.(new CustomEvent('dutra:connection',{detail:value}));
    }catch{}
    return value;
  }

  function patch(next={}){
    current=freeze({
      ...current,
      ...next,
      pendingCount:Math.max(0,Number(next.pendingCount??current.pendingCount)||0),
      updatedAt:iso(next.updatedAt),
      save:{...current.save,...(next.save||{})}
    });
    return notify();
  }

  function transition(status,options={}){
    if(!STATUSES.includes(status))throw new Error('Estado de conexão inválido: '+status);
    return patch({
      status,
      detail:String(options.detail??''),
      error:String(options.error??(status==='ERROR'?current.error:'')),
      lastSyncedAt:options.lastSyncedAt??current.lastSyncedAt,
      pendingCount:options.pendingCount??current.pendingCount
    });
  }

  function setPendingCount(count){return patch({pendingCount:count});}

  function beginSave(options={}){
    return patch({
      status:options.status||'SYNCING',
      save:{
        phase:'SAVING',
        mutationId:String(options.mutationId||''),
        label:String(options.label||'Alteração'),
        message:String(options.message||'SALVANDO…'),
        retryable:false,
        updatedAt:iso(options.now)
      }
    });
  }

  function saveQueued(options={}){
    return patch({
      status:options.status||'OFFLINE',
      detail:String(options.detail||'Alterações pendentes'),
      pendingCount:options.pendingCount??current.pendingCount,
      save:{
        phase:'QUEUED',
        mutationId:String(options.mutationId||current.save.mutationId||''),
        label:String(options.label||current.save.label||'Alteração'),
        message:String(options.message||'SALVO NESTE APARELHO · SINCRONIZAÇÃO PENDENTE'),
        retryable:true,
        updatedAt:iso(options.now)
      }
    });
  }

  function saveSucceeded(options={}){
    return patch({
      status:options.status||'CONNECTED',
      detail:String(options.detail||''),
      error:'',
      lastSyncedAt:iso(options.now),
      pendingCount:options.pendingCount??current.pendingCount,
      save:{
        phase:'SAVED',
        mutationId:String(options.mutationId||current.save.mutationId||''),
        label:String(options.label||current.save.label||'Alteração'),
        message:String(options.message||'SALVO ✓'),
        retryable:false,
        updatedAt:iso(options.now)
      }
    });
  }

  function saveFailed(options={}){
    return patch({
      status:options.status||'ERROR',
      detail:String(options.detail||'Sincronização pendente'),
      error:String(options.error||'Falha ao salvar.'),
      pendingCount:options.pendingCount??current.pendingCount,
      save:{
        phase:'FAILED',
        mutationId:String(options.mutationId||current.save.mutationId||''),
        label:String(options.label||current.save.label||'Alteração'),
        message:String(options.message||'TENTAR NOVAMENTE'),
        retryable:options.retryable!==false,
        updatedAt:iso(options.now)
      }
    });
  }

  function clearSave(options={}){
    return patch({
      save:{
        phase:'IDLE',
        mutationId:'',
        label:'',
        message:'',
        retryable:false,
        updatedAt:iso(options.now)
      }
    });
  }

  function subscribe(listener,options={}){
    if(typeof listener!=='function')throw new Error('Listener inválido.');
    listeners.add(listener);
    if(options.immediate!==false)listener(snapshot());
    return()=>listeners.delete(listener);
  }

  return{
    STATUSES,
    SAVE_PHASES,
    snapshot,
    transition,
    setPendingCount,
    beginSave,
    saveQueued,
    saveSucceeded,
    saveFailed,
    clearSave,
    subscribe
  };
}));
