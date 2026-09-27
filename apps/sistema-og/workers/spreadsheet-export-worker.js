'use strict';
importScripts('../services/spreadsheet-xlsx-builder.js');

self.onmessage=event=>{
  try{
    const payload=event.data?.payload;
    const output=self.OG_XLSX_BUILDER.buildXlsx(payload);
    self.postMessage({ok:true,buffer:output.buffer},[output.buffer]);
  }catch(error){
    self.postMessage({ok:false,error:error?.message||'Falha ao gerar workbook XLSX.'});
  }
};
