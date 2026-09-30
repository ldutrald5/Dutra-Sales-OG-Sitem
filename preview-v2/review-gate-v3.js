(()=>{'use strict';
const clean=v=>String(v??'').trim(), core=()=>globalThis.DUTRA_CORE;
function leadById(id){return core()?.getLeads?.().find(x=>String(x.id)===String(id))||null}
function summary(value){if(typeof value==='string')return clean(value);if(!value||typeof value!=='object')return '';return clean(value.summary||value.note||value.analysis||value.text||value.overview)}
function sources(value){const raw=value?.sources||value?.provenance||value?.references||[];return (Array.isArray(raw)?raw:[raw]).filter(Boolean).map(x=>typeof x==='string'?{label:x,url:''}:{label:clean(x.label||x.title||x.name||x.url),url:clean(x.url||x.href)})}
function suggestion(kind,leadId,result,meta={}){const l=leadById(leadId);if(!l)throw new Error('Cliente não encontrado.');return{id:'SUG-'+Date.now().toString(36).toUpperCase(),kind,leadId:l.id,leadName:l.empresa||l.nome||'',createdAt:new Date().toISOString(),status:'REVIEW_REQUIRED',summary:summary(result),sources:sources(result),result,meta}}
async function commitInteraction(s,options={}){
 const l=leadById(s.leadId);if(!l)throw new Error('Cliente não encontrado.');
 const service=globalThis.OG_INTERACTION_SERVICE;
 const note=clean(options.note||s.summary);if(!note)throw new Error('Revise a nota antes de salvar.');
 if(service?.addInteraction) service.addInteraction(l,{type:options.type||('ai_'+s.kind),note,countAsContact:false,signals:['AI_SUGGESTION_REVIEWED'],objective:'Registro revisado pelo usuário antes de persistir.'});
 else {if(!Array.isArray(l.interactions))l.interactions=[];l.interactions.push({id:'INT-'+Date.now(),at:new Date().toISOString(),type:options.type||('ai_'+s.kind),note,result:'reviewed_ai_suggestion'});}
 if(options.nextAction){if(service?.setNextAction)service.setNextAction(l,options.nextAction,options.followUpAt||'',{reason:options.reason||'Definido após revisão de inteligência assistida.'});else{l.nextAction=options.nextAction;l.followUpAt=options.followUpAt||'';}}
 await core().commit({leads:core().getLeads()},'Inteligência revisada salva no cliente.',{action:'ACCEPT_AI_SUGGESTION',entityType:'lead',entityId:l.id,idempotencyKey:'ai-suggestion:'+s.id,label:'Inteligência revisada'});
 return l;
}
globalThis.DUTRA_REVIEW_GATE=Object.freeze({fromResearch:(leadId,result,meta)=>suggestion('research',leadId,result,meta),fromCall:(leadId,result,meta)=>suggestion('call',leadId,result,meta),commitInteraction});
})();