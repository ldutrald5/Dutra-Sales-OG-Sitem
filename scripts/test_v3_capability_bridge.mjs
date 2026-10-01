import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../preview-v2/capability-bridge-v3.js',import.meta.url),'utf8');
const events=[];
const context={
  console,
  Date,
  CustomEvent: class { constructor(type,init={}){this.type=type;this.detail=init.detail} },
  window:{dispatchEvent:event=>events.push(event)},
  globalThis:null
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context);

const cap=context.DUTRA_CAPABILITIES;
assert.ok(cap);
assert.equal(cap.has('quote'),true);
assert.equal(cap.has('prospect-research'),true);
assert.equal(cap.has('call-intelligence'),true);
assert.equal(cap.has('content-studio'),true);
assert.equal(cap.list().length,4);

let unavailable=false;
try{await cap.execute('content-studio',{objective:'test'});}catch(error){unavailable=error.message.includes('não configurado');}
assert.equal(unavailable,true,'optional worker must fail closed without breaking bridge');

context.DUTRA_QUOTE_HANDOFF={launch:(lead,contact,options)=>({leadId:lead.id,contact,options})};
const q=await cap.execute('quote',{lead:{id:'L1'},contact:{name:'Teste'},options:{target:'_self'}});
assert.equal(q.result.leadId,'L1');
assert.equal(q.engine,'DUTRA_QUOTE_HANDOFF');

cap.register('content-studio',{engine:'mock-media',execute:async p=>({ok:true,objective:p.objective})});
const media=await cap.execute('content-studio',{objective:'video OG'});
assert.equal(media.result.ok,true);
assert.equal(media.result.objective,'video OG');

console.log('V3 capability bridge: OK');
