'use strict';
importScripts('../assets/vendor/xlsx.full.min.js');

function widths(headers, rows){
  return headers.map((header,index)=>{
    let max=String(header??'').length;
    for(const row of rows.slice(0,500))max=Math.max(max,String(row?.[index]??'').length);
    return{wch:Math.min(Math.max(max+2,10),42)};
  });
}

function sheetFromRows(headers,rows,meta=[]){
  const aoa=[...meta,headers,...rows];
  const sheet=self.XLSX.utils.aoa_to_sheet(aoa);
  sheet['!cols']=widths(headers,rows);
  if(meta.length)sheet['!autofilter']={ref:`A${meta.length+1}:${self.XLSX.utils.encode_col(headers.length-1)}${meta.length+1+rows.length}`};
  else sheet['!autofilter']={ref:`A1:${self.XLSX.utils.encode_col(headers.length-1)}${Math.max(1,rows.length+1)}`};
  return sheet;
}

self.onmessage=event=>{
  try{
    const payload=event.data?.payload;
    if(!payload||!Array.isArray(payload.headers)||!Array.isArray(payload.crmRows))throw new Error('Payload de exportação inválido.');

    const workbook=self.XLSX.utils.book_new();
    workbook.Props={
      Title:'DUTRA OS — Leads',
      Subject:`Exportação: ${payload.scopeLabel||payload.scope||'Leads'}`,
      Author:'DUTRA OS',
      CreatedDate:new Date(payload.generatedAt||Date.now())
    };

    const today=[
      ['DUTRA OS — EXPORTAÇÃO DE LEADS'],
      ['Escopo',payload.scopeLabel||'Todos os leads'],
      ['Gerado em',payload.generatedAt||''],
      ['Total de leads',payload.crmRows.length],
      ['Fonte mestre','DUTRA OS / state.leads'],
      ['Observação','Arquivo gerado a partir da base atual do sistema.']
    ];
    const todaySheet=self.XLSX.utils.aoa_to_sheet(today);
    todaySheet['!cols']=[{wch:22},{wch:58}];
    self.XLSX.utils.book_append_sheet(workbook,todaySheet,'🚀 HOJE');

    const crmMeta=[
      ['DUTRA OS — CRM MASTER'],
      [`Escopo: ${payload.scopeLabel||''}`],
      [`Gerado em: ${payload.generatedAt||''}`],
      [`Total: ${payload.crmRows.length} lead(s)`],
      ['Fonte: state.leads'],
      []
    ];
    const crmSheet=sheetFromRows(payload.headers,payload.crmRows,crmMeta);
    self.XLSX.utils.book_append_sheet(workbook,crmSheet,'📋 CRM');

    const listHeaders=['Código cliente','Empresa / Nome','WhatsApp principal','Status','Situação da conversa','Prioridade','Temperatura','Potencial','Origem','Próxima ação','Data próxima ação'];
    const indexes=listHeaders.map(header=>payload.headers.indexOf(header));
    const listRows=payload.crmRows.map(row=>indexes.map(index=>index>=0?row[index]:''));
    const listSheet=sheetFromRows(listHeaders,listRows,[['DUTRA OS — LISTA OPERACIONAL'],[`Escopo: ${payload.scopeLabel||''}`],[],[],[],[]]);
    self.XLSX.utils.book_append_sheet(workbook,listSheet,'📥 LISTA');

    const contacts=sheetFromRows(payload.contactHeaders||[],payload.contactRows||[],[['DUTRA OS — CONTATOS'],[`Gerado em: ${payload.generatedAt||''}`],[],[],[],[]]);
    self.XLSX.utils.book_append_sheet(workbook,contacts,'👥 CONTATOS');

    const output=self.XLSX.write(workbook,{bookType:'xlsx',type:'array',compression:true});
    self.postMessage({ok:true,buffer:output},[output]);
  }catch(error){
    self.postMessage({ok:false,error:error?.message||'Falha ao gerar workbook XLSX.'});
  }
};
