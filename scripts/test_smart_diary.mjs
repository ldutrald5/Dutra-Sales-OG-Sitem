import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const diary=require('../apps/sistema-og/services/smart-diary-service.js');

assert.throws(()=>diary.preview('   '),/texto ou transcrição/i);

const lead={id:'L1',fleetSize:'',pain:'',nextAction:'',interactions:[]};
const before=JSON.stringify(lead);
const result=diary.preview('Falei com o João. Tem 32 caminhões, está testando em 3 veículos. Pediu retorno sexta depois de falar com o sócio. Problema principal é desgaste irregular.');
assert.equal(JSON.stringify(lead),before,'preview não pode mutar lead');
assert.equal(result.version,'DIARY-01-preview-v1');
assert.equal(result.candidates.find(x=>x.field==='fleetSizeMentioned')?.value,32);
assert.equal(result.candidates.find(x=>x.field==='testFleetMentioned')?.value,3);
assert.match(result.candidates.find(x=>x.field==='painMentioned')?.value || '',/desgaste irregular/i);
assert.ok(result.candidates.find(x=>x.field==='commitmentMentioned')?.relativeDateText);
assert.equal(result.candidates.find(x=>x.field==='decisionProcessMentioned')?.confidence,'low');
assert.ok(result.candidates.every(x=>x.requiresConfirmation===true));
assert.ok(result.candidates.every(x=>x.evidence?.quote));
assert.equal(result.baseDate,null,'não deve inventar data-base');

const interested=diary.preview('Cliente gostou e ficou interessado.');
assert.ok(interested.warnings.some(x=>/não significam venda/i.test(x)));
assert.equal(interested.candidates.some(x=>x.field==='sale'),false);

console.log('DIARY-01 smart diary preview contract: PASS');

const fs = await import('node:fs');
const appSource = fs.readFileSync('apps/sistema-og/app.js','utf8');
const htmlSource = fs.readFileSync('apps/sistema-og/index.html','utf8');
const swSource = fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(appSource,/DIÁRIO INTELIGENTE · BETA/);
assert.match(appSource,/OG_SMART_DIARY\.preview/);
assert.match(appSource,/data-diary-candidate/);
assert.match(appSource,/OG_INTERACTION_SERVICE\.addInteraction/);
assert.match(htmlSource,/services\/smart-diary-service\.js/);
assert.match(swSource,/services\/smart-diary-service\.js/);
