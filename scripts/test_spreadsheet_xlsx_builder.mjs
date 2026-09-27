import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const builder=require('../apps/sistema-og/services/spreadsheet-xlsx-builder.js');

const payload={
  scope:'current',
  scopeLabel:'Visão atual',
  generatedAt:'2026-09-27T20:14:00-03:00',
  headers:['Código cliente','Empresa / Nome','WhatsApp principal','Status','Temperatura','Próxima ação','Data próxima ação','Prioridade','Última interação','Resumo da conversa','Potencial','Tipo','Origem','Canal','Indicação','Observações','Score','CNPJ / CPF','Razão social','PF / PJ','Cidade / UF','Contato principal','Nº contatos','Telefones adicionais','E-mail','Situação da conversa','Decisor','Frota','Dor principal','Objeções','Lista / lote','Data criação','Última atualização','ID interno'],
  crmRows:[
    ['0012','Rodolog','44999999999','negociacao','quente','Ligar','2026-09-28','urgente','','Falou com gestor','alto','transportadora','Indicação','whatsapp','Carlos','Estratégico',155,'12345678000190','Rodolog','PJ','Maringá / PR','João',2,'4433334444','joao@example.com','waiting_response','João',30,'Desgaste irregular','preço | prazo','Carteira','2026-09-20','2026-09-27','L1'],
    ['0013','Outra Transportadora','44988887777','fechado','morno','','','baixa','','Cliente ativo','medio','transportadora','Pós-venda','whatsapp','','',60,'','','PJ','Mandaguaçu / PR','Maria',1,'','','customer','Maria',12,'','','Clientes','2026-09-18','2026-09-26','L2']
  ],
  contactHeaders:['Código cliente','Empresa','Contato','Telefone','E-mail','Tipo','Papel / decisor','Observações'],
  contactRows:[['0012','Rodolog','João','44999999999','joao@example.com','Principal','Decisor',''],['0013','Outra Transportadora','Maria','44988887777','','Principal','Decisor','']]
};

const parts=builder.buildParts(payload);
const names=parts.map(part=>part.name);
assert.ok(names.includes('[Content_Types].xml'));
assert.ok(names.includes('xl/styles.xml'));
assert.ok(names.includes('xl/worksheets/sheet2.xml'));

const styles=parts.find(part=>part.name==='xl/styles.xml').data;
assert.match(styles,/FFF5C518/);
assert.match(styles,/FF171717/);
assert.match(styles,/Aptos Display/);

const crm=parts.find(part=>part.name==='xl/worksheets/sheet2.xml').data;
assert.match(crm,/mergeCell ref="A1:AH1"/);
assert.match(crm,/pane ySplit="7" topLeftCell="A8"/);
assert.match(crm,/r="A7"/);
assert.match(crm,/Código cliente/);
assert.match(crm,/Rodolog/);
assert.match(crm,/s="10"/);
assert.match(crm,/s="12"/);

const today=parts.find(part=>part.name==='xl/worksheets/sheet1.xml').data;
assert.match(today,/CENTRAL DE EXECUÇÃO/);
assert.match(today,/SELECIONADOS/);

const xlsx=builder.buildXlsx(payload);
assert.ok(xlsx instanceof Uint8Array);
assert.equal(xlsx[0],0x50);
assert.equal(xlsx[1],0x4B);
const bytes=Buffer.from(xlsx);
assert.ok(bytes.includes(Buffer.from('xl/styles.xml')));
assert.ok(bytes.includes(Buffer.from('xl/worksheets/sheet4.xml')));

console.log('CRM Master visual XLSX builder tests: PASS');
