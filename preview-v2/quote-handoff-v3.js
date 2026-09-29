(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;root.DUTRA_QUOTE_HANDOFF=api;}(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
const KEY="dutra_quote_handoff_v1";
const clean=v=>String(v??"").trim();
const clone=v=>JSON.parse(JSON.stringify(v??null));
function payloadFromLead(lead={},contact={},options={}){return Object.freeze({schemaVersion:1,createdAt:new Date().toISOString(),leadId:clean(lead.id),client:{name:clean(contact.name||lead.nome),company:clean(lead.empresa||lead.nome),cnpj:clean(lead.cnpj),ie:clean(lead.ie||lead.inscricaoEstadual),phone:clean(contact.phone||contact.whatsapp||lead.telefone),city:clean(lead.cidadeUf),internalCode:clean(lead.internalCode||lead.externalCode)},commercial:{installments:Math.max(1,Number(options.installments||6)||6),tier:clean(options.tier),freightText:clean(options.freightText),deliveryText:clean(options.deliveryText)},source:"sales_execution"});}
function store(payload,storage){const target=storage||root.sessionStorage;if(!target?.setItem)throw new Error("Session storage indisponível");target.setItem(KEY,JSON.stringify(payload));return clone(payload);}
function read(storage){const target=storage||root.sessionStorage;if(!target?.getItem)return null;try{const p=JSON.parse(target.getItem(KEY)||"null");return p&&p.schemaVersion===1?p:null}catch{return null}}
function clear(storage){const target=storage||root.sessionStorage;target?.removeItem?.(KEY);}
function launch(lead,contact={},options={}){const payload=store(payloadFromLead(lead,contact,options),options.storage);const url=clean(options.url)||"/legacy/?tab=cotacao&handoff=1";if(typeof root.open==="function"){const opened=root.open(url,options.target||"_blank","noopener");if(!opened&&root.location)root.location.href=url;}return{payload,url};}
return{KEY,payloadFromLead,store,read,clear,launch};
}));