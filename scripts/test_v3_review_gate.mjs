import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../preview-v2/review-gate-v3.js',import.meta.url),'utf8');
const lead={id:'L1',empresa:'Teste',fleetSize:0,interactions:[]};let committed=false;
const ctx={console,Date,globalThis:null,OG_CRM_SERVICE:{updateLeadProfile:(l,x)=>({...l,...x}),diffProfile:(a,b)=>Object.keys(b).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]))},OG_INTERACTION_SERVICE:{addInteraction:(l,x)=>l.interactions.push(x)},DUTRA_CORE:{getLeads:()=>[lead],commit:async()=>{committed=true}}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);
const g=ctx.DUTRA_REVIEW_GATE,s=g.fromResearch('L1',{profile:{fleetSize:42,decisionMaker:'Gestor',cnpj:'NAO-DEVE-ENTRAR'},sources:[{url:'https://example.test'}]});
const p=g.proposedProfile(s);assert.equal(p.fleetSize,42);assert.equal(p.decisionMaker,'Gestor');assert.equal('cnpj' in p,false);
await g.commitProfile(s,{fleetSize:45,decisionMaker:'Diretor',cnpj:'123'});assert.equal(lead.fleetSize,45);assert.equal(lead.decisionMaker,'Diretor');assert.equal(lead.cnpj,undefined);assert.equal(committed,true);assert.equal(lead.interactions.length,1);assert.match(lead.interactions[0].note,/Fontes:/);
console.log('V3 review gate: OK');