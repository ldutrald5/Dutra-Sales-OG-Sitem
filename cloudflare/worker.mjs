const writeWindows=new Map();
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'}});}
function isAuthorized(request,env){const header=request.headers.get('authorization')||'';return Boolean(env.OG_ACCESS_TOKEN)&&header===`Bearer ${env.OG_ACCESS_TOKEN}`;}
function allowWrite(request){const key=request.headers.get('cf-connecting-ip')||'unknown',now=Date.now(),recent=(writeWindows.get(key)||[]).filter(t=>now-t<60_000);if(recent.length>=30)return false;recent.push(now);writeWindows.set(key,recent);return true;}
function validatePayload(body){if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Estado inválido.');if(!Number.isInteger(Number(body.revision))||Number(body.revision)<0)throw new Error('Revisão inválida.');if(!Array.isArray(body.leads)||body.leads.length>10000)throw new Error('Lista de clientes inválida.');if(!Array.isArray(body.history)||body.history.length>5000)throw new Error('Histórico inválido.');for(const item of [...body.leads,...body.history]){if(!item||typeof item!=='object'||Array.isArray(item)||!item.id||String(item.id).length>160)throw new Error('Registro inválido.');if(Object.keys(item).some(k=>['__proto__','prototype','constructor'].includes(k)))throw new Error('Chave não permitida.');}if(body.operations!=null&&(typeof body.operations!=='object'||Array.isArray(body.operations)))throw new Error('Operações inválidas.');}
async function keepServerBackup(env,current){if(!env.OG_DATA||!current?.updatedAt)return;const id=`backup:${current.updatedAt}:${current.revision||0}`;await env.OG_DATA.put(id,JSON.stringify(current),{expirationTtl:60*60*24*30});const index=await env.OG_DATA.get('backup-index','json')||[];const next=[{id,createdAt:current.updatedAt,revision:current.revision||0,leads:current.leads?.length||0},...index.filter(item=>item.id!==id)].slice(0,20);await env.OG_DATA.put('backup-index',JSON.stringify(next));}
export default{async fetch(request,env){const url=new URL(request.url),temporary=env.OG_TEMP_MODE==='true';
  if(url.pathname==='/api/health')return json({ok:true,storage:env.OG_DATA?'cloudflare-kv':'temporary-read-only',persistent:Boolean(env.OG_DATA)});
  if(url.pathname==='/api/backups'&&request.method==='GET'){if(!isAuthorized(request,env))return json({error:'Código de acesso necessário'},401);return json({persistent:Boolean(env.OG_DATA),backups:env.OG_DATA?await env.OG_DATA.get('backup-index','json')||[]:[]});}
  if(url.pathname==='/api/state'){
    if(!isAuthorized(request,env)&&!(temporary&&request.method==='GET'))return json({error:'Código de acesso necessário'},401);
    if(request.method==='GET'){if(!env.OG_DATA)return json({revision:0,updatedAt:null,leads:[],history:[],operations:null,temporary:true});const state=await env.OG_DATA.get('shared-state','json');return json(state||{revision:0,updatedAt:null,leads:[],history:[],operations:null});}
    if(request.method==='PUT'){
      if(temporary||!env.OG_DATA)return json({error:'Prévia temporária é somente leitura'},503);
      if(!allowWrite(request))return json({error:'Muitas gravações. Aguarde um minuto.'},429);
      const contentLength=Number(request.headers.get('content-length')||0);if(contentLength>5_000_000)return json({error:'Payload muito grande'},413);
      let body;try{body=await request.json();validatePayload(body);}catch(error){return json({error:error?.message||'Conteúdo inválido'},400);}
      const current=await env.OG_DATA.get('shared-state','json')||{revision:0,leads:[],history:[],operations:null};const clientRevision=Number(body.revision),serverRevision=Number(current.revision||0);
      if(clientRevision!==serverRevision)return json({error:'revision_conflict',revision:serverRevision,updatedAt:current.updatedAt,leads:current.leads||[],history:current.history||[],operations:current.operations||null},409);
      const next={revision:serverRevision+1,updatedAt:new Date().toISOString(),leads:body.leads,history:body.history,operations:body.operations||null};await keepServerBackup(env,current);await env.OG_DATA.put('shared-state',JSON.stringify(next));return json(next);
    }
    return json({error:'Método não permitido'},405);
  }
  return env.ASSETS.fetch(request);
}};
