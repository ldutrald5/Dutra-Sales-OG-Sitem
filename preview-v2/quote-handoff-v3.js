(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;root.DUTRA_QUOTE_HANDOFF=api;}(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
const KEY="dutra_quote_handoff_v1";
const clean=v=>String(v??"").trim();
const clone=v=>JSON.parse(JSON.stringify(v??null));
function safeVisuals(input){return{items:(Array.isArray(input)?input:[]).slice(0,3).map(item=>({assetId:clean(item?.assetId).slice(0,80),versionId:clean(item?.versionId).slice(0,80),category:clean(item?.category).toUpperCase().slice(0,60),title:clean(item?.title).slice(0,160),usagePolicy:clean(item?.usagePolicy).toUpperCase().slice(0,60),sensitivityLevel:clean(item?.sensitivityLevel).toUpperCase().slice(0,60)})).filter(item=>item.assetId&&item.versionId&&item.usagePolicy==="PROPOSAL_ALLOWED"&&item.sensitivityLevel!=="CONFIDENTIAL")};}
function payloadFromLead(lead={},contact={},options={}){const tech=options.technical&&typeof options.technical==="object"?options.technical:{};return Object.freeze({schemaVersion:1,createdAt:new Date().toISOString(),leadId:clean(lead.id),client:{name:clean(contact.name||lead.nome),company:clean(lead.empresa||lead.nome),cnpj:clean(lead.cnpj),ie:clean(lead.ie||lead.inscricaoEstadual),phone:clean(contact.phone||contact.whatsapp||lead.telefone),city:clean(lead.cidadeUf),internalCode:clean(lead.internalCode||lead.externalCode)},commercial:{installments:Math.max(1,Number(options.installments||6)||6),tier:clean(options.tier),freightText:clean(options.freightText),deliveryText:clean(options.deliveryText)},technical:tech&&clean(tech.vehicleName)?{ruleId:clean(tech.ruleId),vehicleName:clean(tech.vehicleName),qty:Math.max(1,Number(tech.qty||1)||1),psi:Number(tech.psi)||null,includeFront:Boolean(tech.includeFront),answers:tech.answers&&typeof tech.answers==="object"?clone(tech.answers):{},lines:(Array.isArray(tech.lines)?tech.lines:[]).slice(0,80).map(x=>({code:clean(x.code),name:clean(x.name),qty:Math.max(0,Number(x.qty)||0),unitPrice:Math.max(0,Number(x.unitPrice)||0),manual:Boolean(x.manual)})).filter(x=>x.code&&x.qty),totalTires:Math.max(0,Number(tech.totalTires)||0),totalPieces:Math.max(0,Number(tech.totalPieces)||0),estimatedTotal:Math.max(0,Number(tech.estimatedTotal)||0),manualMode:Boolean(tech.manualMode),note:clean(tech.note)}:null,visuals:safeVisuals(options.visuals),source:"sales_execution"});}
function store(payload,storage){const target=storage||root.sessionStorage;if(!target?.setItem)throw new Error("Session storage indisponível");target.setItem(KEY,JSON.stringify(payload));return clone(payload);}
function read(storage){const target=storage||root.sessionStorage;if(!target?.getItem)return null;try{const p=JSON.parse(target.getItem(KEY)||"null");return p&&p.schemaVersion===1?p:null}catch{return null}}
function clear(storage){const target=storage||root.sessionStorage;target?.removeItem?.(KEY);}
function legacyUrl(options={}){return clean(options.url)||"/legacy/?tab=cotacao&handoff=1&embedded=1";}
function launchLegacy(lead,contact={},options={}){const payload=store(payloadFromLead(lead,contact,options),options.storage),url=legacyUrl(options);if(typeof root.open==="function"){const opened=root.open(url,options.target||"_blank","noopener");if(!opened&&root.location)root.location.href=url;}return{payload,url,mode:"legacy-window"};}
function launch(lead,contact={},options={}){
  const payload=store(payloadFromLead(lead,contact,options),options.storage),url=legacyUrl(options);
  if(options.openLegacyWindow===true)return launchLegacy(lead,contact,options);
  try{root.dispatchEvent?.(new CustomEvent("dutra:quote-handoff",{detail:{payload,url}}));}catch{}
  if(typeof root.go==="function")root.go("proposal");
  else if(root.location)root.location.hash="proposal";
  return{payload,url,mode:"integrated"};
}
return{KEY,safeVisuals,payloadFromLead,store,read,clear,legacyUrl,launchLegacy,launch};
}));