import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const intake=require('../apps/sistema-og/services/prospecting-intake-service.js');
const territory=require('../apps/sistema-og/services/territory-readiness-service.js');

const mission=intake.buildResearchMission({ location:'Cascavel - PR', segment:'transportadora', minFleet:30, requestedCount:25 }, { territoryReadiness:territory });
assert.equal(mission.capability,'prospect.research');
assert.equal(mission.payload.criteria.city,'Cascavel');
assert.equal(mission.payload.criteria.state,'PR');
assert.equal(mission.payload.mutationPolicy,'prepare_only');

const candidate=intake.normalizeCandidate({
 companyName:'Transportadora Exemplo', city:'Cascavel', state:'PR', segment:'Transportadora rodoviária', fleetSize:45,
 sourceSnippet:'Frota própria com 45 caminhões', sources:[{url:'https://example.com/frota',title:'Frota',supports:['fleet_evidence']}]
},mission.payload.criteria);
assert.equal(candidate.reviewStatus,'ready_for_review');
assert.equal(candidate.sourceSnippet,'Frota própria com 45 caminhões');
assert.ok(candidate.fitReasons.includes('fleet_threshold'));

const [deduped]=intake.dedupeAgainstCrm([candidate],[{company:'Transportadora Exemplo'}]);
assert.equal(deduped.duplicate,true);
assert.equal(deduped.importAllowed,false);

assert.throws(()=>intake.buildResearchMission({location:'Cascavel',segment:'transportadora'},{territoryReadiness:territory}),/cidade e UF/i);
console.log('prospecting intake tests: PASS');
