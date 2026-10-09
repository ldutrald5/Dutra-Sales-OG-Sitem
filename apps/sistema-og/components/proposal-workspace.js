/* Commercial view of the canonical quotation/proposal. No pricing or storage owner. */
(function attach(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PROPOSAL_WORKSPACE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => value == null ? 'VALIDAR' : Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const scopes = {cavalo:'CAVALO / CAMINHÃO',carreta:'CARRETA / IMPLEMENTO',outro:'OUTRO',validar:'VALIDAR'};
  const fieldLabels = {tirePrice:'Custo médio do pneu (R$)',lifeMonths:'Vida útil atual (meses)',lifeGainPct:'Ganho estimado de vida útil (%)',fuelMonthlyCost:'Combustível da frota atendida (R$/mês)',fuelSavingPct:'Economia estimada de combustível (%)'};
  function roiHtml(roi) {
    if (!roi || roi.status !== 'ready') return `<div class="proposal-validate" data-proposal-roi-status="validate"><strong>ROI · VALIDAR</strong><p>Informe e revise as premissas: ${escape(roi?.missing?.join(' · ') || 'sem estudo econômico confirmado')}.</p></div>`;
    const fields = roi.assumptions.fields;
    const activeKeys = [...(roi.assumptions.tires ? ['tirePrice','lifeMonths','lifeGainPct'] : []),...(roi.assumptions.fuel ? ['fuelMonthlyCost','fuelSavingPct'] : [])];
    return `<section class="proposal-roi-results" data-proposal-roi-status="ready"><h3>Cenário econômico estimado</h3><div class="proposal-metrics"><div><span>Investimento da cotação</span><strong>${money(roi.investment)}</strong></div><div><span>Economia mensal estimada</span><strong data-proposal-monthly>${money(roi.monthlySavings)}</strong></div><div><span>Economia anual estimada</span><strong>${money(roi.annualSavings)}</strong></div><div><span>Payback estimado</span><strong data-proposal-payback>${roi.paybackMonths == null ? 'Sem retorno neste cenário' : `${roi.paybackMonths.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} meses`}</strong></div></div><p>Simulação com premissas revisadas pelo vendedor. Não constitui garantia de resultado.</p><details><summary>Ver premissas e fórmula</summary><ul>${activeKeys.map(key => `<li>${escape(fieldLabels[key])}: ${escape(fields[key].value)} ${escape(fields[key].unit)} · Fonte: ${escape(fields[key].source)} · revisão ${fields[key].version} · ${escape(fields[key].updatedAt)}</li>`).join('')}</ul><p>Pneus: quantidade × custo × (1 / vida atual − 1 / vida estimada). Vida estimada = vida atual × (1 + ganho / 100). Combustível: gasto mensal da frota × economia / 100. Anual = mensal × 12. Payback = investimento / economia mensal. Fórmula: ${escape(roi.formulaVersion)}.</p></details></section>`;
  }
  function documentHtml(snapshot,record,options={}) {
    return globalThis.OG_PROPOSAL_DOCUMENT.documentHtml(snapshot,record,options);
  }
  function presentationControls(view, open) {
    if (!view.snapshot) return '';
    const api=globalThis.OG_PROPOSAL_INTELLIGENCE,config=view.presentation;
    return `<details ${open ? 'open' : ''} class="proposal-presentation-settings"><summary>Documento para o cliente</summary><div class="proposal-fields"><label>Apresentação<select data-presentation-theme><option value="impacto-og" ${config.themeId==='impacto-og'?'selected':''}>Impacto OG</option><option value="classic" ${config.themeId!=='impacto-og'?'selected':''}>Clássica / histórico</option></select></label><label>Template<select data-presentation-template>${Object.entries(api.PRESENTATION_TEMPLATES).map(([id,t])=>`<option value="${id}" ${config.templateId===id?'selected':''}>${escape(t.label)}</option>`).join('')}</select></label><p>Um documento, os mesmos valores. Alterações visuais são salvas em nova revisão.</p><label>Logo do cliente<select data-presentation-logo><option value="">Somente Olho de Gato</option>${view.logos.map(ref=>`<option value="${escape(ref.materialId)}" ${config.branding?.materialId===ref.materialId?'selected':''}>${escape(ref.label)}</option>`).join('')}${config.branding&&!view.logos.some(ref=>ref.materialId===config.branding.materialId)?'<option selected value="unavailable">Logo da versão indisponível</option>':''}</select></label><p data-presentation-logo-status role="status">${config.branding?'Verificando logo local…':'OG · sem logo do cliente'}</p><fieldset><legend>Seções do documento</legend>${Object.entries(globalThis.OG_PROPOSAL_DOCUMENT.sectionLabels).map(([key,label])=>`<label class="proposal-check"><input type="checkbox" data-presentation-section="${key}" ${config.sections[key]?'checked':''}>${escape(label)}</label>`).join('')}</fieldset>${Object.entries({title:'Título da proposta',introduction:'Mensagem de abertura',observation:'Observação comercial',deliveryNote:'Nota de entrega',validityText:'Texto de validade',closing:'Mensagem de encerramento'}).map(([key,label])=>`<label>${label}<textarea data-presentation-text="${key}" maxlength="${{title:120,introduction:1200,observation:2000,deliveryNote:500,validityText:300,closing:800}[key]}" rows="${['title','deliveryNote','validityText'].includes(key)?1:2}">${escape(config.text[key])}</textarea></label>`).join('')}<p>Textos de apresentação não alteram preços, peças, premissas ou cálculos.</p></div></details>`;
  }
  function bindPresentation(root,view,hooks,valid) {
    if (!view.snapshot) return;
    const api=globalThis.OG_PROPOSAL_INTELLIGENCE,documentApi=globalThis.OG_PROPOSAL_DOCUMENT;
    const config=view.presentation,token={};root._proposalExportToken=token;
    const current=()=>valid()&&root._proposalExportToken===token;
    root.querySelector('[data-presentation-theme]').addEventListener('change',event=>{if(current())hooks.presentation(api.normalizePresentation({...config,themeId:event.target.value,themeVersion:1},view.snapshot.clientId));});
    root.querySelector('[data-presentation-template]').addEventListener('change',event=>{if(current())hooks.presentation(api.normalizePresentation({...config,templateId:event.target.value,sections:undefined},view.snapshot.clientId));});
    root.querySelectorAll('[data-presentation-section]').forEach(input=>input.addEventListener('change',()=>{if(current())hooks.presentation({...config,sections:{...config.sections,[input.dataset.presentationSection]:input.checked}});}));
    root.querySelectorAll('[data-presentation-text]').forEach(input=>input.addEventListener('change',()=>{if(current())hooks.presentation({...config,text:{...config.text,[input.dataset.presentationText]:input.value}});}));
    root.querySelector('[data-presentation-logo]').addEventListener('change',async event=>{
      if(!current())return;const ref=view.logos.find(logo=>logo.materialId===event.target.value);
      try {const loaded=await documentApi.resolveLogo(ref,view.materials,globalThis.OG_MATERIAL_STORE,{capture:true});if(!current())return;if(ref&&!loaded.data){root.querySelector('[data-presentation-logo-status]').textContent=loaded.status;return;}hooks.presentation({...config,branding:loaded.reference});}
      catch {if(current())root.querySelector('[data-presentation-logo-status]').textContent='Não foi possível verificar o logo. Use o layout OG.';}
    });
    let busy=false;
    const feedback=root.querySelector('[data-proposal-export-status]');
    const prepare=async()=>{
      const loaded=await documentApi.resolveLogo(config.branding,view.materials,globalThis.OG_MATERIAL_STORE);
      if(!current())throw new Error('Contexto alterado. Exportação cancelada.');
      root.querySelector('[data-presentation-logo-status]').textContent=loaded.status;
      const media=await documentApi.resolveMedia(config);
      if(!current())throw new Error('Contexto alterado. Exportação cancelada.');
      const result=documentApi.paginate(view.snapshot,view.record,{presentation:config,logo:loaded.data,media,sentConfirmed:view.sentConfirmed});
      if(!current())throw new Error('Contexto alterado. Exportação cancelada.');
      return result.pages;
    };
    const exportAction=async(type)=>{
      if(busy||!current())return;
      if(view.presentationEditing){feedback.textContent='Prepare a nova revisão visual antes de exportar.';return;}
      busy=true;
      const buttons=root.querySelectorAll('[data-proposal-pdf],[data-proposal-png]');buttons.forEach(b=>b.disabled=true);feedback.textContent='Preparando documento…';
      try{
        const pages=await prepare();
        if(type==='pdf'){if(await documentApi.printPages(pages,{valid:current}))feedback.textContent='Impressão/PDF preparado. Nenhum envio registrado.';}
        else{const images=await documentApi.exportPng(pages,{valid:current});if(!current())return;const select=root.querySelector('[data-proposal-export-page]');select.innerHTML=images.map((_,i)=>`<option value="${i}">Página ${i+1} de ${images.length}</option>`).join('');select.hidden=images.length===1;const download=root.querySelector('[data-proposal-download-png]');download.hidden=false;download.onclick=()=>{if(current())documentApi.download(images[Number(select.value)||0],`proposta-${String(view.record?.id||view.snapshot.quoteId).replace(/[^a-zA-Z0-9_-]/g,'')}-${Number(select.value)+1}.png`);};feedback.textContent=`${images.length} imagem(ns) pronta(s), 1588 × 2246 px. Selecione a página e baixe. Nenhum envio registrado.`;}
      }catch(error){if(current())feedback.textContent=error.message||'Exportação indisponível neste navegador. Tente imprimir/PDF.';}
      finally{busy=false;if(current())buttons.forEach(b=>b.disabled=false);}
    };
    root.querySelector('[data-proposal-pdf]').onclick=()=>exportAction('pdf');
    root.querySelector('[data-proposal-png]').onclick=()=>exportAction('png');
    root._printProposal=()=>exportAction('pdf');
    root.querySelector('[data-proposal-preview]').onclick=()=>{if(current())root.querySelector('.proposal-preview').scrollIntoView({block:'start',behavior:globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
    Promise.all([documentApi.resolveLogo(config.branding,view.materials,globalThis.OG_MATERIAL_STORE),documentApi.resolveMedia(config)]).then(([loaded,media])=>{
      if(!current())return;root.querySelector('[data-presentation-logo-status]').textContent=loaded.status;
      const html=documentApi.documentHtml(view.snapshot,view.record,{presentation:config,logo:loaded.data,media,sentConfirmed:view.sentConfirmed});
      root.querySelector('.proposal-preview').innerHTML=html;
      hooks.document(html);
    }).catch(()=>{if(current())root.querySelector('[data-presentation-logo-status]').textContent='Logo local indisponível · layout OG';});
  }
  function render(root, view, hooks) {
    if (!root) return;
    const settings = root.querySelector('.proposal-presentation-settings');
    const settingsOpen = settings && root.dataset.presentationClient === view.snapshot?.clientId ? settings.open : globalThis.innerWidth >= 1100;
    root.dataset.presentationClient = view.snapshot?.clientId || '';
    root._printProposal=null;root._proposalExportToken=null;
    const identity = view.identity;
    const valid = () => root.isConnected && identity === hooks.identity();
    const assumptions = view.assumptions;
    const activeKeys = [...(assumptions.tires ? ['tirePrice','lifeMonths','lifeGainPct'] : []),...(assumptions.fuel ? ['fuelMonthlyCost','fuelSavingPct'] : [])];
    const reviewed = activeKeys.length > 0 && activeKeys.every(key => assumptions.fields[key].status === 'reviewed');
    root.innerHTML = `<header class="proposal-workspace-heading"><div><span class="og-kicker">COTAÇÃO → PROPOSTA → RETORNO</span><h2>Proposta + ROI</h2><p>Revise o que será instalado e prepare a versão comercial.</p></div><div class="proposal-heading-actions"><button type="button" data-proposal-current>Revisar composição atual</button><button type="button" data-proposal-prepare ${view.canPrepare ? '' : 'disabled'}>${view.presentationEditing?'Salvar nova revisão visual':'Preparar proposta'}</button></div></header><p class="proposal-workspace-status" role="status">${escape(view.feedback || (view.historical ? 'Versão histórica preservada. Alterações na composição não mudam este documento.' : 'Salvar ou preparar não registra envio.'))}</p>${view.snapshot ? '<div class="proposal-export-toolbar"><button type="button" data-proposal-preview>Ver documento</button><button type="button" data-proposal-pdf>Imprimir / Salvar PDF</button><button type="button" data-proposal-png>Preparar PNG</button><select data-proposal-export-page hidden aria-label="Página da imagem"></select><button type="button" data-proposal-download-png hidden>Baixar PNG</button><p data-proposal-export-status role="status">Prévia do documento abaixo. Exportar não registra envio.</p></div>' : ''}<div class="proposal-workspace-grid"><div class="proposal-editor">${presentationControls(view,settingsOpen)}<details ${view.historical ? '' : 'open'}><summary>Condições e premissas de ROI</summary><div class="proposal-fields"><label>Validade<input data-proposal-term="validUntil" type="date" value="${escape(view.terms.validUntil)}"></label><label>Condição comercial<input data-proposal-term="paymentTerms" maxlength="500" value="${escape(view.terms.paymentTerms)}"></label><label>Observações<textarea data-proposal-term="notes" maxlength="3000">${escape(view.terms.notes)}</textarea></label><h3>Premissas do cenário</h3><p>Campos vazios ou não revisados ficam em VALIDAR. Percentuais são estimativas informadas para esta conta.</p><label class="proposal-check"><input type="checkbox" data-roi-channel="tires" ${assumptions.tires ? 'checked' : ''}>Incluir economia de pneus</label><label class="proposal-check"><input type="checkbox" data-roi-channel="fuel" ${assumptions.fuel ? 'checked' : ''}>Incluir economia de combustível</label>${Object.entries(fieldLabels).map(([key,label]) => `<label ${activeKeys.includes(key) ? '' : 'hidden'}>${label}<input data-roi-field="${key}" type="number" min="0" step="any" value="${assumptions.fields[key].value ?? ''}"></label>`).join('')}<label>Fonte das premissas<input data-roi-source maxlength="300" placeholder="Ex.: medições da frota, cenário acordado com o cliente" value="${escape(assumptions.fields[activeKeys[0]]?.source)}"></label><label class="proposal-check"><input data-roi-review type="checkbox" ${reviewed ? 'checked' : ''}>Revisei estas premissas para esta simulação</label></div></details><details><summary>Versões preparadas deste cliente</summary><div class="proposal-version-list">${view.documents.map(doc => `<button type="button" data-proposal-open="${escape(doc.id)}">${escape(doc.quoteId)} · v${doc.version} · ${escape(new Date(doc.preparedAt).toLocaleDateString('pt-BR'))}</button>`).join('') || '<p>Nenhuma versão preparada.</p>'}</div></details></div><div class="proposal-preview">${view.snapshot ? documentHtml(view.snapshot,view.record,{sentConfirmed:view.sentConfirmed}) : '<p class="proposal-validate">Vincule a cotação ao cliente correto do CRM para preparar uma proposta. Nenhum novo cliente será criado.</p>'}</div></div>`;
    bindPresentation(root,view,hooks,valid);
    root.querySelector('[data-proposal-prepare]').addEventListener('click', () => {if (valid()) hooks.prepare();});
    root.querySelector('[data-proposal-current]').addEventListener('click', () => {if (valid()) hooks.current();});
    root.querySelectorAll('[data-proposal-open]').forEach(button => button.addEventListener('click', () => {if (valid()) hooks.open(button.dataset.proposalOpen);}));
    root.querySelectorAll('[data-proposal-term]').forEach(input => input.addEventListener('change', () => {if (valid()) hooks.term(input.dataset.proposalTerm,input.value);}));
    root.querySelectorAll('[data-roi-field],[data-roi-channel],[data-roi-source],[data-roi-review]').forEach(input => input.addEventListener('change', () => {
      if (!valid()) return;
      const review = input.hasAttribute('data-roi-review') && input.checked;
      const source = root.querySelector('[data-roi-source]').value.trim();
      const now = new Date().toISOString();
      const fields = Object.fromEntries(Object.keys(fieldLabels).map(key => {
        const value = root.querySelector(`[data-roi-field="${key}"]`).value;
        return [key,{value:value === '' ? null : Number(value),source,status:review ? 'reviewed' : 'validate',updatedAt:now,
          version:assumptions.fields[key].version + 1}];
      }));
      hooks.assumptions({tires:root.querySelector('[data-roi-channel="tires"]').checked,fuel:root.querySelector('[data-roi-channel="fuel"]').checked,fields});
    }));
  }
  return Object.freeze({render,documentHtml,roiHtml});
}));
