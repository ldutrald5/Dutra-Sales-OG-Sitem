import assert from 'node:assert/strict';

await import('./technical-application-core-v3.js');
await import('./technical-quote-service-v3.js');

const core=globalThis.DUTRA_TECHNICAL_APPLICATION;
const quote=globalThis.DUTRA_TECHNICAL_QUOTE;
assert.ok(core,'shared OG technical engine must attach');
assert.ok(quote,'V3 technical quote service must attach');

let r=core.resolveVehicleSupports('3_4',{wheel_size:'19',has_truck_3_4:'nao'});
assert.equal(r.suporteTracao.code,'EQ-1155');
assert.equal(r.suporteDianteiro.code,'EQ-1340');

r=core.resolveVehicleSupports('trucado_6x2_8x2',{brand:'scania',scania_suspension:'ar',has_reduction:'nao',is_bitruck:'6x2'});
assert.equal(r.suporteTracao.code,'EQ-1390');
assert.equal(r.suporteTruck.code,'EQ-1390');

r=core.resolveVehicleSupports('trucado_6x2_8x2',{brand:'volvo',has_reduction:'sim',is_bitruck:'6x2'});
assert.equal(r.suporteTracao.code,'EQ-1330');
assert.equal(r.suporteTruck.code,'EQ-1135');

r=core.resolveVehicleSupports('bitrem_7eixos',{brand:'volvo',traction_type:'6x2',has_reduction:'nao'});
assert.deepEqual(r.axlesCount,{dianteiro:1,tracao:1,truck:1,carreta:4});

r=core.resolveVehicleSupports('rodotrem_9eixos',{brand:'mb',has_reduction:'sim',mb_year:'ge2017'});
assert.equal(r.suporteTracao.code,'EQ-1271');
assert.equal(r.suporteCarreta.code,'EQ-1135');

const pieces=core.buildConsolidatedVehiclePieces('rodotrem_9eixos',{brand:'volvo',has_reduction:'nao'},120,false);
const map=Object.fromEntries(pieces.resultList.map(x=>[x.code,x.qty]));
assert.equal(map['EQ-120'],16);
assert.equal(map['EQ-1145'],4);
assert.equal(map['EQ-1135'],12);
assert.equal(map['EQ-1040'],16);
assert.equal(map['EQ-1043'],16);

const rule={
  id:'rodotrem_9eixos',
  name:'Rodotrem — 9 Eixos (6x4 Traçado)',
  category:'Super Combinações',
  axles:{dianteiro:1,tracao:2,truck:0,carreta:6},
  questions:[
    {id:'brand',options:[{value:'volvo',label:'Volvo'}]},
    {id:'has_reduction',options:[{value:'nao',label:'Não'}]}
  ]
};
const data={
  pricingTiers:{lead_ie:{id:'lead_ie',name:'Lead IE',equalizador:213,suporte:22,mangueira:30}},
  catalog:[
    {code:'EQ-120',name:'Equalizador 120',category:'equalizador',priceBase:172},
    {code:'EQ-1145',name:'Suporte Tração',category:'suporte',priceBase:22},
    {code:'EQ-1135',name:'Suporte Carreta',category:'suporte',priceBase:22},
    {code:'EQ-1040',name:'Mangueira Interna',category:'mangueira',priceBase:30},
    {code:'EQ-1043',name:'Mangueira Externa',category:'mangueira',priceBase:30}
  ]
};
const q=quote.buildQuote(rule,{brand:'volvo',has_reduction:'nao'},{qty:1,psi:120,includeFront:false,tierKey:'lead_ie',installments:6},data);
assert.equal(q.engineSource,'OG_LEGACY_SHARED');
assert.equal(q.lines.find(x=>x.code==='EQ-120').qty,16);
assert.equal(q.lines.find(x=>x.code==='EQ-1145').qty,4);
assert.equal(q.lines.find(x=>x.code==='EQ-1135').qty,12);
assert.equal(q.technicallyReady,true);

console.log('Technical legacy/V3 parity tests: PASS');
