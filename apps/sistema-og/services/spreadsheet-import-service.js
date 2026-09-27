(function attach(root,factory){const api=factory(root);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OG_SPREADSHEET_IMPORT=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const CRM_SHEETS=['🚀 HOJE','📋 CRM','📥 LISTA','👥 CONTATOS'];
  const CRM_HEADERS=['Código cliente','Empresa / Nome','WhatsApp principal','Status','Temperatura','Próxima ação','Data próxima ação','Prioridade','Última interação','Resumo da conversa','Potencial','Tipo','Origem','Canal','Indicação','Observações','Score','CNPJ / CPF','Razão social','PF / PJ','Cidade / UF','Contato principal','Nº contatos'];
  const IMPORT_LIMITS=Object.freeze({maxFileBytes:5_000_000,maxSheets:16,maxRowsPerSheet:5_000,maxCells:100_000,maxCellChars:10_000,timeoutMs:8_000});

  const digits=value=>String(value??'').replace(/\D/g,'');
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const compact=value=>norm(value).replace(/\s+/g,'');
  const codeKey=value=>{const raw=String(value??'').trim().replace(/\s+/g,'');if(!raw)return'';if(/^\d+$/.test(raw))return String(Number.parseInt(raw,10));return compact(raw);};
  const clean=value=>String(value??'').trim();

  const FIELD_DEFS=Object.freeze([
    {key:'externalCode',label:'Código OG',aliases:['codigo cliente','codigo og','codigo','cod cliente','cod','id cliente'],current:l=>l.internalCode||l.externalCode||'',incoming:r=>r.externalCode},
    {key:'company',label:'Empresa',aliases:['empresa nome','empresa','razao social nome','razao social','cliente','nome empresa'],current:l=>l.empresa||'',incoming:r=>r.company},
    {key:'contact',label:'Contato',aliases:['contato principal','contato','nome contato','responsavel','nome'],current:l=>l.nome||'',incoming:r=>r.primaryContact},
    {key:'phone',label:'Telefone principal',aliases:['whatsapp principal','whatsapp','telefone','numero do cliente','numero cliente','celular','fone'],current:l=>l.telefone||'',incoming:r=>r.phone},
    {key:'document',label:'CNPJ / CPF',aliases:['cnpj cpf','cnpj','cpf','documento'],current:l=>l.cnpj||l.cpf||'',incoming:r=>r.document},
    {key:'email',label:'E-mail',aliases:['email','e mail','e-mail'],current:l=>l.email||'',incoming:r=>r.email},
    {key:'city',label:'Cidade / UF',aliases:['cidade uf','cidade estado','cidade','localizacao','uf'],current:l=>l.cidadeUf||'',incoming:r=>r.city},
    {key:'segment',label:'Segmento',aliases:['segmento','tipo operacao','operacao'],current:l=>l.segmentId||'',incoming:r=>r.segment},
    {key:'status',label:'Status comercial',aliases:['status','etapa','funil'],current:l=>l.status||'',incoming:r=>r.status},
    {key:'conversationStage',label:'Situação da conversa',aliases:['situacao da conversa','situacao conversa','conversa','estado conversa','status conversa'],current:l=>l.conversationStage||'',incoming:r=>r.conversationStage},
    {key:'priority',label:'Prioridade',aliases:['prioridade','priority'],current:l=>l.priorityBand||l.priority||'',incoming:r=>r.priority},
    {key:'temperature',label:'Temperatura',aliases:['temperatura','temp'],current:l=>l.temperature||'',incoming:r=>r.temperature},
    {key:'potential',label:'Potencial',aliases:['potencial','potential'],current:l=>l.potential||'',incoming:r=>r.potential},
    {key:'decisionMaker',label:'Decisor',aliases:['decisor','decision maker','responsavel decisao','gestor','comprador'],current:l=>l.decisionMaker||'',incoming:r=>r.decisionMaker},
    {key:'fleetSize',label:'Frota',aliases:['frota','tamanho frota','quantidade veiculos','qtd veiculos','veiculos'],current:l=>l.fleetSize||'',incoming:r=>r.fleetSize},
    {key:'pain',label:'Dor principal',aliases:['dor','dor principal','problema','necessidade'],current:l=>l.pain||'',incoming:r=>r.pain},
    {key:'objections',label:'Objeções',aliases:['objecoes','objeções','objection'],current:l=>Array.isArray(l.objections)?l.objections.join(' | '):(l.objections||''),incoming:r=>r.objections},
    {key:'nextAction',label:'Próxima ação',aliases:['proxima acao','próxima ação','next action','acao'],current:l=>l.nextAction||'',incoming:r=>r.nextAction},
    {key:'nextActionAt',label:'Data de retorno',aliases:['data proxima acao','data próxima ação','data retorno','retorno','follow up','followup'],current:l=>l.followUpAt||'',incoming:r=>r.nextActionAt},
    {key:'summary',label:'Resumo da conversa',aliases:['resumo da conversa','resumo conversa','resumo','historico conversa'],current:l=>l.accountSummary||'',incoming:r=>r.summary,protected:true},
    {key:'notes',label:'Observações',aliases:['observacoes','observações','obs','notas'],current:l=>l.observacoes||'',incoming:r=>r.notes,protected:true},
    {key:'sourceLabel',label:'Origem',aliases:['origem','source','fonte','lista'],current:l=>l.sourceLabel||l.sourceChannel||'',incoming:r=>r.origin},
    {key:'referral',label:'Indicação',aliases:['indicacao','indicação','referral'],current:l=>Array.isArray(l.referrals)?l.referrals.map(x=>x?.name||x?.company||x?.phone||'').filter(Boolean).join(' | '):'',incoming:r=>r.referral}
  ]);
  const FIELD_MAP=Object.freeze(FIELD_DEFS.map(def=>[def.key,def.label,def.current,def.incoming]));
  const PROTECTED=new Set(FIELD_DEFS.filter(def=>def.protected).map(def=>def.key));

  function preflightFile(file={}){
    const name=String(file.name||''),type=String(file.type||'');
    if(!/\.(xlsx|csv)$/i.test(name))throw new Error('Selecione um arquivo .xlsx ou .csv.');
    if(/\.xlsx$/i.test(name)&&type&&!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream'].includes(type))throw new Error('Tipo de arquivo Excel não permitido.');
    if(/\.csv$/i.test(name)&&type&&!['text/csv','application/csv','text/plain','application/vnd.ms-excel','application/octet-stream'].includes(type))throw new Error('Tipo de arquivo CSV não permitido.');
    if(Number(file.size||0)>IMPORT_LIMITS.maxFileBytes)throw new Error('Arquivo maior que 5 MB.');
    return true;
  }

  function validateSanitizedWorkbook(workbook){
    if(!workbook||!Array.isArray(workbook.SheetNames)||!workbook.sheets||typeof workbook.sheets!=='object')throw new Error('Conteúdo da planilha inválido.');
    if(workbook.SheetNames.length>IMPORT_LIMITS.maxSheets)throw new Error('Quantidade de abas excede o limite.');
    let cells=0;
    for(const name of workbook.SheetNames){
      const rows=workbook.sheets[name];
      if(!Array.isArray(rows)||rows.length>IMPORT_LIMITS.maxRowsPerSheet)throw new Error(`Aba ${name} excede o limite de linhas.`);
      for(const row of rows){
        if(!Array.isArray(row))throw new Error('Estrutura de célula inválida.');
        cells+=row.length;
        if(cells>IMPORT_LIMITS.maxCells)throw new Error('Planilha excede o limite de 100 mil células.');
        for(const value of row)if(String(value??'').length>IMPORT_LIMITS.maxCellChars)throw new Error('Uma célula excede o limite de texto.');
      }
    }
    return true;
  }

  function validateWorkbook(workbook){
    validateSanitizedWorkbook(workbook);
    const missing=CRM_SHEETS.filter(name=>!workbook.SheetNames.includes(name));
    return{valid:missing.length===0,missing,sheets:workbook.SheetNames.slice(),model:missing.length===0?'CRM_OG_MASTER':'GENERIC'};
  }

  function readCrmRows(workbook){
    const validation=validateWorkbook(workbook);
    if(!validation.valid)throw new Error(`Modelo não reconhecido. Abas ausentes: ${validation.missing.join(', ')}`);
    const rows=workbook.sheets['📋 CRM']||[];
    const header=rows[6]||[];
    const mismatches=CRM_HEADERS.map((expected,index)=>({expected,actual:String(header[index]||'')})).filter(item=>norm(item.expected)!==norm(item.actual));
    if(mismatches.length)throw new Error(`Cabeçalho CRM divergente em ${mismatches.length} coluna(s).`);
    return rows.slice(7).filter(row=>row.some(value=>String(value).trim())).map((row,index)=>({
      sourceRow:index+8,externalCode:String(row[0]??''),company:String(row[1]??''),phone:String(row[2]??''),status:String(row[3]??''),temperature:String(row[4]??''),nextAction:String(row[5]??''),nextActionAt:row[6]||'',priority:String(row[7]??''),lastInteraction:row[8]||'',summary:String(row[9]??''),potential:String(row[10]??''),type:String(row[11]??''),origin:String(row[12]??''),channel:String(row[13]??''),referral:String(row[14]??''),notes:String(row[15]??''),score:row[16],document:String(row[17]??''),legalName:String(row[18]??''),personType:String(row[19]??''),city:String(row[20]??''),primaryContact:String(row[21]??''),contactCount:row[22]
    }));
  }

  function parseCsvText(text){
    const input=String(text??'').replace(/^\uFEFF/,'');
    const sample=input.split(/\r?\n/).slice(0,6).join('\n');
    const candidates=[',',';','\t'];
    const delimiter=candidates.map(char=>({char,count:(sample.match(new RegExp(char==='\t'?'\\t':char===';'?';':',','g'))||[]).length})).sort((a,b)=>b.count-a.count)[0]?.char||';';
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<input.length;i++){
      const ch=input[i];
      if(ch==='"'){
        if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
      }else if(ch===delimiter&&!quoted){row.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r')&&!quoted){
        if(ch==='\r'&&input[i+1]==='\n')i++;
        row.push(cell);cell='';
        if(row.some(value=>String(value).trim()))rows.push(row);
        row=[];
      }else cell+=ch;
    }
    row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);
    return rows;
  }

  function csvToWorkbook(text){const rows=parseCsvText(text);const workbook={SheetNames:['CSV'],sheets:{CSV:rows}};validateSanitizedWorkbook(workbook);return workbook;}

  function headerAliasScore(value){
    const key=norm(value);
    if(!key)return 0;
    for(const def of FIELD_DEFS){
      if(def.aliases.some(alias=>norm(alias)===key))return 3;
      if(def.aliases.some(alias=>key.includes(norm(alias))||norm(alias).includes(key)))return 1;
    }
    return 0;
  }

  function suggestMapping(headers=[]){
    const used=new Set(),mapping={};
    FIELD_DEFS.forEach(def=>{
      let best={index:-1,score:0};
      headers.forEach((header,index)=>{
        if(used.has(index))return;
        const key=norm(header);
        let score=0;
        for(const alias of def.aliases){
          const a=norm(alias);
          if(key===a)score=Math.max(score,100+a.length);
          else if(key&&a&&(key.includes(a)||a.includes(key)))score=Math.max(score,50+Math.min(key.length,a.length));
        }
        if(score>best.score)best={index,score};
      });
      if(best.index>=0&&best.score>=50){mapping[def.key]=best.index;used.add(best.index);}
    });
    return mapping;
  }

  function detectTabularSource(workbook){
    validateSanitizedWorkbook(workbook);
    const canonical=validateWorkbook(workbook).valid;
    if(canonical)return{canonical:true,sheetName:'📋 CRM',headerRow:6,headers:CRM_HEADERS.slice(),mapping:Object.fromEntries(FIELD_DEFS.map(def=>[def.key,CRM_HEADERS.findIndex(header=>def.aliases.some(alias=>norm(alias)===norm(header)))]).filter(([,index])=>index>=0))};
    let best=null;
    for(const sheetName of workbook.SheetNames){
      const rows=workbook.sheets[sheetName]||[];
      for(let index=0;index<Math.min(rows.length,15);index++){
        const headers=rows[index]||[];
        const mapping=suggestMapping(headers);
        const mapped=Object.keys(mapping).length;
        const score=headers.reduce((sum,value)=>sum+headerAliasScore(value),0)+(mapping.company!=null?8:0)+(mapping.externalCode!=null||mapping.phone!=null||mapping.document!=null?5:0);
        if(!best||score>best.score)best={canonical:false,sheetName,headerRow:index,headers:headers.map(value=>String(value??'')),mapping,score,mapped};
      }
    }
    if(!best)throw new Error('A planilha não possui linhas utilizáveis.');
    return best;
  }

  function rowFromValues(values,mapping,sourceRow){
    const get=key=>mapping[key]==null?'':String(values[mapping[key]]??'').trim();
    return{
      sourceRow,externalCode:get('externalCode'),company:get('company'),primaryContact:get('contact'),phone:get('phone'),document:get('document'),email:get('email'),city:get('city'),segment:get('segment'),status:get('status'),conversationStage:get('conversationStage'),priority:get('priority'),temperature:get('temperature'),potential:get('potential'),decisionMaker:get('decisionMaker'),fleetSize:get('fleetSize'),pain:get('pain'),objections:get('objections'),nextAction:get('nextAction'),nextActionAt:get('nextActionAt'),summary:get('summary'),notes:get('notes'),origin:get('sourceLabel'),referral:get('referral')
    };
  }

  function rowsFromSource(workbook,source,mappingOverride){
    if(source?.canonical)return readCrmRows(workbook);
    const rows=workbook.sheets[source.sheetName]||[];
    const mapping=mappingOverride||source.mapping||{};
    return rows.slice(source.headerRow+1).map((values,index)=>rowFromValues(values,mapping,source.headerRow+2+index)).filter(row=>Object.values(row).some(value=>String(value??'').trim()));
  }

  function leadPhones(lead){return[lead?.telefone,...(Array.isArray(lead?.additionalPhones)?lead.additionalPhones.map(item=>typeof item==='string'?item:item?.phone):[])].map(digits).filter(Boolean);}
  function candidateMatches(row,leads=[]){
    const code=codeKey(row.externalCode),doc=digits(row.document),phone=digits(row.phone),email=norm(row.email),company=norm(row.company||row.legalName),city=norm(row.city);
    const candidates=[];
    for(const lead of leads){
      const reasons=[];
      if(code&&codeKey(lead.internalCode||lead.externalCode)===code)reasons.push('Código OG');
      if(doc&&digits(lead.cnpj||lead.cpf)===doc)reasons.push('CNPJ/CPF');
      if(phone&&leadPhones(lead).includes(phone))reasons.push('Telefone');
      if(email&&norm(lead.email)===email)reasons.push('E-mail');
      const strong=reasons.length>0;
      if(!strong&&company&&norm(lead.empresa||lead.nome)===company&&city&&norm(lead.cidadeUf)===city)reasons.push('Empresa + cidade');
      if(reasons.length)candidates.push({lead,leadId:lead.id,reasons,strong,confidence:strong?'high':'low'});
    }
    return candidates;
  }

  function matchLead(row,leads){
    const candidates=candidateMatches(row,leads);
    if(candidates.length!==1)return null;
    const item=candidates[0];
    return{lead:item.lead,key:item.reasons[0]==='Código OG'?'external_code':item.reasons[0]==='CNPJ/CPF'?'document':item.reasons[0]==='Telefone'?'phone':item.reasons[0]==='E-mail'?'email':'name_city',confidence:item.confidence};
  }

  function incomingIdentityKeys(row){
    const keys=[];
    const code=codeKey(row.externalCode),doc=digits(row.document),phone=digits(row.phone),email=norm(row.email);
    if(code)keys.push('code:'+code);if(doc)keys.push('doc:'+doc);if(phone)keys.push('phone:'+phone);if(email)keys.push('email:'+email);
    return keys;
  }

  function changeSet(row,lead){
    const changes=[];
    for(const def of FIELD_DEFS){
      const currentValue=def.current(lead)||'',incomingValue=def.incoming(row)||'';
      if(String(incomingValue).trim()&&norm(currentValue)!==norm(incomingValue))changes.push({field:def.key,label:def.label,current:currentValue,incoming:incomingValue,protected:Boolean(def.protected)});
    }
    return changes;
  }

  function preview(rows,leads=[]){
    const keyCounts=new Map();
    rows.forEach(row=>incomingIdentityKeys(row).forEach(key=>keyCounts.set(key,(keyCounts.get(key)||0)+1)));
    return rows.map(row=>{
      const repeatedKeys=incomingIdentityKeys(row).filter(key=>(keyCounts.get(key)||0)>1);
      const candidates=candidateMatches(row,leads);
      const hasIdentity=Boolean(clean(row.company)||clean(row.externalCode)||digits(row.document)||digits(row.phone)||norm(row.email));
      if(!hasIdentity)return{row,status:'INVALID',reason:'Sem empresa, código, documento, telefone ou e-mail',changes:[],candidates:[]};
      if(repeatedKeys.length)return{row,status:'POSSIBLE_DUPLICATE',reason:'Identificador repetido dentro da própria planilha',changes:[],candidates:candidates.map(c=>({leadId:c.leadId,company:c.lead.empresa||c.lead.nome||'',reasons:c.reasons}))};
      if(candidates.length===0)return{row,status:'NEW',reason:'Nenhum cliente atual corresponde aos identificadores',changes:FIELD_DEFS.map(def=>({field:def.key,label:def.label,current:'',incoming:def.incoming(row)||'',protected:Boolean(def.protected)})).filter(item=>String(item.incoming).trim()),candidates:[]};
      if(candidates.length>1||!candidates[0].strong)return{row,status:'POSSIBLE_DUPLICATE',reason:candidates.length>1?'Mais de um cliente atual corresponde':'Correspondência fraca; revise antes de decidir',changes:candidates.length===1?changeSet(row,candidates[0].lead):[],matchedLeadId:candidates.length===1?candidates[0].leadId:null,candidates:candidates.map(c=>({leadId:c.leadId,company:c.lead.empresa||c.lead.nome||'',reasons:c.reasons}))};
      const matched=candidates[0],changes=changeSet(row,matched.lead),protectedChanges=changes.filter(change=>change.protected);
      return{row,matchedLeadId:matched.leadId,matchKey:matched.reasons.join(' + '),confidence:matched.confidence,changes,status:protectedChanges.length?'CONFLICT':changes.length?'SAFE_UPDATE':'UNCHANGED',reason:protectedChanges.length?'Há histórico/observação protegida para revisar':changes.length?`Correspondência por ${matched.reasons.join(' + ')}`:'Registro já está igual',candidates:[{leadId:matched.leadId,company:matched.lead.empresa||matched.lead.nome||'',reasons:matched.reasons}]};
    });
  }

  function summarizePreview(items=[]){
    const counts={NEW:0,SAFE_UPDATE:0,POSSIBLE_DUPLICATE:0,CONFLICT:0,INVALID:0,UNCHANGED:0};
    items.forEach(item=>{counts[item.status]=(counts[item.status]||0)+1;});
    return{total:items.length,newCount:counts.NEW,updateCount:counts.SAFE_UPDATE,duplicateCount:counts.POSSIBLE_DUPLICATE+counts.CONFLICT,invalidCount:counts.INVALID,unchangedCount:counts.UNCHANGED,counts};
  }

  const normalizeDecision=value=>['keep','excel','append','ignore'].includes(value)?value:'keep';

  function normalizeConversationStage(value){
    const key=norm(value);
    const map=[
      [['nao abordado','primeiro contato','novo'], 'first_contact'],
      [['ja conversei','em conversa','conversado','contatado'], 'talked'],
      [['nao respondeu','nao atende','sem resposta'], 'no_reply'],
      [['aguardando retorno','aguardando resposta','retorno'], 'waiting_response'],
      [['interessado'], 'interested'],
      [['proposta','proposta enviada'], 'proposal'],
      [['negociacao','em negociacao'], 'negotiation'],
      [['cliente'], 'customer'],
      [['cliente fidelizado','fidelizado'], 'loyal_customer'],
      [['sem interesse','nao interessado','perdido'], 'not_interested']
    ];
    for(const [aliases,id] of map)if(aliases.some(alias=>key===alias||key.includes(alias)))return id;
    return clean(value);
  }

  function normalizePriority(value){const key=norm(value);if(key.includes('urgent'))return'urgente';if(key.includes('alta'))return'alta';if(key.includes('baixa'))return'baixa';return'media';}
  function normalizeStatus(value){const key=norm(value);if(key.includes('proposta'))return'proposta_enviada';if(key.includes('negoci'))return'negociacao';if(key.includes('fechad')||key==='cliente')return'fechado';if(key.includes('perdid')||key.includes('standby'))return'perdido';if(key.includes('contat')||key.includes('conversa'))return'contatado';return'novo';}

  function newLeadFromRow(row,id,now){
    const doc=digits(row.document),priorityBand=normalizePriority(row.priority);
    const referral=clean(row.referral);
    return{id,empresa:clean(row.company||row.legalName||row.primaryContact),nome:clean(row.primaryContact),telefone:digits(row.phone),cnpj:doc.length===14?doc:'',cpf:doc.length===11?doc:'',internalCode:clean(row.externalCode),email:clean(row.email),cidadeUf:clean(row.city),segmentId:clean(row.segment)||'transportadora',status:normalizeStatus(row.status),priority:priorityBand==='urgente'?'alta':priorityBand,priorityBand,conversationStage:normalizeConversationStage(row.conversationStage||row.status),temperature:norm(row.temperature),potential:norm(row.potential),decisionMaker:clean(row.decisionMaker),fleetSize:Number.parseInt(digits(row.fleetSize)||'0',10)||0,pain:clean(row.pain),objections:clean(row.objections)?clean(row.objections).split(/[|;,]/).map(v=>v.trim()).filter(Boolean):[],nextAction:clean(row.nextAction),followUpAt:row.nextActionAt||'',accountSummary:clean(row.summary),observacoes:clean(row.notes),source:'spreadsheet_confirmed',sourceChannel:'spreadsheet',sourceLabel:clean(row.origin)||'Importação de planilha',sourceList:clean(row.origin)||'Planilha importada',createdDate:now.slice(0,10),createdAt:now,updatedAt:now,interactions:[],contacts:[],opportunities:[],tasks:[],additionalPhones:[],referrals:referral?[{name:referral,company:'',phone:'',note:'Importado da planilha'}]:[]};
  }

  function applyValue(lead,field,value){
    const map={company:'empresa',contact:'nome',phone:'telefone',email:'email',externalCode:'internalCode',city:'cidadeUf',segment:'segmentId',status:'status',conversationStage:'conversationStage',priority:'priorityBand',temperature:'temperature',potential:'potential',decisionMaker:'decisionMaker',fleetSize:'fleetSize',pain:'pain',nextAction:'nextAction',nextActionAt:'followUpAt',summary:'accountSummary',notes:'observacoes',sourceLabel:'sourceLabel'},key=map[field];
    if(field==='document'){const doc=digits(value);if(doc.length===11){lead.cpf=doc;lead.cnpj='';}else if(doc.length===14){lead.cnpj=doc;lead.cpf='';}return;}
    if(field==='phone'){lead.telefone=digits(value);return;}
    if(field==='status'){lead.status=normalizeStatus(value);return;}
    if(field==='conversationStage'){lead.conversationStage=normalizeConversationStage(value);return;}
    if(field==='priority'){const band=normalizePriority(value);lead.priorityBand=band;lead.priority=band==='urgente'?'alta':band;return;}
    if(field==='fleetSize'){lead.fleetSize=Number.parseInt(digits(value)||'0',10)||0;return;}
    if(field==='objections'){lead.objections=clean(value)?clean(value).split(/[|;,]/).map(v=>v.trim()).filter(Boolean):[];return;}
    if(field==='referral'){const text=clean(value);if(text){lead.referrals=Array.isArray(lead.referrals)?lead.referrals:[];if(!lead.referrals.some(item=>norm(item?.name)===norm(text)))lead.referrals.push({name:text,company:'',phone:'',note:'Importado da planilha'});}return;}
    if(key)lead[key]=value;
  }

  function applyPreview(items,leads=[],decisions={},options={}){
    const now=options.now||new Date().toISOString(),next=JSON.parse(JSON.stringify(leads)),audit=[];
    for(const item of items){
      const rowKey=String(item.row.sourceRow),rowDecision=decisions[rowKey]||{},action=rowDecision.action||'ignore';
      if(item.status==='INVALID'||action==='ignore'||action==='review')continue;
      if(action==='create'||action==='import'){
        const id=(options.idFactory||((row,index)=>`LEAD-SHEET-${Date.now()}-${index}`))(item.row,audit.length),lead=newLeadFromRow(item.row,id,now);
        next.push(lead);audit.push({type:'spreadsheet_client_created',leadId:id,sourceRow:item.row.sourceRow,changedFields:Object.keys(lead)});continue;
      }
      if(action!=='update')continue;
      const targetId=rowDecision.targetLeadId||item.matchedLeadId;
      const lead=next.find(value=>String(value.id)===String(targetId));
      if(!lead)continue;
      const changes=item.changes?.length?item.changes:changeSet(item.row,lead),changedFields=[];
      for(const change of changes){
        const explicit=rowDecision.fields?.[change.field];
        const decision=explicit?normalizeDecision(explicit):(change.protected?'keep':'excel');
        if(decision==='keep'||decision==='ignore')continue;
        let value=change.incoming;
        if(decision==='append')value=[String(change.current||'').trim(),String(change.incoming||'').trim()].filter(Boolean).join('\n— Importado da planilha —\n');
        applyValue(lead,change.field,value);changedFields.push(change.field);
      }
      if(changedFields.length){lead.updatedAt=now;audit.push({type:'spreadsheet_client_updated',leadId:lead.id,sourceRow:item.row.sourceRow,changedFields});}
    }
    return{leads:next,audit,applied:audit.length};
  }

  function readArrayBuffer(buffer,file={}){
    if(typeof root.Worker!=='function')return Promise.reject(new Error('Leitor Excel isolado indisponível neste ambiente.'));
    preflightFile({...file,size:file.size??buffer?.byteLength});
    if(/\.csv$/i.test(String(file.name||'')))return Promise.reject(new Error('CSV deve ser lido como texto.'));
    return new Promise((resolve,reject)=>{
      const worker=new root.Worker('/workers/spreadsheet-worker.js'),timer=setTimeout(()=>{worker.terminate();reject(new Error('A leitura do Excel excedeu 8 segundos.'));},IMPORT_LIMITS.timeoutMs);
      worker.onmessage=event=>{clearTimeout(timer);worker.terminate();if(!event.data?.ok)return reject(new Error(event.data?.error||'Falha ao interpretar Excel.'));try{validateSanitizedWorkbook(event.data.workbook);resolve(event.data.workbook);}catch(error){reject(error);}};
      worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(new Error('Falha no leitor Excel isolado.'));};
      worker.postMessage({buffer,limits:IMPORT_LIMITS},[buffer]);
    });
  }

  async function readFile(file){
    preflightFile(file);
    if(/\.csv$/i.test(file.name||''))return csvToWorkbook(await file.text());
    return readArrayBuffer(await file.arrayBuffer(),{name:file.name,type:file.type,size:file.size});
  }

  function protectedContract(){return{formula:['📋 CRM!Q:Q','🚀 HOJE!A:W'],manual:['📋 CRM!P:P','👥 CONTATOS!H:H'],derived:['📋 CRM!I:I','📋 CRM!W:W'],structure:['tables','merges','validations','conditionalFormatting'],writable:CRM_HEADERS.filter(item=>!['Score','Nº contatos'].includes(item))};}

  return{CRM_SHEETS,CRM_HEADERS,IMPORT_LIMITS,FIELD_DEFS,FIELD_MAP,validateWorkbook,validateSanitizedWorkbook,preflightFile,readCrmRows,parseCsvText,csvToWorkbook,suggestMapping,detectTabularSource,rowsFromSource,candidateMatches,matchLead,preview,summarizePreview,applyPreview,readArrayBuffer,readFile,protectedContract,digits,norm};
});
