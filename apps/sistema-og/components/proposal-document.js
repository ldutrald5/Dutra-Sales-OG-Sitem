/* One snapshot-derived client document for screen, browser PDF and PNG. */
(function attach(root,factory){const api=factory(root);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OG_PROPOSAL_DOCUMENT=api;}(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=value=>value==null?'VALIDAR':Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const scopes={cavalo:'CAVALO / CAMINHÃO',carreta:'CARRETA / IMPLEMENTO',outro:'OUTRO',validar:'VALIDAR'};
  const sectionLabels={customer:'Dados do cliente',vehicles:'Resumo dos veículos',application:'Cavalo × Carreta e caminho',parts:'Peças e valores',conditions:'Condições comerciais',roi:'ROI / payback',assumptions:'Premissas e fórmula',disclaimer:'Validação técnica',observations:'Observações'};
  const PAGE_WIDTH=794,PAGE_HEIGHT=1123,MAX_PAGES=24;
  // Explicit document styles also travel with the export; no application CSS/font dependency.
  const classicCss=`.client-document{color:#19202d;background:white;font:14px/1.55 Arial,Helvetica,sans-serif;overflow-wrap:anywhere;text-align:left;box-sizing:border-box;min-width:0;container-type:inline-size}.client-document *{box-sizing:border-box}.client-document .client-paper-page{background:#fff;color:#19202d;padding:32px;position:relative;min-width:0}.client-document .client-doc-header{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:3px solid #e4b700;padding-bottom:18px;margin-bottom:20px}.client-document .client-brand{font-size:23px;font-weight:900;letter-spacing:-.5px;color:#111827}.client-document .client-brand small{display:block;font-size:10px;letter-spacing:1px;font-weight:600;color:#4b5563}.client-document img{object-fit:contain;max-width:150px;max-height:65px;width:150px;height:65px}.client-document h2{font:800 24px/1.2 Arial;margin:5px 0 12px;color:#111827}.client-document h3{font:750 17px/1.4 Arial;margin:0 0 8px;color:#111827}.client-document h4{font:700 13px/1.5 Arial;margin:0 0 4px;color:#765900}.client-document p{font:14px/1.55 Arial;color:#374151;margin:5px 0}.client-document .client-meta{font-size:11px;color:#5c6574}.client-document .client-block{margin:0 0 16px;break-inside:avoid;page-break-inside:avoid;min-width:0}.client-document .client-intro{white-space:pre-wrap}.client-document .client-investment{background:#f6f5ec;border:1px solid #e3dcc1;border-radius:8px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:center}.client-document .client-investment strong{font-size:26px;white-space:nowrap;color:#151a23}.client-document .client-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.client-document .client-metric{padding:10px;border:1px solid #d7dce2;border-radius:7px}.client-document .client-metric small{display:block;color:#56616f;font-size:11px}.client-document .client-metric strong{font-size:18px;color:#111827}.client-document .client-part{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;border-bottom:1px solid #e3e7eb;padding:9px 0}.client-document .client-part strong{white-space:nowrap;font-size:13px}.client-document code{font:700 13px Arial;color:#111827}.client-document .client-path{font-size:11px;color:#58606b;margin-top:6px}.client-document .client-validate{border-left:3px solid #b58b00;padding:10px;background:#fffaf0}.client-document .client-doc-footer{border-top:1px solid #dce0e5;margin-top:20px;padding-top:10px;color:#596170;font-size:10px;display:flex;justify-content:space-between;gap:12px}.client-document .client-doc-footer span{overflow-wrap:anywhere}.client-document .client-block[data-kind=heading]{margin-bottom:8px}.client-document[data-template=compacto] .client-block{margin-bottom:12px}.client-document[data-template=compacto] h2{font-size:21px}.client-document[data-template=executivo] .client-investment{padding:22px}.client-document .client-page-body{min-width:0}.client-document .client-paper-page+.client-paper-page{border-top:8px solid #e5e7eb}@container(max-width:600px){.client-document .client-paper-page{padding:16px}.client-document h2{font-size:21px}.client-document .client-doc-header{gap:10px}.client-document img{max-width:95px;max-height:50px}.client-document .client-investment{flex-wrap:wrap;padding:14px}.client-document .client-investment strong{font-size:23px}.client-document .client-part{gap:8px}.client-document .client-brand{font-size:19px}.client-document .client-meta{font-size:10px}}@media print{.client-document{font-size:10.5pt}.client-document .client-paper-page{padding:8.4mm!important;width:210mm!important;min-height:297mm!important;break-after:page;page-break-after:always;border:0!important}.client-document .client-paper-page:last-child{break-after:auto;page-break-after:auto}.client-document .client-block{break-inside:avoid;page-break-inside:avoid}.client-document h3,.client-document h4{break-after:avoid;page-break-after:avoid}.client-document .client-doc-header{display:flex!important}.client-document .client-part{break-inside:avoid}.client-document .client-doc-footer{break-inside:avoid}@page{size:A4 portrait;margin:0}}`;
  const impactoCss=`.client-document[data-theme=impacto-og]{--og-yellow:#ffdf00;--og-black:#10151c}
.client-document[data-theme=impacto-og] .client-doc-header{border-color:#ffdf00;flex-wrap:wrap}.client-document[data-theme=impacto-og] .client-brand{min-width:0;max-width:100%}
.client-document[data-theme=impacto-og] .client-brand .impacto-eye{display:inline-block;width:30px;height:18px;vertical-align:middle;margin-left:4px}
.client-document[data-theme=impacto-og] .impacto-opening{background:#ffdf00;border-radius:12px;overflow:hidden;color:#fff;position:relative}
.client-document[data-theme=impacto-og] .impacto-opening-copy{position:relative;background:#10151c;border-bottom-right-radius:42% 48px;padding:30px 28px 20px}
.client-document[data-theme=impacto-og] .impacto-kicker{color:#ffdf00;font-size:11px;letter-spacing:2px;font-weight:700}
.client-document[data-theme=impacto-og] .impacto-opening h2{font-size:50px;line-height:1.02;font-weight:900;letter-spacing:-2px;color:#fff;margin:16px 0;max-width:20ch}
.client-document[data-theme=impacto-og] .impacto-opening em{color:#ffdf00;font-style:normal}
.client-document[data-theme=impacto-og] .impacto-opening p{color:#fff}
.client-document[data-theme=impacto-og] .impacto-opening .impacto-benefit{font-size:14px;color:#e6e9ee;letter-spacing:.6px}
.client-document[data-theme=impacto-og] .impacto-recipient{font-size:20px;font-weight:800;margin:16px 0 8px}
.client-document[data-theme=impacto-og] .impacto-tires{display:flex;gap:12px;align-items:center;line-height:1.25;color:#e6e9ee}
.client-document[data-theme=impacto-og] .impacto-tires b{font-size:40px;color:#ffdf00}
.client-document[data-theme=impacto-og] img.impacto-hero{display:block;width:100%;height:230px;max-width:none;max-height:none;object-fit:cover;object-position:center 65%}
.client-document[data-theme=impacto-og] .impacto-opening-footer{background:#10151c;display:flex;align-items:center;gap:12px;padding:10px 20px;font-size:10px;color:#e6e9ee}
.client-document[data-theme=impacto-og] .impacto-eye{width:45px;height:22px;flex-shrink:0}
.client-document[data-theme=impacto-og] .impacto-vehicle-card{border:1px solid #d8dce2;border-radius:12px;padding:18px;overflow:hidden;background:white}
.client-document[data-theme=impacto-og] .impacto-card-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#10151c;color:#fff;margin:-18px -18px 16px;padding:14px 18px;font-size:11px;letter-spacing:1px}
.client-document[data-theme=impacto-og] .impacto-card-heading b{background:#ffdf00;color:#10151c;padding:4px 10px;border-radius:4px;font-size:22px;white-space:nowrap}
.client-document[data-theme=impacto-og] .impacto-vehicle-card h4{font-size:23px;line-height:1.25;color:#10151c;letter-spacing:-.5px}
.client-document[data-theme=impacto-og] img.impacto-vehicle-art{display:block;width:100%;height:175px;max-width:none;max-height:none;object-fit:contain}
.client-document[data-theme=impacto-og] .impacto-trailer{display:block;height:160px;width:100%}
.client-document[data-theme=impacto-og] .impacto-no-media{padding:22px 12px;background:#f4f5f6;border:1px dashed #b6bec8;color:#3b4655;text-align:center;font-size:12px}
.client-document[data-theme=impacto-og] .client-investment{background:#ffdf00;border-color:#ffdf00;border-radius:12px}
.client-document[data-theme=impacto-og] .client-investment strong{font-size:32px;font-weight:900;letter-spacing:-1px}
.client-document[data-theme=impacto-og] .client-investment p{color:#19202d}
.client-document[data-theme=impacto-og] .impacto-economy{position:relative;background:#ffdf00;color:#10151c;padding:68px 22px 22px;border-radius:12px;margin:16px 0}
.client-document[data-theme=impacto-og] .impacto-black-band{position:absolute;top:0;left:0;width:100%;height:42px;border-bottom-right-radius:55% 100%;background:#10151c;padding:8px 18px;text-align:right}
.client-document[data-theme=impacto-og] .impacto-black-band .impacto-eye{display:inline-block}
.client-document[data-theme=impacto-og] .impacto-economy>span{display:block;text-transform:uppercase;font-size:11px;letter-spacing:1px;font-weight:700}
.client-document[data-theme=impacto-og] .impacto-economy>strong{display:block;font-size:46px;line-height:1.2;letter-spacing:-1.5px;font-weight:900;color:#10151c}
.client-document[data-theme=impacto-og] .impacto-economy small{font-size:16px;letter-spacing:0}
.client-document[data-theme=impacto-og] .impacto-premise{border-bottom:1px solid #e3e7eb;padding:6px 0}
.client-document[data-theme=impacto-og] .client-block[data-kind=premise]{margin-bottom:4px}
.client-document[data-theme=impacto-og] .client-validate{color:#574309}
.client-document[data-theme=impacto-og][data-template=compacto] .impacto-opening h2{font-size:36px}
.client-document[data-theme=impacto-og][data-template=compacto] img.impacto-hero{height:150px}
@container(max-width:600px){.client-document[data-theme=impacto-og] .impacto-opening-copy{padding:22px 16px 20px}
.client-document[data-theme=impacto-og] .impacto-opening h2{font-size:39px}
.client-document[data-theme=impacto-og] img.impacto-hero{height:175px}
.client-document[data-theme=impacto-og] .impacto-recipient{font-size:17px}
.client-document[data-theme=impacto-og] .impacto-vehicle-card{padding:14px}
.client-document[data-theme=impacto-og] .impacto-card-heading{margin:-14px -14px 14px;padding:12px 14px}
.client-document[data-theme=impacto-og] .client-grid{grid-template-columns:1fr}
.client-document[data-theme=impacto-og] .client-metric strong{font-size:19px}
.client-document[data-theme=impacto-og] .client-investment strong{font-size:27px}
.client-document[data-theme=impacto-og] .impacto-economy{padding:60px 14px 20px}
.client-document[data-theme=impacto-og] .impacto-economy>strong{font-size:34px;letter-spacing:-1px}
.client-document[data-theme=impacto-og] .impacto-economy small{font-size:13px}}
@media print{.client-document[data-theme=impacto-og]{print-color-adjust:exact;-webkit-print-color-adjust:exact}
.client-document[data-theme=impacto-og] .impacto-opening,.client-document[data-theme=impacto-og] .impacto-vehicle-card,.client-document[data-theme=impacto-og] .impacto-economy{break-inside:avoid;page-break-inside:avoid}}`;
  const css=classicCss+impactoCss;
  // Versioned, first-party concept art: never a photograph/evidence of the customer's fleet.
  const MEDIA_V1=Object.freeze({hero:'/assets/premium/impacto-og-v1/hero.webp',tractor:'/assets/premium/impacto-og-v1/tractor-4x2.png'});
  const mediaCache=new Map();
  const isImpacto=p=>p?.themeId==='impacto-og'&&p.themeVersion===1;
  const decimal=value=>Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  function mediaKind(vehicle){
    const scope=vehicle.technicalContext?.applicationScope;
    if(scope==='cavalo'&&vehicle.vehicleTypeId==='toco_4x2')return 'tractor';
    if(scope==='carreta'&&vehicle.vehicleTypeId==='trucado_carreta3')return 'trailer';
    return 'unavailable';
  }
  async function resolveMedia(presentation){
    if(!isImpacto(presentation))return {};
    return Object.fromEntries(await Promise.all(Object.entries(MEDIA_V1).map(async([key,path])=>{
      if(!mediaCache.has(path))mediaCache.set(path,(async()=>{
        const response=await root.fetch(path,{credentials:'same-origin',redirect:'error'});
        if(!response.ok)throw new Error('Ilustração indisponível');
        const blob=await response.blob();
        if(!['image/png','image/webp'].includes(blob.type)||blob.size>2000000)throw new Error('Formato de ilustração inválido');
        const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Leitura de ilustração indisponível'));reader.readAsDataURL(blob);});
        const image=new Image();image.src=data;await image.decode();
        if(image.naturalWidth>4096||image.naturalHeight>4096)throw new Error('Dimensões inválidas');
        return data;
      })());
      try{return [key,await mediaCache.get(path)];}catch{mediaCache.delete(path);return [key,''];}
    })));
  }
  const catEye='<svg class="impacto-eye" viewBox="0 0 90 38" aria-hidden="true"><path fill="#ffdf00" d="M3 19Q20-7 87 6Q70 46 3 19Z"/><ellipse cx="47" cy="20" rx="14" ry="11" fill="#10151c"/></svg>';
  const trailerArt='<svg class="impacto-trailer" viewBox="0 0 480 190" role="img" aria-label="Esquema conceitual de implemento com três eixos; não representa modelo específico"><rect x="35" y="24" width="410" height="104" rx="5" fill="#19202d"/><path d="M35 128H445M88 132V162M94 162H120" stroke="#596170" stroke-width="7" fill="none"/><path d="M45 35H430" stroke="#ffdf00" stroke-width="4"/><g fill="#19202d" stroke="#929ba5" stroke-width="6"><circle cx="320" cy="151" r="23"/><circle cx="370" cy="151" r="23"/><circle cx="420" cy="151" r="23"/></g></svg>';
  function vehicleArt(vehicle,options){
    const kind=mediaKind(vehicle),src=options.media?options.media.tractor:MEDIA_V1.tractor;
    if(kind==='tractor'&&src)return `<img class="impacto-vehicle-art" src="${escape(src)}" alt="Ilustração conceitual de cavalo 4×2: dois eixos, sem carreta"/><p class="client-meta">Ilustração conceitual OG · não representa marca/modelo ou frota do cliente.</p>`;
    if(kind==='trailer')return trailerArt+'<p class="client-meta">Esquema conceitual · três eixos do implemento; não é foto da frota.</p>';
    return '<div class="impacto-no-media" data-media-unavailable>Configuração apresentada por dados técnicos.<br/>Sem ilustração compatível disponível.</div>';
  }
  function vehicleCard(vehicle,options){
    const scope=vehicle.technicalContext?.applicationScope||'validar';
    const scopeLabel=scopes[scope]||'CONJUNTO / VALIDAR';
    const configuration=(vehicle.applicationRows||[]).find(row=>row.path?.length>1)?.path[1]||vehicle.vehicleTypeId;
    const details=[configuration,vehicle.libras?`${vehicle.libras} libras`:null,scope==='carreta'?null:vehicle.includeDianteira?'Aplicação com dianteira':'Aplicação sem dianteira'].filter(Boolean);
    return `<section class="impacto-vehicle-card" data-proposal-vehicle-id="${escape(vehicle.id)}" data-media-kind="${mediaKind(vehicle)}"><div class="impacto-card-heading"><span>${scopeLabel}</span><b>${vehicle.qty} ×</b></div><h4>${escape(vehicle.name||vehicle.vehicleTypeId)}</h4><p class="client-meta">${details.map(escape).join(' · ')}</p>${vehicleArt(vehicle,options)}<div class="client-grid"><div class="client-metric"><small>Por veículo · aplicação unitária</small><strong>${money(vehicle.unitSubtotal)}</strong></div><div class="client-metric"><small>Subtotal · ${vehicle.qty} veículos</small><strong>${money(vehicle.totalSubtotal)}</strong></div></div><p class="client-meta">${vehicle.totalTires??'VALIDAR'} pneus atendidos neste grupo. Quantidades e preços da cotação.</p></section>`;
  }
  const paragraph=(text,kind='paragraph')=>({kind,html:`<p class="client-intro">${escape(text)}</p>`});
  function viewModel(snapshot,record,options={}){
    root.OG_PROPOSAL_INTELLIGENCE.validatePublicSnapshot(snapshot);
    const presentation=root.OG_PROPOSAL_INTELLIGENCE.normalizePresentation(options.presentation||snapshot.presentation,snapshot.clientId);
    const sections=presentation.sections,text=presentation.text,commercial=snapshot.commercial,blocks=[],impacto=isImpacto(presentation);
    const add=(section,block)=>{if(sections[section])blocks.push({...block,section});};
    const heading=(section,title)=>add(section,{kind:'heading',html:`<h3>${escape(title)}</h3>`});
    const company=snapshot.client.company||snapshot.client.name||'Cliente não informado';
    if(impacto){
      const hero=options.media?options.media.hero:MEDIA_V1.hero;
      blocks.push({kind:'identity',html:`<section class="impacto-opening"><div class="impacto-opening-copy"><span class="impacto-kicker">PROPOSTA PARA SUA OPERAÇÃO</span><h2>${text.title?escape(text.title):'Pressão<br/><em>sob controle.</em>'}</h2><p class="impacto-benefit">Equalização de pressão.<br/>Mais controle para a sua operação.</p><p class="impacto-recipient">${escape(company)}</p><div class="impacto-tires"><b>${commercial.totalTires??'VALIDAR'}</b><span>pneus atendidos<br/>nesta composição</span></div></div>${hero?`<img class="impacto-hero" src="${escape(hero)}" alt="Caminhão conceitual OG; não é fotografia da frota do cliente"/>`:'<p class="impacto-no-media">Imagem conceitual indisponível. Composição técnica preservada.</p>'}<div class="impacto-opening-footer">${catEye}<span>Imagem conceitual OG · não representa a frota do cliente</span></div></section><p class="client-meta">${record?`Versão ${escape(record.version)} · ${escape(new Date(record.preparedAt).toLocaleDateString('pt-BR'))}`:'Prévia · em revisão'}${commercial.seller?` · ${escape(commercial.seller)}`:''}${record?` · ${options.sentConfirmed?'ENVIO CONFIRMADO PELO USUÁRIO':'PREPARADA · envio exige confirmação'}`:''}</p>`});
    }else{
    blocks.push({kind:'identity',html:`<h2>${escape(text.title||'Proposta comercial')}</h2><p><b>${escape(company)}</b></p><p class="client-meta">${record?`Versão ${escape(record.version)} · ${escape(new Date(record.preparedAt).toLocaleDateString('pt-BR'))}`:'Prévia · em revisão'}${commercial.seller?` · ${escape(commercial.seller)}`:''}</p>${record?`<p class="client-meta">${options.sentConfirmed?'ENVIO CONFIRMADO PELO USUÁRIO':'PREPARADA · envio exige confirmação'}</p>`:''}`});
    }
    if(text.introduction)blocks.push(paragraph(text.introduction));
    if(sections.customer)add('customer',paragraph([snapshot.client.name&&`Contato: ${snapshot.client.name}`,snapshot.client.cnpj&&`CNPJ: ${snapshot.client.cnpj}`,snapshot.client.city].filter(Boolean).join(' · ')));

    if(!impacto)blocks.push({kind:'investment',html:`<div class="client-investment"><div><b>Investimento da solução</b><p>${commercial.totalPieces} peças · ${commercial.totalTires??'VALIDAR'} pneus atendidos${commercial.totalVehicles!=null?` · ${commercial.totalVehicles} veículos`:''}</p></div><strong data-proposal-total>${money(commercial.totalValue)}</strong></div>`});
    if(impacto&&sections.vehicles){heading('vehicles','Sua frota. Uma composição clara.');for(const vehicle of snapshot.vehicles)add('vehicles',{kind:'vehicle',html:vehicleCard(vehicle,options)});}
    else if(sections.vehicles){heading('vehicles','Configurações atendidas');for(const vehicle of snapshot.vehicles)add('vehicles',{kind:'vehicle',html:`<div data-proposal-vehicle-id="${escape(vehicle.id)}"><b>${escape(vehicle.name||vehicle.vehicleTypeId)}</b><p>${vehicle.qty} veículos · ${money(vehicle.totalSubtotal)}</p><p class="client-meta">${vehicle.libras?`${vehicle.libras} libras · `:''}${vehicle.technicalContext?.applicationScope==='carreta'?'':vehicle.includeDianteira?'Com dianteira':'Sem dianteira'}</p></div>`});}
    if(impacto)blocks.push({kind:'investment',html:`<div class="client-investment"><div><b>Investimento da solução</b><p>${commercial.totalPieces} peças · ${commercial.totalTires??'VALIDAR'} pneus atendidos${commercial.totalVehicles!=null?` · ${commercial.totalVehicles} veículos`:''}</p></div><strong data-proposal-total>${money(commercial.totalValue)}</strong></div>`});
    if(sections.application){heading('application','Aplicação por veículo / conjunto');for(const vehicle of snapshot.vehicles){for(const [scope,label] of Object.entries(scopes)){const rows=(vehicle.applicationRows||[]).filter(row=>row.scope===scope);if(!rows.length)continue;add('application',{kind:'heading',html:`<div data-proposal-scope="${scope}"><h4>${escape(vehicle.name)} · ${label}</h4></div>`});for(const row of rows)add('application',{kind:'part',html:`<div class="client-part" data-application-scope="${scope}" data-proposal-part="${escape(row.code)}" data-proposal-quantity="${row.qty*vehicle.qty}"><div><code>${escape(row.code)}</code> · ${escape(row.name)}<p class="client-path">${row.qty} por veículo × ${vehicle.qty} · ${row.status==='runtime'?'CONFIRMADO NO MOTOR':'VALIDAR'} · ${escape(row.origin)}</p><p class="client-path">Caminho: ${row.path.map(escape).join(' → ')}</p></div><strong>${row.qty*vehicle.qty} peças</strong></div>`});}if(!(vehicle.applicationRows||[]).length)add('application',paragraph(`${vehicle.name}: VALIDAR · origem técnica não disponível neste histórico.`));}}
    if(sections.parts){heading('parts','Peças e valores');for(const vehicle of snapshot.vehicles){add('parts',{kind:'heading',html:`<h4>${escape(vehicle.name)} · ${vehicle.qty} veículos</h4>`});for(const item of vehicle.calculatedItems||vehicle.items)add('parts',{kind:'part',html:`<div class="client-part"><div><code>${escape(item.code)}</code> · ${escape(item.name||'')}<p class="client-meta">${item.qty} por veículo × ${vehicle.qty} · unitário ${money(item.priceUnit)}${item.isCustomPrice?' · preço ajustado':''}</p></div><strong>${item.qty*vehicle.qty} peças<br/>${money(item.subtotal==null?null:item.subtotal*vehicle.qty)}</strong></div>`});}for(const item of snapshot.extraItems)add('parts',{kind:'part',html:`<div class="client-part"><div><code>${escape(item.code)}</code> · ${escape(item.name||'')}<p class="client-meta">Extra / manual · ${item.qty} peças</p></div><strong>${money(item.subtotal)}</strong></div>`});}
    if(sections.conditions){heading('conditions','Condições comerciais');add('conditions',paragraph(`Produtos: ${money(commercial.subtotalProducts)} · Taxa do meio de pagamento: ${money(commercial.cardFee)}`));if(commercial.installments)add('conditions',paragraph(`${commercial.installments} parcelas de ${money(commercial.installmentValue)}`));for(const [label,value] of [['Pagamento',commercial.paymentTerms],['Frete',commercial.freightText],['Entrega',text.deliveryNote||commercial.deliveryText],['Validade',text.validityText||commercial.validUntil]])if(value)add('conditions',paragraph(`${label}: ${value}`));}
    if(sections.roi){const roi=snapshot.roi;heading('roi','Cenário econômico estimado');if(roi?.status==='ready'){add('roi',{kind:'roi',html:impacto?`<div data-proposal-roi-status="ready"><p class="client-validate">SIMULAÇÃO ESTIMADA · premissas revisadas, não garantia de resultado.</p><div class="impacto-economy"><div class="impacto-black-band">${catEye}</div><span>Economia mensal estimada</span><strong data-proposal-monthly>${money(roi.monthlySavings)}<small>/mês</small></strong></div><div class="client-grid"><div class="client-metric"><small>Economia anual estimada</small><strong>${money(roi.annualSavings)}</strong></div><div class="client-metric"><small>Payback estimado</small><strong data-proposal-payback>${roi.paybackMonths==null?'Sem retorno neste cenário':decimal(roi.paybackMonths)+' meses'}</strong></div></div></div>`:`<div class="client-grid" data-proposal-roi-status="ready"><div class="client-metric"><small>Economia mensal estimada</small><strong data-proposal-monthly>${money(roi.monthlySavings)}</strong></div><div class="client-metric"><small>Economia anual estimada</small><strong>${money(roi.annualSavings)}</strong></div><div class="client-metric"><small>Payback estimado</small><strong data-proposal-payback>${roi.paybackMonths==null?'Sem retorno neste cenário':roi.paybackMonths.toFixed(2)+' meses'}</strong></div></div>`});add('roi',paragraph('Simulação com premissas revisadas. Não constitui garantia de resultado.'));}else add('roi',{kind:'roi',html:`<p class="client-validate" data-proposal-roi-status="validate">ROI · VALIDAR — ${escape(roi?.missing?.join(' · ')||'sem estudo econômico confirmado')}</p>`});}
    if(impacto&&sections.roi&&snapshot.roi){
      const roi=snapshot.roi;
      for(const [key,field] of Object.entries(roi.assumptions?.fields||{})){
        if((key.startsWith('fuel')&&!roi.assumptions.fuel)||(!key.startsWith('fuel')&&!roi.assumptions.tires))continue;
        add('roi',{kind:'premise',html:`<p class="client-meta impacto-premise">${escape(root.OG_PROPOSAL_INTELLIGENCE.ROI_FIELDS[key].label)}: <b>${field.value==null?'VALIDAR':escape(Number(field.value).toLocaleString('pt-BR'))} ${escape(field.unit)}</b> · ${field.status==='reviewed'?'Revisada para esta simulação':'VALIDAR'} · Fonte: ${escape(field.source||'VALIDAR')} · revisão ${escape(field.version)} · ${escape(field.updatedAt||'data não informada')}</p>`});
      }
      add('roi',paragraph('Estimativas dependem das condições reais da frota. Ganho de vida útil não equivale à mesma redução percentual de gasto. Pneus atendidos são os da aplicação cotada; custos fora do cenário não estão incluídos.'));
    }
    if(sections.roi&&sections.assumptions&&snapshot.roi){heading('assumptions','Premissas e método');const roi=snapshot.roi;for(const [key,field] of Object.entries(roi.assumptions?.fields||{})){if((key.startsWith('fuel')&&!roi.assumptions.fuel)||(!key.startsWith('fuel')&&!roi.assumptions.tires))continue;add('assumptions',paragraph(`${root.OG_PROPOSAL_INTELLIGENCE.ROI_FIELDS[key].label}: ${field.value??'VALIDAR'} ${field.unit} · ${field.status==='reviewed'?'Revisada':'VALIDAR'} · Fonte: ${field.source||'VALIDAR'} · revisão ${field.version} · ${field.updatedAt||'data não informada'}`));}add('assumptions',paragraph(`Pneus: quantidade × custo × (1 / vida atual − 1 / vida estimada). Vida estimada = vida atual × (1 + ganho / 100). Combustível: gasto mensal da frota × economia / 100. Anual = mensal × 12. Payback = investimento / economia mensal. Método: ${roi.formulaVersion}.`));}
    if(sections.observations&&(text.observation||commercial.notes)){heading('observations','Observações');add('observations',paragraph(text.observation||commercial.notes));}
    if(sections.disclaimer)add('disclaimer',paragraph('Aplicação física exige validação OG. Classificação e caminho representam o motor atual. Quantidades e investimento provêm da cotação; o estudo econômico é estimado.'));
    if(text.closing)blocks.push(paragraph(text.closing));
    if(impacto){
      // Commercial story first; exhaustive canonical evidence stays in the same document as an annex.
      const technical=blocks.filter(block=>['application','parts'].includes(block.section));
      const story=blocks.filter(block=>!['application','parts'].includes(block.section));
      if(!text.closing)story.push(paragraph('Próximo passo: validar a composição e as premissas com a Olho de Gato.','next-step'));
      if(technical.length)story.push({kind:'heading',html:'<h3>Anexo técnico · aplicação e peças</h3>'},...technical);
      blocks.splice(0,blocks.length,...story);
    }
    return {snapshot,record,presentation,company,blocks};
  }
  function header(model,logo=''){return `<header class="client-doc-header"><div class="client-brand">OLHO DE GATO${isImpacto(model.presentation)?catEye:''}<small>EQUALIZAÇÃO DE PRESSÃO · DUTRA OS</small></div>${logo?`<img src="${logo}" alt="Logo autorizado do cliente"/>`:''}</header>`;}
  function footer(model,page=1,total=1){return `<footer class="client-doc-footer"><span>${escape(model.company)} · ${escape(model.record?.id||model.snapshot.quoteId)} · ${model.record?`v${escape(model.record.version)}`:'prévia'}</span><span>${page} / ${total}</span></footer>`;}
  function wrapper(model,content){return `<article class="client-document proposal-document" data-template="${escape(model.presentation.templateId)}"${isImpacto(model.presentation)?' data-theme="impacto-og" data-theme-version="1"':''} data-proposal-client-id="${escape(model.snapshot.clientId)}" data-proposal-quote-id="${escape(model.snapshot.quoteId)}">${content}</article>`;}
  function documentHtml(snapshot,record,options={}){const model=viewModel(snapshot,record,options);return `<style>${css}</style>`+wrapper(model,`<section class="client-paper-page">${header(model,options.logo)}<div class="client-page-body">${model.blocks.map(b=>`<div class="client-block" data-kind="${b.kind}" data-section="${b.section||'essential'}">${b.html}</div>`).join('')}</div>${footer(model)}</section>`);}
  function authorizedMaterial(material,clientId){return material?.mediaType==='image'&&material.status==='approved'&&material.audience==='customer_authorized'&&String(material.consentRef||'').trim()&&String(material.clientId||'')===String(clientId)&&material.localAsset?.id;}
  function logoCandidates(materials,clientId){return (materials||[]).filter(m=>authorizedMaterial(m,clientId)).map(m=>({clientId,materialId:m.id,assetId:m.localAsset.id,version:m.contentVersion||'',label:m.title}));}
  async function resolveLogo(reference,materials,store,{capture=false}={}){
    if(!reference)return {data:'',reference:null,status:'OG · sem logo do cliente'};
    const material=(materials||[]).find(m=>String(m.id)===String(reference.materialId));
    if(!authorizedMaterial(material,reference.clientId)||String(material.localAsset.id)!==String(reference.assetId)||String(material.contentVersion||'')!==String(reference.version||''))return {data:'',reference,status:'Logo indisponível ou autorização/versão alterada · layout OG'};
    let asset;try{asset=await store?.get(reference.assetId);}catch{return {data:'',reference,status:'Logo não disponível neste aparelho · layout OG'};}
    if(!asset?.blob||!['image/png','image/jpeg','image/webp'].includes(asset.blob.type)||asset.blob.size>512000)return {data:'',reference,status:'Logo local ausente ou formato/tamanho não suportado · layout OG'};
    const digest=await root.crypto.subtle.digest('SHA-256',await asset.blob.arrayBuffer());
    const sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
    if(!capture&&sha256!==reference.sha256)return {data:'',reference,status:'Conteúdo do logo alterado · versão histórica preservada com layout OG'};
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Não foi possível ler o logo'));reader.readAsDataURL(asset.blob);});
    const image=new Image();image.src=data;try{await image.decode();}catch{return {data:'',reference,status:'Logo não pôde ser decodificado · layout OG'};}
    if(image.naturalWidth>4096||image.naturalHeight>4096)return {data:'',reference,status:'Logo excede dimensões suportadas · layout OG'};
    return {data,reference:{clientId:reference.clientId,materialId:reference.materialId,assetId:reference.assetId,version:reference.version||'',sha256},status:'Logo autorizado e conteúdo verificado'};
  }
  function paginate(snapshot,record,options={}){
    const model=viewModel(snapshot,record,options),host=document.createElement('div');host.style.cssText=`position:fixed;left:-20000px;top:0;width:${PAGE_WIDTH}px;visibility:hidden;pointer-events:none;`;
    host.innerHTML=`<style>${css}</style>`+wrapper(model,`<section class="client-paper-page" style="width:${PAGE_WIDTH}px;padding:32px">${header(model,options.logo)}<div class="client-page-body"></div>${footer(model)}</section>`);document.body.append(host);
    try{
      const body=host.querySelector('.client-page-body'),paper=host.querySelector('.client-paper-page'),pages=[];let current=[];
      const flush=()=>{if(current.length){if(pages.length>=MAX_PAGES)throw new Error(`Documento excede ${MAX_PAGES} páginas. Use Compacto ou reduza seções para exportar.`);pages.push(current);}current=[];body.replaceChildren();};
      const make=b=>{const el=document.createElement('div');el.className='client-block';el.dataset.kind=b.kind;el.dataset.section=b.section||'essential';el.innerHTML=b.html;return el;};
      for(let i=0;i<model.blocks.length;i++){
        const block=model.blocks[i],el=make(block);body.append(el);
        let next;
        if(block.kind==='heading'&&model.blocks[i+1]){next=make(model.blocks[i+1]);body.append(next);}
        const tooTall=paper.getBoundingClientRect().height>PAGE_HEIGHT;
        next?.remove();
        if(tooTall&&current.length){el.remove();flush();body.append(el);}
        if(paper.getBoundingClientRect().height>PAGE_HEIGHT)throw new Error('Um bloco excede a página. Reduza o texto ou selecione o template Compacto.');
        current.push(el.outerHTML);
      }
      flush();if(pages.length>MAX_PAGES)throw new Error(`Documento excede ${MAX_PAGES} páginas. Use Compacto ou reduza seções para exportar.`);
      return {model,pages:pages.map((blocks,i)=>wrapper(model,`<section class="client-paper-page" style="width:${PAGE_WIDTH}px;min-height:${PAGE_HEIGHT}px;padding:32px">${header(model,options.logo)}<div class="client-page-body">${blocks.join('')}</div>${footer(model,i+1,pages.length)}</section>`))};
    }finally{host.remove();}
  }
  async function exportPng(pages,{valid=()=>true}={}){
    if(!Array.isArray(pages)||!pages.length||pages.length>MAX_PAGES)throw new Error(`Exportação exige de 1 a ${MAX_PAGES} páginas.`);
    const results=[];
    for(const page of pages){
      if(!valid())throw new Error('Contexto alterado. Exporte novamente a proposta selecionada.');
      const html=`<div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${page}</div>`;
      const markup=new DOMParser().parseFromString(html,'text/html').body.firstElementChild;
      const serialized=new XMLSerializer().serializeToString(markup);
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}"><rect width="100%" height="100%" fill="white"/><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
      const image=new Image(),canvas=document.createElement('canvas');canvas.width=PAGE_WIDTH*2;canvas.height=PAGE_HEIGHT*2;
      try{image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();if(!valid())throw new Error('Contexto alterado. Exportação cancelada.');const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Exportação de imagem indisponível neste navegador');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.scale(2,2);ctx.drawImage(image,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Não foi possível gerar a imagem');results.push(blob);}finally{canvas.width=0;canvas.height=0;image.src='';}
    }
    if(!valid())throw new Error('Contexto alterado. Exportação cancelada.');return results;
  }
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function printPages(pages,{valid=()=>true}={}){
    if(!valid())return false;
    const frame=document.createElement('iframe');frame.title='Impressão da proposta';frame.style.cssText='position:fixed;left:-20000px;width:794px;height:1123px;border:0;';document.body.append(frame);
    const doc=frame.contentDocument;doc.open();doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta Olho de Gato</title><style>body{margin:0;background:#fff}${css}</style></head><body>${pages.join('')}</body></html>`);doc.close();
    try{await Promise.all(Array.from(doc.images,image=>image.decode()));if(!valid()){frame.remove();return false;}frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();return true;}catch(error){frame.remove();throw error;}
  }
  return Object.freeze({css,sectionLabels,PAGE_WIDTH,PAGE_HEIGHT,MAX_PAGES,viewModel,documentHtml,paginate,exportPng,printPages,download,logoCandidates,resolveLogo,resolveMedia,mediaKind});
}));
