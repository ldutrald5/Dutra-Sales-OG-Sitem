(function attach(root,factory){const api=factory(root);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OG_SPREADSHEET_EXPORT=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const CRM_HEADERS=[
    'Código cliente','Empresa / Nome','WhatsApp principal','Status','Temperatura','Próxima ação','Data próxima ação','Prioridade',
    'Última interação','Resumo da conversa','Potencial','Tipo','Origem','Canal','Indicação','Observações','Score',
    'CNPJ / CPF','Razão social','PF / PJ','Cidade / UF','Contato principal','Nº contatos'
  ];

  const EXTRA_HEADERS=[
    'Telefones adicionais','E-mail','Situação da conversa','Decisor','Frota','Dor principal','Objeções',
    'Lista / lote','Data criação','Última atualização','ID interno'
  ];

  const EXPORT_HEADERS=[...CRM_HEADERS,...EXTRA_HEADERS];
  const MAX_EXPORT_ROWS=10000;
  const clean=value=>String(value??'').trim();
  const digits=value=>clean(value).replace(/\D/g,'');
  const joinText=(items,mapper)=>Array.isArray(items)?items.map(mapper).map(clean).filter(Boolean).join(' | '):'';

  function latestInteraction(lead={}){
    const interactions=Array.isArray(lead.interactions)?lead.interactions:[];
    const latest=interactions.slice().sort((a,b)=>String(b?.at||'').localeCompare(String(a?.at||'')))[0];
    if(!latest)return clean(lead.lastContactAt);
    return [clean(latest.at),clean(latest.note||latest.summary||latest.result)].filter(Boolean).join(' · ');
  }

  function contactCount(lead={}){
    const contacts=Array.isArray(lead.contacts)?lead.contacts:[];
    const seen=new Set();
    if(clean(lead.nome)||digits(lead.telefone))seen.add([clean(lead.nome).toLowerCase(),digits(lead.telefone)].join('|'));
    contacts.forEach(contact=>seen.add([clean(contact?.name||contact?.nome).toLowerCase(),digits(contact?.phone||contact?.telefone)].join('|')));
    return [...seen].filter(key=>key!=='|').length;
  }

  function additionalPhones(lead={}){
    return joinText(lead.additionalPhones,item=>typeof item==='string'?item:(item?.phone||item?.telefone||''));
  }

  function referrals(lead={}){
    return joinText(lead.referrals,item=>{
      if(typeof item==='string')return item;
      return [item?.name,item?.company,item?.phone].map(clean).filter(Boolean).join(' · ');
    });
  }

  function documentValue(lead={}){
    return clean(lead.cnpj||lead.cpf);
  }

  function personType(lead={}){
    const doc=digits(documentValue(lead));
    if(doc.length===14)return'PJ';
    if(doc.length===11)return'PF';
    return'';
  }

  function leadToRow(lead={},options={}){
    const score=typeof options.scoreFn==='function'?options.scoreFn(lead):(lead.score??'');
    const priority=clean(lead.priorityBand||lead.priority);
    const source=clean(lead.sourceLabel||lead.sourceChannel||lead.origem||lead.origin);
    const sourceList=clean(lead.sourceList||lead.batchTag);
    return[
      clean(lead.internalCode||lead.externalCode),
      clean(lead.empresa||lead.nome),
      clean(lead.telefone),
      clean(lead.status),
      clean(lead.temperature),
      clean(lead.nextAction),
      clean(lead.followUpAt),
      priority,
      latestInteraction(lead),
      clean(lead.accountSummary||lead.summary),
      clean(lead.potential),
      clean(lead.segmentId||lead.type),
      source,
      clean(lead.sourceChannel),
      referrals(lead),
      clean(lead.observacoes),
      score,
      documentValue(lead),
      clean(lead.empresa),
      personType(lead),
      clean(lead.cidadeUf),
      clean(lead.nome||lead.decisionMaker),
      contactCount(lead),
      additionalPhones(lead),
      clean(lead.email),
      clean(lead.conversationStage),
      clean(lead.decisionMaker),
      Number.isFinite(Number(lead.fleetSize))?Number(lead.fleetSize):0,
      clean(lead.pain),
      Array.isArray(lead.objections)?lead.objections.map(clean).filter(Boolean).join(' | '):clean(lead.objections),
      sourceList,
      clean(lead.createdAt||lead.createdDate),
      clean(lead.updatedAt),
      clean(lead.id)
    ];
  }

  function buildContactRows(leads=[]){
    const rows=[];
    for(const lead of leads){
      const baseCompany=clean(lead.empresa||lead.nome);
      const code=clean(lead.internalCode||lead.externalCode);
      if(clean(lead.nome)||digits(lead.telefone)||clean(lead.email)){
        rows.push([code,baseCompany,clean(lead.nome),clean(lead.telefone),clean(lead.email),'Principal',clean(lead.decisionMaker),clean(lead.observacoes)]);
      }
      for(const contact of Array.isArray(lead.contacts)?lead.contacts:[]){
        rows.push([code,baseCompany,clean(contact?.name||contact?.nome),clean(contact?.phone||contact?.telefone),clean(contact?.email),clean(contact?.role||contact?.cargo||'Contato'),clean(contact?.decisionMakerRole),clean(contact?.notes||contact?.observacoes)]);
      }
    }
    return rows;
  }

  function buildPayload(leads=[],options={}){
    if(!Array.isArray(leads))throw new Error('Lista de leads inválida para exportação.');
    if(leads.length>MAX_EXPORT_ROWS)throw new Error(`A exportação está limitada a ${MAX_EXPORT_ROWS.toLocaleString('pt-BR')} leads por arquivo.`);
    const generatedAt=options.generatedAt||new Date().toISOString();
    const scope=options.scope==='current'?'current':'all';
    const scopeLabel=scope==='current'?'Visão atual':'Todos os leads';
    return{
      scope,scopeLabel,generatedAt,
      headers:EXPORT_HEADERS.slice(),
      crmRows:leads.map(lead=>leadToRow(lead,options)),
      contactHeaders:['Código cliente','Empresa','Contato','Telefone','E-mail','Tipo','Papel / decisor','Observações'],
      contactRows:buildContactRows(leads)
    };
  }

  function safeFilename(scope='all',generatedAt=new Date().toISOString()){
    const stamp=String(generatedAt).slice(0,19).replace(/[-:T]/g,'').slice(0,14);
    return `DUTRA_OS_Leads_${scope==='current'?'Visao_Atual':'Todos'}_${stamp}.xlsx`;
  }

  function requestWorkbook(payload){
    if(typeof root.Worker!=='function')return Promise.reject(new Error('Gerador XLSX isolado indisponível neste ambiente.'));
    return new Promise((resolve,reject)=>{
      const worker=new root.Worker('/workers/spreadsheet-export-worker.js');
      const timer=setTimeout(()=>{worker.terminate();reject(new Error('A exportação XLSX excedeu 12 segundos.'));},12000);
      worker.onmessage=event=>{
        clearTimeout(timer);worker.terminate();
        if(!event.data?.ok)return reject(new Error(event.data?.error||'Falha ao gerar XLSX.'));
        resolve(event.data.buffer);
      };
      worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(new Error('Falha no gerador XLSX isolado.'));};
      worker.postMessage({payload});
    });
  }

  async function exportLeads(leads=[],options={}){
    const payload=buildPayload(leads,options);
    const buffer=await requestWorkbook(payload);
    return{buffer,payload,filename:safeFilename(payload.scope,payload.generatedAt)};
  }

  return{CRM_HEADERS,EXTRA_HEADERS,EXPORT_HEADERS,MAX_EXPORT_ROWS,latestInteraction,contactCount,leadToRow,buildContactRows,buildPayload,safeFilename,requestWorkbook,exportLeads};
});
