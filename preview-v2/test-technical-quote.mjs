import assert from 'node:assert/strict';
await import('./technical-quote-service-v3.js');
const t=globalThis.DUTRA_TECHNICAL_QUOTE;

const data={
  pricingTiers:{lead_ie:{id:'lead_ie',name:'Lead IE',equalizador:213,suporte:22,mangueira:30}},
  catalog:[
    {code:'EQ-120',internalCode:'762',name:'Equalizador Traseiro 120 Libras',category:'equalizador',priceBase:172},
    {code:'EQ-120D',internalCode:'120D',name:'Equalizador Dianteiro 120 Libras',category:'equalizador',priceBase:172},
    {code:'EQ-1145',internalCode:'2346',name:'Suporte Tração Universal',category:'suporte',priceBase:22},
    {code:'EQ-1250',internalCode:'1250',name:'Suporte Dianteiro Scania e Volvo',category:'suporte',priceBase:22},
    {code:'EQ-1135',internalCode:'2344',name:'Suporte Universal Truck e Carreta',category:'suporte',priceBase:22},
    {code:'EQ-1330',internalCode:'1494',name:'Suporte Redução Volvo/Scania',category:'suporte',priceBase:22},
    {code:'EQ-1390',internalCode:'1783',name:'Suporte Scania Ar',category:'suporte',priceBase:22},
    {code:'EQ-1040',internalCode:'774',name:'Mangueira Reta 410',category:'mangueira',priceBase:30},
    {code:'EQ-1043',internalCode:'1236',name:'Mangueira Curva 320',category:'mangueira',priceBase:30},
    {code:'EQ-1041',internalCode:'1041',name:'Mangueira Dianteira',category:'mangueira',priceBase:30}
  ]
};
const rodotrem={id:'rodotrem_9eixos',name:'Rodotrem — 9 Eixos (6x4 Traçado)',category:'Super Combinações',axles:{dianteiro:1,tracao:2,truck:0,carreta:6},questions:[
  {id:'brand',question:'Marca?',options:[{value:'volvo',label:'Volvo'},{value:'scania',label:'Scania'}]},
  {id:'scania_suspension',showIf:{brand:'scania'},options:[{value:'ar',label:'Ar',hint:'EQ-1390'},{value:'mola',label:'Mola',hint:'EQ-1190'}]},
  {id:'has_reduction',question:'Redução?',options:[{value:'sim',label:'Sim',hint:'Volvo/Scania: EQ-1330'},{value:'nao',label:'Não'}]}
]};
const q=t.buildQuote(rodotrem,{brand:'volvo',has_reduction:'nao'},{qty:10,psi:120,includeFront:false,tierKey:'lead_ie',installments:6},data);
assert.equal(q.rearEqualizersPerVehicle,16);
assert.equal(q.totalTires,320);
assert.equal(q.lines.find(x=>x.code==='EQ-120').qty,160);
assert.equal(q.lines.find(x=>x.code==='EQ-1145').qty,40);
assert.equal(q.lines.find(x=>x.code==='EQ-1135').qty,120);
assert.equal(q.lines.find(x=>x.code==='EQ-1040').qty,160);
assert.equal(q.lines.find(x=>x.code==='EQ-1043').qty,160);
assert.equal(q.technicallyReady,true);

const reduced=t.buildQuote(rodotrem,{brand:'volvo',has_reduction:'sim'},{qty:1,psi:120,includeFront:false,tierKey:'lead_ie',installments:6},data);
assert.equal(reduced.positions.find(x=>x.position==='tracao').code,'EQ-1330');

const ambiguous=t.buildQuote(rodotrem,{brand:'scania',scania_suspension:'ar',has_reduction:'sim'},{qty:1,psi:120,includeFront:false,tierKey:'lead_ie',installments:6},data);
assert.equal(ambiguous.technicallyReady,false);
assert.equal(ambiguous.positions.find(x=>x.position==='tracao').status,'VALIDATE');
assert.ok(ambiguous.lines.some(x=>x.code==='SUPORTE-A-DEFINIR'));

const bitrem={id:'bitrem_7eixos',name:'Bitrem',category:'Combinações',axles:{dianteiro:1,tracao:2,truck:0,carreta:4},questions:[{id:'traction_type',options:[{value:'6x2'},{value:'6x4'}]},{id:'brand',options:[{value:'volvo'}]}]};
assert.deepEqual(t.adjustedAxles(bitrem,{traction_type:'6x2'}),{dianteiro:1,tracao:1,truck:1,carreta:4});

console.log('Technical quote engine tests: PASS');