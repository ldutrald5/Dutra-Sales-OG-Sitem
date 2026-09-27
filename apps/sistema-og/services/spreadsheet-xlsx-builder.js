(function attach(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_XLSX_BUILDER=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const COLORS=Object.freeze({black:'171717',yellow:'F5C518',white:'FFFFFF',text:'171717',muted:'737373',border:'E6E6E6',paleYellow:'FFF8D6',lightGray:'F8F8F8',redFill:'FEE2E2',redText:'B91C1C',orangeFill:'FFEDD5',orangeText:'C2410C',greenFill:'DCFCE7',greenText:'166534'});
  const encoder=new TextEncoder();
  const xmlEscape=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

  function colName(index){let n=index+1,out='';while(n){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}return out;}
  function crc32(bytes){let crc=0xFFFFFFFF;for(let i=0;i<bytes.length;i++){crc^=bytes[i];for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);}return(crc^0xFFFFFFFF)>>>0;}
  function u16(n){const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,n,true);return b;}
  function u32(n){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n>>>0,true);return b;}
  function concat(chunks){const total=chunks.reduce((sum,item)=>sum+item.length,0),out=new Uint8Array(total);let offset=0;for(const item of chunks){out.set(item,offset);offset+=item.length;}return out;}
  function dosDateTime(date=new Date()){const year=Math.max(1980,date.getFullYear());return{time:((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((Math.floor(date.getSeconds()/2))&31),date:(((year-1980)&127)<<9)|(((date.getMonth()+1)&15)<<5)|(date.getDate()&31)};}

  function zipStore(files){
    const local=[],central=[];let offset=0;const stamp=dosDateTime(new Date());
    for(const file of files){
      const name=encoder.encode(file.name),data=typeof file.data==='string'?encoder.encode(file.data):file.data,crc=crc32(data);
      const localHeader=concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name]);
      local.push(localHeader,data);
      central.push(concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
      offset+=localHeader.length+data.length;
    }
    const localBlob=concat(local),centralBlob=concat(central),eocd=concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBlob.length),u32(localBlob.length),u16(0)]);
    return concat([localBlob,centralBlob,eocd]);
  }

  function stylesXml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="8">
<font><sz val="10"/><color rgb="FF${COLORS.text}"/><name val="Aptos"/><family val="2"/></font>
<font><b/><sz val="18"/><color rgb="FF${COLORS.yellow}"/><name val="Aptos Display"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FF${COLORS.yellow}"/><name val="Aptos"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FF${COLORS.white}"/><name val="Aptos"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FF${COLORS.text}"/><name val="Aptos"/><family val="2"/></font>
<font><sz val="9"/><color rgb="FF${COLORS.muted}"/><name val="Aptos"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FF${COLORS.redText}"/><name val="Aptos"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FF${COLORS.greenText}"/><name val="Aptos"/><family val="2"/></font>
</fonts>
<fills count="10">
<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.black}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.yellow}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.paleYellow}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.white}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.lightGray}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.redFill}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.orangeFill}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${COLORS.greenFill}"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="3">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FF${COLORS.border}"/></left><right style="thin"><color rgb="FF${COLORS.border}"/></right><top style="thin"><color rgb="FF${COLORS.border}"/></top><bottom style="thin"><color rgb="FF${COLORS.border}"/></bottom><diagonal/></border>
<border><left/><right/><top/><bottom style="medium"><color rgb="FF${COLORS.yellow}"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="15">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="7" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
  }

  function cellXml(value,rowIndex,colIndex,style=0){
    const ref=`${colName(colIndex)}${rowIndex}`;
    if(value===null||value===undefined||value==='')return `<c r="${ref}" s="${style}"/>`;
    if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}" s="${style}" t="n"><v>${value}</v></c>`;
    const text=xmlEscape(value),preserve=/^\s|\s$|\n/.test(String(value));
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t${preserve?' xml:space="preserve"':''}>${text}</t></is></c>`;
  }
  function rowXml(values,rowIndex,styleResolver,height){
    const cells=values.map((value,colIndex)=>cellXml(value,rowIndex,colIndex,styleResolver?styleResolver(value,colIndex):0)).join('');
    return `<row r="${rowIndex}"${height?` ht="${height}" customHeight="1"`:''}>${cells}</row>`;
  }
  function columnsXml(headers,rows){
    return `<cols>${headers.map((header,index)=>{let max=String(header??'').length;for(const row of rows.slice(0,500))max=Math.max(max,String(row?.[index]??'').length);let width=Math.min(Math.max(max+2,10),38);const name=String(header||'');if(/Resumo|Observa|Dor|Obje|Próxima ação/i.test(name))width=Math.max(width,28);if(/Empresa|Razão social/i.test(name))width=Math.max(width,24);return `<col min="${index+1}" max="${index+1}" width="${width}" customWidth="1"/>`;}).join('')}</cols>`;
  }
  function specialStyle(headers,row,colIndex,rowIndex){
    const header=headers[colIndex]||'',value=String(row[colIndex]??'').toLowerCase();
    if(/prioridade/i.test(header)){if(value.includes('urgent'))return 10;if(value.includes('alta'))return 11;if(value.includes('baixa'))return 14;return 7;}
    if(/temperatura/i.test(header)&&value.includes('quente'))return 11;
    if(/status|situação da conversa/i.test(header)){if(value.includes('fechado')||value.includes('cliente'))return 12;if(value.includes('negocia')||value.includes('interess'))return 11;if(value.includes('sem interesse')||value.includes('perdid'))return 10;}
    return rowIndex%2===0?4:5;
  }
  function worksheetXml(config){
    const headers=config.headers||[],rows=config.rows||[],headerRow=config.headerRow||1,maxCol=Math.max(1,headers.length),maxRow=Math.max(headerRow+rows.length,config.minRows||1),merges=config.merges||[],preRows=config.preRows||[],rowParts=[];
    for(const item of preRows)rowParts.push(rowXml(item.values,item.row,item.styleResolver,item.height));
    rowParts.push(rowXml(headers,headerRow,()=>3,26));
    rows.forEach((row,index)=>{const r=headerRow+1+index;rowParts.push(rowXml(row,r,(value,col)=>specialStyle(headers,row,col,index),22));});
    const mergeXml=merges.length?`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`:'';
    const autoFilter=config.autoFilter===false?'':`<autoFilter ref="A${headerRow}:${colName(maxCol-1)}${maxRow}"/>`;
    const pane=config.freezeRow?`<pane ySplit="${config.freezeRow}" topLeftCell="A${config.freezeRow+1}" activePane="bottomLeft" state="frozen"/>`:'';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><tabColor rgb="FFF5C518"/></sheetPr><dimension ref="A1:${colName(maxCol-1)}${maxRow}"/><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>${columnsXml(headers,rows)}<sheetData>${rowParts.join('')}</sheetData>${mergeXml}${autoFilter}</worksheet>`;
  }

  function indexOfHeader(payload,name){return(payload.headers||[]).indexOf(name);}
  function pick(payload,row,name){const i=indexOfHeader(payload,name);return i>=0?row[i]:'';}
  function crmConfig(payload){
    const headers=payload.headers||[],rows=payload.crmRows||[],last=colName(Math.max(0,headers.length-1));
    const count=(name,re)=>rows.filter(row=>re.test(String(pick(payload,row,name)||''))).length;
    const total=rows.length,hot=count('Temperatura',/quente/i),neg=count('Status',/negocia/i),clients=count('Situação da conversa',/cliente/i)||count('Status',/fechado/i);
    return{headers,rows,headerRow:7,freezeRow:7,preRows:[
      {row:1,height:28,values:[`📋 CRM — CARTEIRA COMERCIAL · ${payload.scopeLabel||'Leads'}`],styleResolver:()=>1},
      {row:2,height:22,values:[`Uma linha por cliente · Fonte mestre: DUTRA OS / state.leads · Gerado em ${payload.generatedAt||''}`],styleResolver:()=>2},
      {row:3,height:20,values:['TOTAL NA BASE','', '🔥 QUENTES','', 'NEGOCIAÇÃO','', 'CLIENTES'],styleResolver:(v,c)=>[0,2,4,6].includes(c)?6:0},
      {row:4,height:24,values:[total,'',hot,'',neg,'',clients],styleResolver:(v,c)=>[0,2,4,6].includes(c)?7:0},{row:5,values:[]},{row:6,values:[]}
    ],merges:[`A1:${last}1`,`A2:${last}2`]};
  }
  function todayConfig(payload){
    const headers=['Código','Prioridade','Status','Temp.','Empresa / Nome','WhatsApp','Próxima ação','Data','Situação','Origem','Score'];
    const rows=(payload.crmRows||[]).map(row=>[pick(payload,row,'Código cliente'),pick(payload,row,'Prioridade'),pick(payload,row,'Status'),pick(payload,row,'Temperatura'),pick(payload,row,'Empresa / Nome'),pick(payload,row,'WhatsApp principal'),pick(payload,row,'Próxima ação'),pick(payload,row,'Data próxima ação'),pick(payload,row,'Situação da conversa'),pick(payload,row,'Origem'),pick(payload,row,'Score')]).sort((a,b)=>Number(b[10]||0)-Number(a[10]||0)).slice(0,20);
    const overdue=rows.filter(r=>String(r[7]||'')&&!Number.isNaN(new Date(r[7]).getTime())&&new Date(r[7]).getTime()<Date.now()).length,hot=rows.filter(r=>/quente/i.test(String(r[3]))).length,neg=rows.filter(r=>/negocia/i.test(String(r[2]))).length;
    return{headers,rows,headerRow:8,freezeRow:8,preRows:[
      {row:1,height:28,values:['🚀 HOJE — CENTRAL DE EXECUÇÃO'],styleResolver:()=>1},{row:2,height:22,values:['NOW: ligar → registrar → próxima ação → data'],styleResolver:()=>2},
      {row:4,height:20,values:['🔴 ATRASADOS','', '🔥 QUENTES','', 'NEGOCIAÇÃO','', 'SELECIONADOS'],styleResolver:(v,c)=>[0,2,4,6].includes(c)?6:0},
      {row:5,height:24,values:[overdue,'',hot,'',neg,'',rows.length],styleResolver:(v,c)=>[0,2,4,6].includes(c)?7:0},{row:6,values:[]},{row:7,values:[]}
    ],merges:['A1:K1','A2:K2']};
  }
  function listConfig(payload){
    const wanted=['Código cliente','Empresa / Nome','Contato principal','WhatsApp principal','Cidade / UF','Origem','Potencial','Observações','Prioridade','Situação da conversa','Data próxima ação','Score'],indices=wanted.map(name=>indexOfHeader(payload,name)),rows=(payload.crmRows||[]).map(row=>indices.map(i=>i>=0?row[i]:''));
    return{headers:wanted,rows,headerRow:4,freezeRow:4,preRows:[{row:1,height:28,values:['📥 LISTA — LEADS PARA PROSPECÇÃO'],styleResolver:()=>1},{row:2,height:22,values:[`Visão exportada do DUTRA OS · ${payload.scopeLabel||''}`],styleResolver:()=>2},{row:3,values:[]}],merges:['A1:L1','A2:L2']};
  }
  function contactsConfig(payload){
    const headers=payload.contactHeaders||[],rows=payload.contactRows||[],last=colName(Math.max(0,headers.length-1));
    return{headers,rows,headerRow:4,freezeRow:4,preRows:[{row:1,height:28,values:['👥 CONTATOS — PESSOAS LIGADAS ÀS EMPRESAS'],styleResolver:()=>1},{row:2,height:22,values:['Use uma linha por pessoa. Código e empresa mantêm o vínculo com a carteira.'],styleResolver:()=>2},{row:3,values:[]}],merges:[`A1:${last}1`,`A2:${last}2`]};
  }

  function workbookXml(names){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${names.map((name,index)=>`<sheet name="${xmlEscape(name)}" sheetId="${index+1}" r:id="rId${index+1}"/>`).join('')}</sheets></workbook>`;}
  function workbookRels(count){const sheets=Array.from({length:count},(_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('');return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets}<Relationship Id="rId${count+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;}
  function rootRels(){return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';}
  function contentTypes(count){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${Array.from({length:count},(_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;}

  function buildParts(payload){
    const configs=[todayConfig(payload),crmConfig(payload),listConfig(payload),contactsConfig(payload)],names=['🚀 HOJE','📋 CRM','📥 LISTA','👥 CONTATOS'];
    const files=[{name:'[Content_Types].xml',data:contentTypes(configs.length)},{name:'_rels/.rels',data:rootRels()},{name:'xl/workbook.xml',data:workbookXml(names)},{name:'xl/_rels/workbook.xml.rels',data:workbookRels(configs.length)},{name:'xl/styles.xml',data:stylesXml()}];
    configs.forEach((config,index)=>files.push({name:`xl/worksheets/sheet${index+1}.xml`,data:worksheetXml(config)}));
    return files;
  }
  function buildXlsx(payload){if(!payload||!Array.isArray(payload.headers)||!Array.isArray(payload.crmRows))throw new Error('Payload XLSX inválido.');return zipStore(buildParts(payload));}

  return{COLORS,colName,crc32,zipStore,stylesXml,worksheetXml,buildParts,buildXlsx};
});
