(() => {
  'use strict';

  const clean = value => String(value ?? '').trim();
  const esc = value => clean(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmtDate = value => {
    if (!value) return 'Sem data';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? clean(value) : d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  };
  const laneMeta = {
    protect:{label:'PROTEGER',icon:'shield-check'},
    fulfill:{label:'CUMPRIR',icon:'check-check'},
    close:{label:'FECHAR',icon:'handshake'},
    expand:{label:'EXPANDIR',icon:'move-up-right'},
    prospect:{label:'PROSPECTAR',icon:'radar'},
    relate:{label:'RELACIONAR',icon:'heart-handshake'}
  };

  let currentBrief = null;
  let activeLane = 'all';

  function addStyles() {
    if (document.getElementById('meu-dia-v3-style')) return;
    const style = document.createElement('style');
    style.id = 'meu-dia-v3-style';
    style.textContent = `
      .dayHero{border:1px solid #5d4f18;border-radius:18px;padding:18px;background:radial-gradient(circle at 90% 15%,#6a520f55,transparent 34%),linear-gradient(145deg,#211c09,#0a1014 62%);position:relative;overflow:hidden}
      .dayHero:after{content:"";position:absolute;right:-36px;top:-42px;width:150px;height:150px;border:1px solid #ffd40022;border-radius:50%}
      .dayKicker{font-size:9px;font-weight:900;letter-spacing:.14em;color:#ffd400}.dayHero h2{font-size:27px;line-height:1.08;margin:7px 0 8px;max-width:440px}.dayHero p{margin:0;color:#a2adb5;font-size:12px;line-height:1.5;max-width:520px}
      .dayMission{margin-top:14px;display:grid;grid-template-columns:48px 1fr auto;gap:11px;align-items:center;padding:12px;border:1px solid #554817;border-radius:13px;background:#0b100dba}
      .dayMissionIcon{width:46px;height:46px;border-radius:13px;background:#ffd400;color:#111;display:grid;place-items:center}.dayMissionIcon svg{width:22px}
      .dayMission b{display:block;font-size:14px}.dayMission small{display:block;color:#9ca7af;font-size:10px;line-height:1.4;margin-top:3px}
      .dayMission button{height:39px;border:1px solid #665819;border-radius:10px;background:#171607;color:#ffd400;font-weight:800;font-size:10px;padding:0 11px}
      .dayStats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.dayStat{border:1px solid #27323a;border-radius:12px;background:#0a1014;padding:12px}.dayStat small{display:block;color:#909ba4;font-size:8px;text-transform:uppercase}.dayStat strong{display:block;font-size:22px;margin-top:4px}.dayStat.alert strong{color:#ff777d}.dayStat.today strong{color:#ffd400}.dayStat.signal strong{color:#7de6ef}.dayStat.auto strong{color:#72e77c}
      .laneRail{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;overflow:auto;padding-bottom:2px}.laneBtn{min-width:82px;border:1px solid #28323a;border-radius:12px;background:#0a1014;color:#9da7af;padding:10px 8px;text-align:left}.laneBtn.active{border-color:#776419;background:#211c08;color:#fff}.laneBtn b{display:block;font-size:9px}.laneBtn strong{display:block;font-size:20px;color:#ffd400;margin-top:3px}.laneBtn small{font-size:8px}
      .dayGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.dayCard{border:1px solid #27323a;border-radius:15px;background:linear-gradient(180deg,#0b1115,#080d11);padding:14px}.dayCard h3{font-size:15px;margin:0}.dayCard>p{color:#8f9aa3;font-size:10px;line-height:1.45;margin:5px 0 12px}
      .dayQueue{display:grid;gap:8px}.dayQueueItem{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:11px;border:1px solid #202a31;border-radius:11px;background:#080d11}.dayLaneTag{font-size:8px;font-weight:900;color:#ffd400;border:1px solid #5b4d16;background:#211c08;padding:6px 7px;border-radius:8px;min-width:64px;text-align:center}.dayQueueItem b{display:block;font-size:12px}.dayQueueItem small{display:block;color:#8d98a1;font-size:9px;line-height:1.35;margin-top:3px}.dayScore{text-align:right}.dayScore strong{display:block;font-size:15px}.dayScore small{font-size:8px;color:#7f8a93}
      .daySignal,.dayAutomation,.dayCommitment{padding:11px;border:1px solid #202a31;border-radius:11px;background:#080d11;margin-top:8px}.daySignalHead,.dayAutoHead,.dayCommitHead{display:flex;align-items:center;justify-content:space-between;gap:8px}.daySignal b,.dayAutomation b,.dayCommitment b{font-size:11px}.daySignal p,.dayAutomation p,.dayCommitment p{font-size:9px;color:#909ba4;line-height:1.45;margin:5px 0 0}.sev{font-size:8px;font-weight:900;padding:4px 6px;border-radius:6px;background:#2d2410;color:#ffd400}.sev.high{background:#321316;color:#ff888e}.sev.medium{background:#28210d;color:#ffd86e}
      .dayAutoActions{display:flex;gap:7px;margin-top:9px}.dayAutoActions button,.dayGhost{height:34px;border:1px solid #34404a;border-radius:9px;background:#0c1318;color:#d9e0e5;padding:0 10px;font-size:9px;font-weight:800}.dayAutoActions .apply{background:#ffd400;color:#111;border-color:#ffd400}
      .dayBrief{display:grid;gap:7px}.dayBriefLine{display:flex;gap:8px;color:#a6b0b8;font-size:10px;line-height:1.45}.dayBriefLine:before{content:"";width:6px;height:6px;border-radius:50%;background:#ffd400;margin-top:4px;flex:0 0 auto}
      .dayEmpty{padding:18px;text-align:center;border:1px dashed #2c3740;border-radius:12px;color:#89949d;font-size:10px}
      @media(max-width:560px){.dayStats{grid-template-columns:1fr 1fr}.laneRail{grid-template-columns:repeat(6,92px)}.dayGrid{grid-template-columns:1fr}.dayMission{grid-template-columns:42px 1fr}.dayMission button{grid-column:1/-1}.dayHero h2{font-size:24px}}
    `;
    document.head.appendChild(style);
  }

  function ensureScreen() {
    if (document.getElementById('day')) return;
    const shell = document.querySelector('.shell');
    const bottom = shell?.querySelector('.bottom');
    if (!shell || !bottom) return;
    const section = document.createElement('section');
    section.className = 'screen';
    section.id = 'day';
    section.innerHTML = `
      <div class="pageHead">
        <button class="iconBtn" id="dayBack"><i data-lucide="arrow-left"></i></button>
        <div class="titles"><h1>Meu Dia</h1><p>Prioridades, compromissos e próxima melhor ação</p></div>
        <button class="iconBtn" id="dayRefresh" aria-label="Atualizar"><i data-lucide="refresh-cw"></i></button>
      </div>
      <section class="dayHero">
        <div class="dayKicker">COMANDO COMERCIAL DO DIA</div>
        <h2 id="dayGreeting">Sua carteira organizada por impacto.</h2>
        <p id="daySummary">Carregando inteligência comercial da base real…</p>
        <div class="dayMission" id="dayMission">
          <div class="dayMissionIcon"><i data-lucide="crosshair"></i></div>
          <div><b>Calculando missão principal…</b><small>O DUTRA OS está priorizando a carteira.</small></div>
          <button type="button" disabled>Abrir conta</button>
        </div>
      </section>
      <div class="dayStats">
        <div class="dayStat alert"><small>Vencidos</small><strong id="dayOverdue">0</strong></div>
        <div class="dayStat today"><small>Hoje</small><strong id="dayToday">0</strong></div>
        <div class="dayStat signal"><small>Sinais</small><strong id="daySignals">0</strong></div>
        <div class="dayStat auto"><small>Sugestões</small><strong id="dayAutomations">0</strong></div>
      </div>

      <section class="section">
        <div class="sectionHead"><h2>Fila por objetivo</h2><button id="dayAllLanes">Ver tudo</button></div>
        <div class="laneRail" id="dayLanes"></div>
      </section>

      <section class="section dayGrid">
        <div class="dayCard">
          <h3>Próximas contas</h3>
          <p>Ordenadas por objetivo comercial, urgência e score explicável.</p>
          <div class="dayQueue" id="dayQueue"></div>
        </div>
        <div class="dayCard">
          <h3>Briefing da carteira</h3>
          <p>Resumo calculado com o que está registrado, sem inventar contexto.</p>
          <div class="dayBrief" id="dayBrief"></div>
        </div>
      </section>

      <section class="section dayGrid">
        <div class="dayCard">
          <h3>Compromissos</h3>
          <p>Retornos com motivo, objetivo ou resultado esperado registrados.</p>
          <div id="dayCommitments"></div>
        </div>
        <div class="dayCard">
          <h3>Sinais comerciais</h3>
          <p>Alertas objetivos para não deixar oportunidade ou pós-venda esfriar.</p>
          <div id="daySignalList"></div>
        </div>
      </section>

      <section class="section">
        <div class="dayCard">
          <h3>Automações sugeridas</h3>
          <p>Nada é aplicado sozinho. Você escolhe quando uma sugestão vira próxima ação real.</p>
          <div id="dayAutomationList"></div>
        </div>
      </section>
    `;
    shell.insertBefore(section,bottom);

    document.getElementById('dayBack')?.addEventListener('click',()=>globalThis.go?.('home'));
    document.getElementById('dayRefresh')?.addEventListener('click',async()=>{
      const btn=document.getElementById('dayRefresh');
      btn?.classList.add('spin');
      try{await globalThis.DUTRA_CORE?.reload?.();}finally{btn?.classList.remove('spin')}
    });
    document.getElementById('dayAllLanes')?.addEventListener('click',()=>{activeLane='all';renderFromCore();});
    lucide?.createIcons?.();
  }

  function wireEntrances() {
    const moreRows = [...document.querySelectorAll('#more .moduleRow')];
    const dayRow = moreRows.find(row => row.querySelector('b')?.textContent?.trim() === 'Meu Dia');
    if (dayRow && !dayRow.dataset.dayBound) {
      dayRow.dataset.dayBound='1';
      dayRow.addEventListener('click', event => { event.preventDefault(); globalThis.go?.('day'); renderFromCore(); });
    }
    const centralButton = [...document.querySelectorAll('#home button')].find(btn => btn.textContent.includes('Central operacional'));
    if (centralButton) centralButton.dataset.go='day';

    const cmdItems = document.querySelector('.cmdItems');
    if (cmdItems && !document.getElementById('cmdMeuDia')) {
      const item=document.createElement('div');
      item.id='cmdMeuDia';
      item.className='cmdItem';
      item.innerHTML='<i data-lucide="calendar-check"></i> Abrir Meu Dia inteligente';
      item.addEventListener('click',()=>{globalThis.go?.('day');renderFromCore();document.getElementById('command')?.classList.remove('open');});
      cmdItems.prepend(item);
    }
    lucide?.createIcons?.();
  }

  function buildBrief() {
    const core=globalThis.DUTRA_CORE;
    const morning=globalThis.OG_MORNING_COMMAND;
    if (!core?.getState || !morning?.build) return null;
    const snapshot=core.getState();
    const leads=core.getLeads?.() || [];
    if (!snapshot) return null;
    return morning.build({
      leads,
      operations:snapshot.operations || {},
      now:new Date(),
      calendarConnected:false
    },{
      salesDesk:globalThis.OG_SALES_DESK,
      leadIntelligence:globalThis.OG_LEAD_INTELLIGENCE,
      signalCenter:globalThis.OG_SIGNAL_CENTER,
      automationEngine:globalThis.OG_AUTOMATION_ENGINE,
      customerJourney:globalThis.OG_CUSTOMER_JOURNEY
    });
  }

  function renderFromCore() {
    ensureScreen();
    wireEntrances();
    try {
      currentBrief=buildBrief();
      if (!currentBrief) return;
      render(currentBrief);
    } catch (error) {
      console.error('Meu Dia V3',error);
      const summary=document.getElementById('daySummary');
      if(summary) summary.textContent='Não consegui montar o briefing agora. A base principal continua preservada.';
    }
  }

  function render(brief) {
    const hour=new Date().getHours();
    const greeting=hour<12?'Bom dia, Lucas.':hour<18?'Boa tarde, Lucas.':'Boa noite, Lucas.';
    document.getElementById('dayGreeting').textContent=greeting+' Aqui está o que realmente merece atenção.';
    document.getElementById('daySummary').textContent=brief.briefing?.[0] || 'Carteira organizada.';

    document.getElementById('dayOverdue').textContent=brief.counts?.overdue ?? 0;
    document.getElementById('dayToday').textContent=brief.counts?.today ?? 0;
    document.getElementById('daySignals').textContent=brief.counts?.signals ?? 0;
    document.getElementById('dayAutomations').textContent=brief.counts?.automations ?? 0;

    renderMission(brief);
    renderLanes(brief);
    renderQueue(brief);
    renderBriefLines(brief);
    renderCommitments(brief);
    renderSignals(brief);
    renderAutomations(brief);
    lucide?.createIcons?.();
  }

  function renderMission(brief) {
    const box=document.getElementById('dayMission');
    const mission=brief.mission;
    if(!box) return;
    if(!mission){
      box.innerHTML='<div class="dayMissionIcon"><i data-lucide="check"></i></div><div><b>Sem missão crítica agora</b><small>A carteira não tem prioridade crítica detectada pelos dados registrados.</small></div>';
      return;
    }
    const lead=(globalThis.DUTRA_CORE?.getLeads?.()||[]).find(item=>String(item.id)===String(mission.leadId));
    box.innerHTML=`<div class="dayMissionIcon"><i data-lucide="crosshair"></i></div><div><b>${esc(lead?.empresa||lead?.nome||'Conta prioritária')}</b><small>${esc(mission.recommendedAction||mission.reason||'Abrir conta e revisar próximo passo')}</small></div><button type="button" data-open-lead="${esc(mission.leadId)}">Abrir conta</button>`;
    box.querySelector('button')?.addEventListener('click',()=>globalThis.DUTRA_CORE?.selectClient?.(mission.leadId));
  }

  function renderLanes(brief) {
    const root=document.getElementById('dayLanes');
    if(!root) return;
    const counts=brief.counts?.lanes || {};
    root.innerHTML=Object.entries(laneMeta).map(([id,meta])=>`<button class="laneBtn ${activeLane===id?'active':''}" data-lane="${id}"><b>${meta.label}</b><strong>${counts[id]||0}</strong><small>conta(s)</small></button>`).join('');
    root.querySelectorAll('[data-lane]').forEach(btn=>btn.addEventListener('click',()=>{activeLane=btn.dataset.lane;renderLanes(brief);renderQueue(brief);}));
  }

  function renderQueue(brief) {
    const root=document.getElementById('dayQueue');
    if(!root) return;
    const queue=(brief.workQueue||[]).filter(item=>activeLane==='all'||item.lane?.id===activeLane).slice(0,10);
    if(!queue.length){root.innerHTML='<div class="dayEmpty">Nenhuma conta nesta faixa agora.</div>';return}
    root.innerHTML=queue.map(item=>`<div class="dayQueueItem" data-open-lead="${esc(item.leadId)}"><div class="dayLaneTag">${esc(item.lane?.label||'AÇÃO')}</div><div><b>${esc(item.label)}</b><small>${esc(item.action||'Definir próximo movimento')}<br>${esc(item.followUpAt?fmtDate(item.followUpAt):item.lane?.reason||'')}</small></div><div class="dayScore"><strong>${item.score||0}</strong><small>SCORE</small></div></div>`).join('');
    root.querySelectorAll('[data-open-lead]').forEach(row=>row.addEventListener('click',()=>globalThis.DUTRA_CORE?.selectClient?.(row.dataset.openLead)));
  }

  function renderBriefLines(brief) {
    const root=document.getElementById('dayBrief');
    if(!root) return;
    root.innerHTML=(brief.briefing||[]).map(line=>`<div class="dayBriefLine">${esc(line)}</div>`).join('') || '<div class="dayEmpty">Sem alerta relevante.</div>';
  }

  function renderCommitments(brief) {
    const root=document.getElementById('dayCommitments');
    if(!root) return;
    const items=(brief.commitments||[]).slice(0,6);
    if(!items.length){root.innerHTML='<div class="dayEmpty">Nenhum compromisso estruturado registrado.</div>';return}
    root.innerHTML=items.map(item=>`<div class="dayCommitment" data-open-lead="${esc(item.leadId)}"><div class="dayCommitHead"><b>${esc(item.label)}</b><span class="sev ${item.state==='overdue'?'high':'medium'}">${esc(item.state==='overdue'?'VENCIDO':item.state==='today'?'HOJE':'AGENDADO')}</span></div><p>${esc(item.action)} · ${esc(item.followUpAt?fmtDate(item.followUpAt):'sem data')}<br>${esc(item.reason||item.objective||'')}</p></div>`).join('');
    root.querySelectorAll('[data-open-lead]').forEach(row=>row.addEventListener('click',()=>globalThis.DUTRA_CORE?.selectClient?.(row.dataset.openLead)));
  }

  function renderSignals(brief) {
    const root=document.getElementById('daySignalList');
    if(!root) return;
    const items=(brief.signals||[]).slice(0,6);
    if(!items.length){root.innerHTML='<div class="dayEmpty">Nenhum sinal comercial ativo.</div>';return}
    root.innerHTML=items.map(item=>`<div class="daySignal" data-open-lead="${esc(item.leadId)}"><div class="daySignalHead"><b>${esc(item.title||item.type)}</b><span class="sev ${esc(item.severity||'medium')}">${esc((item.severity||'média').toUpperCase())}</span></div><p>${esc(item.reason||'')}<br><strong style="color:#dfe5e9">${esc(item.recommendedAction||'')}</strong></p></div>`).join('');
    root.querySelectorAll('[data-open-lead]').forEach(row=>row.addEventListener('click',()=>globalThis.DUTRA_CORE?.selectClient?.(row.dataset.openLead)));
  }

  function renderAutomations(brief) {
    const root=document.getElementById('dayAutomationList');
    if(!root) return;
    const items=(brief.automations||[]).slice(0,6);
    if(!items.length){root.innerHTML='<div class="dayEmpty">Nenhuma automação precisa da sua decisão agora.</div>';return}
    root.innerHTML=items.map(item=>`<div class="dayAutomation"><div class="dayAutoHead"><b>${esc(item.title)}</b><span class="sev ${esc(item.severity||'medium')}">${esc((item.severity||'média').toUpperCase())}</span></div><p>${esc(item.reason)}<br><strong style="color:#dfe5e9">${esc(item.action)}</strong></p><div class="dayAutoActions"><button class="dayGhost" data-open-lead="${esc(item.leadId)}">Ver cliente</button><button class="apply" data-apply-auto="${esc(item.id)}">Usar como próxima ação</button></div></div>`).join('');
    root.querySelectorAll('[data-open-lead]').forEach(btn=>btn.addEventListener('click',()=>globalThis.DUTRA_CORE?.selectClient?.(btn.dataset.openLead)));
    root.querySelectorAll('[data-apply-auto]').forEach(btn=>btn.addEventListener('click',()=>applySuggestion(btn.dataset.applyAuto)));
  }

  async function applySuggestion(id) {
    const suggestion=(currentBrief?.automations||[]).find(item=>item.id===id);
    if(!suggestion) return;
    const leads=globalThis.DUTRA_CORE?.getLeads?.()||[];
    const lead=leads.find(item=>String(item.id)===String(suggestion.leadId));
    const snapshot=globalThis.DUTRA_CORE?.getState?.();
    if(!lead||!snapshot) return;
    if(!confirm(`Usar “${suggestion.action}” como próxima ação de ${lead.empresa||lead.nome||'cliente'}?`)) return;
    try{
      globalThis.OG_AUTOMATION_ENGINE.applyToLead(lead,suggestion,{interactionService:globalThis.OG_INTERACTION_SERVICE});
      snapshot.operations=globalThis.OG_AUTOMATION_ENGINE.markApplied(snapshot.operations||{},suggestion,{operationsModel:globalThis.OG_OPERATIONS_MODEL,now:new Date()});
      await globalThis.DUTRA_CORE.save(
        'Sugestão transformada em próxima ação real.',
        {action:'APPLY_AUTOMATION_NEXT_ACTION',entityType:'lead',entityId:lead.id,label:'Próxima ação do Meu Dia',metadata:{suggestionId:suggestion.id}}
      );
    }catch(error){
      console.error(error);
      alert('Não foi possível aplicar a sugestão: '+error.message);
    }
  }

  addStyles();
  ensureScreen();
  wireEntrances();
  window.addEventListener('dutra:state',renderFromCore);
  if(globalThis.DUTRA_CORE?.getState?.()) renderFromCore();
})();