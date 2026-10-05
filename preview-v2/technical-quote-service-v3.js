(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;root.DUTRA_TECHNICAL_QUOTE=api;}(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";

const clean=v=>String(v??"").trim();
const number=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clampInt=(v,min=0,max=9999)=>Math.min(max,Math.max(min,Math.round(number(v,min))));
const money=v=>number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function normalizedText(value){return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\bredutor(a|es|as)?\b/g,"reducao").replace(/\breduzido(a|s)?\b/g,"reducao").replace(/\btracionado\b/g,"tracado").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function ruleSearchText(rule={}){const values=[rule.name,rule.category,...(rule.keywords||[]),...(rule.applications||[])];for(const q of rule.questions||[]){values.push(q.question);for(const o of q.options||[])values.push(o.label,o.hint);}return normalizedText(values.filter(Boolean).join(" "));}
function searchRules(rules=[],query=""){const q=normalizedText(query);if(!q)return rules.slice();const stop=new Set(["com","sem","de","do","da","dos","das","e","ou","para","um","uma","o","a"]);const tokens=q.split(" ").filter(t=>t.length>1&&!stop.has(t));return rules.map((rule,index)=>{const text=ruleSearchText(rule);let score=text.includes(q)?40:0,matched=0;for(const token of tokens){if(text.includes(token)){matched++;score+=token.length>=5?6:4;}}if(tokens.length&&matched===tokens.length)score+=20;return{rule,index,score,matched};}).filter(x=>x.matched>0||x.score>=40).sort((a,b)=>b.score-a.score||b.matched-a.matched||a.index-b.index).map(x=>x.rule);}
function repriceLines(lines=[],installments=1){const normalized=(Array.isArray(lines)?lines:[]).map((line,index)=>({...line,id:clean(line.id)||("LINE-"+index),qty:clampInt(line.qty,0),unitPrice:Math.max(0,number(line.unitPrice)),total:clampInt(line.qty,0)*Math.max(0,number(line.unitPrice))})).filter(line=>line.qty>0);const subtotal=normalized.reduce((s,x)=>s+x.total,0),discount=Number(installments)===1?subtotal*.03:0,total=subtotal-discount;return{lines:normalized,subtotal,discount,total,totalPieces:normalized.reduce((s,x)=>s+x.qty,0),installmentValue:total/Math.max(1,clampInt(installments,1,10))};}
function applyManualAdjustments(quote={},input={}){const overrides=input.overrides&&typeof input.overrides==="object"?input.overrides:{},manual=Array.isArray(input.manualLines)?input.manualLines:[];const auto=(quote.lines||[]).map(line=>{const ov=overrides[line.code]||{};return{...line,qty:ov.qty==null?line.qty:clampInt(ov.qty,0),unitPrice:ov.unitPrice==null?line.unitPrice:Math.max(0,number(ov.unitPrice)),manualEdited:Boolean(overrides[line.code])};});const custom=manual.map((line,index)=>({id:clean(line.id)||("MANUAL-"+index),code:clean(line.code)||"MANUAL",name:clean(line.name)||"Item manual",category:clean(line.category)||"manual",internalCode:clean(line.internalCode),qty:clampInt(line.qty,0),unitPrice:Math.max(0,number(line.unitPrice)),position:clean(line.position)||"manual",manual:true,unresolved:false}));const priced=repriceLines([...auto,...custom],input.installments||quote.installments||1);return{...quote,...priced,installments:Math.max(1,clampInt(input.installments||quote.installments||1,1,10))};}
function visibleQuestions(rule,answers={}){
  return (rule?.questions||[]).filter(q=>{
    const cond=q.showIf;
    if(!cond)return true;
    return Object.entries(cond).every(([k,v])=>String(answers[k]??"")===String(v));
  });
}
function missingAnswers(rule,answers={}){
  return visibleQuestions(rule,answers).filter(q=>!clean(answers[q.id])).map(q=>q.id);
}
function adjustedAxles(rule,answers={}){
  const shared=globalThis.DUTRA_TECHNICAL_APPLICATION;
  if(shared?.resolveVehicleSupports&&rule?.id){
    const resolved=shared.resolveVehicleSupports(rule.id,answers);
    if(resolved?.axlesCount)return {...resolved.axlesCount};
  }
  const a={dianteiro:number(rule?.axles?.dianteiro),tracao:number(rule?.axles?.tracao),truck:number(rule?.axles?.truck),carreta:number(rule?.axles?.carreta)};
  if(rule?.id==="trucado_6x2_8x2"&&answers.is_bitruck==="8x2")a.dianteiro=2;
  if(rule?.id==="3_4"&&["sim_vw","sim_mb"].includes(answers.has_truck_3_4))a.truck=1;
  if(rule?.id==="bitrem_7eixos"){
    if(answers.traction_type==="6x2"){a.tracao=1;a.truck=1;}
    if(answers.traction_type==="6x4"){a.tracao=2;a.truck=0;}
  }
  return a;
}
function catalogItem(data,code){return (data?.catalog||[]).find(x=>clean(x.code).toUpperCase()===clean(code).toUpperCase())||null}
function answerOption(rule,answers,id){
  const q=(rule?.questions||[]).find(x=>x.id===id),value=answers[id];
  return q?.options?.find(o=>String(o.value)===String(value))||null;
}
function evidenceFor(rule,answers,code){
  const upper=clean(code).toUpperCase();
  for(const q of visibleQuestions(rule,answers)){
    const opt=answerOption(rule,answers,q.id);if(!opt)continue;
    const text=[opt.label,opt.hint].filter(Boolean).join(" ");
    if(text.toUpperCase().includes(upper))return clean(opt.hint||opt.label);
  }
  return "";
}
function brandKey(answers){return clean(answers.brand).toLowerCase()}
function supportDecision(rule,answers,position){
  const brand=brandKey(answers),reduction=answers.has_reduction,air=answers.scania_suspension;
  const confirmed=(code,reason)=>({position,code,status:"CONFIRMED",reason:reason||evidenceFor(rule,answers,code)||"Regra técnica da base OG"});
  const validate=(reason,alternatives=[])=>({position,code:null,status:"VALIDATE",reason,alternatives});

  if(position==="carreta")return confirmed("EQ-1135","Suporte universal de truck/carreta da base técnica OG.");

  if(rule?.id==="3_4"){
    if(position==="dianteiro"){
      if(answers.wheel_size==="19")return confirmed("EQ-1340");
      if(answers.wheel_size==="17")return confirmed("EQ-1320");
      return validate("Informe o aro da roda para definir o suporte dianteiro.");
    }
    if(position==="tracao")return confirmed("EQ-1155","Suporte de tração 3/4 universal da base técnica OG.");
    if(position==="truck"){
      if(answers.has_truck_3_4==="sim_vw")return confirmed("EQ-1155");
      if(answers.has_truck_3_4==="sim_mb")return confirmed("EQ-1145");
      return validate("Informe se existe 3º eixo e a marca para definir o suporte.");
    }
  }

  if(position==="dianteiro"){
    if(["scania","volvo"].includes(brand))return confirmed("EQ-1250");
    if(brand==="mb"){
      if(answers.mb_year==="lt2017")return confirmed("EQ-1300");
      if(answers.mb_year==="ge2017")return confirmed("EQ-1251");
      return validate("Informe o ano do Mercedes-Benz para definir o suporte dianteiro.",["EQ-1300","EQ-1251"]);
    }
    if(["vw","iveco","ford","outras"].includes(brand))return confirmed("EQ-1251");
    return validate("Informe a marca do veículo para definir o suporte dianteiro.");
  }

  if(position==="tracao"){
    if(reduction==="sim"){
      if(["scania","volvo"].includes(brand)){
        if(brand==="scania"&&air==="ar")return validate("Scania com suspensão a ar e cubo com redução: validar aplicação física antes da proposta.",["EQ-1390","EQ-1330"]);
        return confirmed("EQ-1330");
      }
      if(brand==="mb")return confirmed("EQ-1271");
      return validate("Cubo com redução informado, mas a base atual só define código explícito para Mercedes-Benz, Volvo e Scania.");
    }
    if(brand==="scania"){
      if(air==="ar")return confirmed("EQ-1390");
      if(air==="mola")return confirmed("EQ-1190");
      return validate("Informe o tipo de suspensão do Scania para definir a tração.",["EQ-1390","EQ-1190"]);
    }
    if(["volvo","mb","vw","iveco","ford","outras"].includes(brand))return confirmed("EQ-1145");
    return validate("Informe a marca para definir o suporte de tração.");
  }

  if(position==="truck"){
    if(brand==="scania"){
      if(air==="ar")return confirmed("EQ-1390");
      if(air==="mola")return confirmed("EQ-1135");
      return validate("Informe o tipo de suspensão do Scania para definir o Truck.",["EQ-1390","EQ-1135"]);
    }
    if(["volvo","mb","vw","iveco","ford","outras"].includes(brand))return confirmed("EQ-1135");
    return validate("Informe a marca para definir o suporte do Truck.");
  }
  return validate("Posição ainda não coberta pela regra atual.");
}
function technicalPositions(rule,answers={},options={}){
  const includeFront=options.includeFront!==false,shared=globalThis.DUTRA_TECHNICAL_APPLICATION,missing=missingAnswers(rule,answers);
  if(shared?.positionSupports&&rule?.id){
    return shared.positionSupports(rule.id,answers,includeFront).map(p=>({
      position:p.position,
      code:p.code,
      status:missing.length?"VALIDATE":"CONFIRMED",
      reason:missing.length?"Complete as perguntas técnicas antes de confirmar a aplicação.":"Regra técnica herdada do consultor OG.",
      alternatives:[],
      axles:p.axles,
      qtyPerVehicle:p.qtyPerVehicle
    }));
  }
  const ax=adjustedAxles(rule,answers),positions=[];
  if(includeFront&&ax.dianteiro>0)positions.push({...supportDecision(rule,answers,"dianteiro"),axles:ax.dianteiro,qtyPerVehicle:ax.dianteiro*2});
  if(ax.tracao>0)positions.push({...supportDecision(rule,answers,"tracao"),axles:ax.tracao,qtyPerVehicle:ax.tracao*2});
  if(ax.truck>0)positions.push({...supportDecision(rule,answers,"truck"),axles:ax.truck,qtyPerVehicle:ax.truck*2});
  if(ax.carreta>0)positions.push({...supportDecision(rule,answers,"carreta"),axles:ax.carreta,qtyPerVehicle:ax.carreta*2});
  return positions;
}
function tierUnitPrice(item,tier){
  if(!item)return 0;
  if(item.category==="equalizador")return number(tier?.equalizador,item.priceBase);
  if(item.category==="suporte")return number(tier?.suporte,item.priceBase);
  if(item.category==="mangueira")return number(tier?.mangueira,item.priceBase);
  if(item.code==="EQ-512")return number(tier?.bicoGiratorio,item.priceBase);
  if(item.code==="EQ-518")return number(tier?.bicoEnchimento,item.priceBase);
  if(item.code==="EQ-529")return number(tier?.anelVedacao,item.priceBase);
  return number(item.priceBase);
}
function addLine(lines,data,tier,code,qty,meta={}){
  qty=clampInt(qty,0);if(!qty)return;
  const item=catalogItem(data,code);
  const unit=tierUnitPrice(item,tier);
  const existing=lines.find(x=>x.code===code&&!x.unresolved);
  if(existing){existing.qty+=qty;existing.total=existing.qty*existing.unitPrice;return}
  lines.push({code,name:item?.name||code,category:item?.category||meta.category||"item",internalCode:item?.internalCode||"",qty,unitPrice:unit,total:unit*qty,desc:item?.desc||"",unresolved:false,...meta});
}
function buildQuote(rule,answers={},options={},data={}){
  if(!rule)throw new Error("Selecione um tipo de veículo.");
  const qty=clampInt(options.qty||1,1,999),psi=[110,115,120].includes(number(options.psi))?number(options.psi):110,includeFront=Boolean(options.includeFront),installments=clampInt(options.installments||6,1,10);
  const tierKey=clean(options.tierKey||"lead_ie"),tier=data?.pricingTiers?.[tierKey]||data?.pricingTiers?.lead_ie||{};
  const ax=adjustedAxles(rule,answers),rearEq=(ax.tracao+ax.truck+ax.carreta)*2,frontEq=includeFront?ax.dianteiro*2:0,positions=technicalPositions(rule,answers,{includeFront});
  const lines=[];
  addLine(lines,data,tier,`EQ-${psi}`,rearEq*qty,{position:"traseiro"});
  if(frontEq)addLine(lines,data,tier,`EQ-${psi}D`,frontEq*qty,{position:"dianteiro"});
  for(const p of positions){
    if(p.code)addLine(lines,data,tier,p.code,p.qtyPerVehicle*qty,{position:p.position,status:p.status});
    else{
      const q=p.qtyPerVehicle*qty,unit=number(tier.suporte,22);
      lines.push({code:"SUPORTE-A-DEFINIR",name:"Suporte a validar",category:"suporte",internalCode:"",qty:q,unitPrice:unit,total:q*unit,unresolved:true,position:p.position,reason:p.reason,alternatives:p.alternatives||[]});
    }
  }
  if(rearEq){addLine(lines,data,tier,"EQ-1040",rearEq*qty,{position:"mangueira interna"});addLine(lines,data,tier,"EQ-1043",rearEq*qty,{position:"mangueira externa"});}
  if(frontEq)addLine(lines,data,tier,"EQ-1041",frontEq*qty,{position:"mangueira dianteira"});
  for(const extra of Array.isArray(options.extras)?options.extras:[])addLine(lines,data,tier,clean(extra.code).toUpperCase(),clampInt(extra.qty,0),{position:"extra"});

  const subtotal=lines.reduce((s,x)=>s+x.total,0),discount=installments===1?subtotal*.03:0,total=subtotal-discount,totalPieces=lines.reduce((s,x)=>s+x.qty,0),tiresPerVehicle=rearEq*2+frontEq,totalTires=tiresPerVehicle*qty;
  const missing=missingAnswers(rule,answers),unresolved=positions.filter(p=>p.status!=="CONFIRMED");
  return{
    ruleId:rule.id,vehicleName:rule.name,category:rule.category,applications:rule.applications||[],answers:{...answers},axles:ax,qty,psi,includeFront,tierKey,tierName:tier.name||tierKey,installments,
    rearEqualizersPerVehicle:rearEq,frontEqualizersPerVehicle:frontEq,tiresPerVehicle,totalTires,totalPieces,positions,lines,missingAnswers:missing,
    technicallyReady:missing.length===0&&unresolved.length===0,unresolved,engineSource:globalThis.DUTRA_TECHNICAL_APPLICATION?'OG_LEGACY_SHARED':'V3_FALLBACK',
    subtotal,discount,total,installmentValue:total/installments
  };
}
function searchCatalog(data,query="",category="all"){
  const q=clean(query).toLowerCase();
  return (data?.catalog||[]).filter(item=>(category==="all"||item.category===category)&&(!q||[item.code,item.internalCode,item.name,item.desc,item.category].some(v=>clean(v).toLowerCase().includes(q)))).slice(0,60);
}
function summaryText(quote,client={}){
  if(!quote)return"";
  const supports=quote.positions.map(p=>p.code?`${p.position}: ${p.code} × ${p.qtyPerVehicle*quote.qty}`:`${p.position}: VALIDAR × ${p.qtyPerVehicle*quote.qty}`).join(" | ");
  return[
    "🐾 OLHO DE GATO — PRÉ-ORÇAMENTO TÉCNICO",
    client?.empresa?`Cliente: ${client.empresa}`:"",
    `Veículo: ${quote.qty}× ${quote.vehicleName}`,
    `Pressão: ${quote.psi} PSI · ${quote.includeFront?"com dianteira":"traseiros/tração"}`,
    `Pneus atendidos: ${quote.totalTires}`,
    `Suportes: ${supports}`,
    `Peças calculadas: ${quote.totalPieces}`,
    `Tabela: ${quote.tierName}`,
    `Total estimado: ${money(quote.total)}`,
    `Condição simulada: ${quote.installments}x de ${money(quote.installmentValue)}`,
    quote.technicallyReady?"Aplicação técnica preenchida.":"⚠️ Existem pontos técnicos a validar antes da proposta oficial.",
    "Valores e aplicação devem ser revisados no motor oficial antes do envio."
  ].filter(Boolean).join("\n");
}
return{normalizedText,ruleSearchText,searchRules,repriceLines,applyManualAdjustments,visibleQuestions,missingAnswers,adjustedAxles,supportDecision,technicalPositions,catalogItem,tierUnitPrice,buildQuote,searchCatalog,summaryText};
}));