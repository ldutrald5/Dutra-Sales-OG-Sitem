import assert from 'node:assert/strict'; import {createRequire} from 'node:module'; const require=createRequire(import.meta.url); const p=require('../apps/sistema-og/services/prospecting-public-search-provider.js');
assert.match(p.buildQuery({city:'Maringá',state:'PR',segment:'transportadora',minFleet:20}),/Maringá PR/);
const rows=p.normalizeWebResults({data:{web:[{title:'Exemplo Transportes - Logística',url:'https://example.org',description:'frota de 30 caminhões'}]}});
assert.equal(rows.length,1); assert.equal(rows[0].companyName,'Exemplo Transportes'); assert.equal(rows[0].sources.length,1);
let request; const a=p.createAdapter(async x=>(request=x,{data:{web:[]}})); await a.search({city:'Maringá',state:'PR',segment:'transportadora',requestedCount:50}); assert.equal(request.limit,25);
console.log('DUTRA-PROSPECT-05 public search provider: PASS');