import fs from 'node:fs';
import path from 'node:path';
import {
  benchmarkCase,
  normalizeGeoapifyResult,
  normalizeMapboxResult,
  selectBestGeocode,
} from '../supabase/functions/_shared/geocoding.mjs';

function arg(name,fallback=null){
  const prefix='--'+name+'=';
  const item=process.argv.slice(2).find(value=>value.startsWith(prefix));
  return item?item.slice(prefix.length):fallback;
}
const hasFlag=name=>process.argv.slice(2).includes('--'+name);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const fixturePath=path.resolve(arg('fixture','scripts/geocoding/benchmark-br.template.json'));
const outputPath=path.resolve(arg('output','/tmp/dutra-geocoding-benchmark.json'));
const providerArg=arg('providers','geoapify,mapbox').split(',').map(v=>v.trim()).filter(Boolean);
const maxCases=Math.max(1,Number(arg('max','100'))||100);
const dryRun=hasFlag('dry-run');
const delayMs=Math.max(0,Number(arg('delay-ms','300'))||300);

const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
const cases=Array.isArray(fixture.cases)?fixture.cases:[];
const allowedProviders=new Set(['geoapify','mapbox']);
for(const provider of providerArg){
  if(!allowedProviders.has(provider))throw new Error('unsupported provider: '+provider);
}

function validateCase(item,index){
  if(!item||typeof item!=='object')throw new Error('case '+index+' must be an object');
  if(!String(item.id||'').trim())throw new Error('case '+index+' missing id');
  if(!item.input||typeof item.input!=='object')throw new Error('case '+item.id+' missing input');
  if(!String(item.input.city||'').trim()||!String(item.input.state||'').trim()){
    throw new Error('case '+item.id+' must include city and state');
  }
  if(item.reference){
    for(const field of ['lat','lng','toleranceMeters']){
      if(!Number.isFinite(Number(item.reference[field])))throw new Error('case '+item.id+' invalid reference '+field);
    }
    if(!String(item.reference.source||'').trim())throw new Error('case '+item.id+' reference source is required');
  }
}
cases.forEach(validateCase);

const requiredBuckets=Array.isArray(fixture.requiredBuckets)?fixture.requiredBuckets:[];
const bucketCounts=Object.fromEntries(requiredBuckets.map(bucket=>[
  bucket,
  cases.filter(item=>item.bucket===bucket&&item.reference).length
]));
const referencedCases=cases.filter(item=>item.reference).length;

if(dryRun){
  console.log(JSON.stringify({
    ok:true,
    dryRun:true,
    fixture:fixturePath,
    totalCases:cases.length,
    referencedCases,
    requiredBuckets,
    bucketCounts,
    selectionReady:referencedCases>=80&&requiredBuckets.every(bucket=>(bucketCounts[bucket]||0)>=5)
  },null,2));
  process.exit(0);
}

if(cases.length===0)throw new Error('benchmark fixture has no cases');
const selected=cases.slice(0,maxCases);

async function requestJson(url,{headers={}}={}){
  let attempt=0;
  while(true){
    attempt++;
    const response=await fetch(url,{headers});
    const text=await response.text();
    let payload;
    try{payload=JSON.parse(text);}catch{payload={raw:text};}
    if(response.ok)return payload;

    const retryable=response.status===429||response.status>=500;
    if(!retryable||attempt>=3){
      const err=new Error('http_'+response.status);
      err.status=response.status;
      err.payload=payload;
      throw err;
    }
    const retryAfter=Number(response.headers.get('retry-after'));
    const wait=Number.isFinite(retryAfter)&&retryAfter>0
      ?retryAfter*1000
      :Math.min(5000,500*2**(attempt-1));
    await sleep(wait);
  }
}

function structuredQuery(input){
  const entries=[
    ['housenumber',input.number],
    ['street',input.street],
    ['postcode',input.postalCode],
    ['city',input.city],
    ['state',input.state],
    ['country','Brazil'],
  ].filter(([,value])=>String(value??'').trim());
  return entries;
}

async function geocodeGeoapify(input){
  const key=process.env.GEOAPIFY_API_KEY||'';
  if(!key)throw new Error('GEOAPIFY_API_KEY missing');
  const params=new URLSearchParams([
    ...structuredQuery(input),
    ['filter','countrycode:br'],
    ['lang','pt'],
    ['limit','3'],
    ['format','json'],
    ['apiKey',key],
  ]);
  const payload=await requestJson('https://api.geoapify.com/v1/geocode/search?'+params.toString());
  return (payload.results||[]).map(normalizeGeoapifyResult).filter(Boolean);
}

async function geocodeMapbox(input){
  const token=process.env.MAPBOX_ACCESS_TOKEN||'';
  if(!token)throw new Error('MAPBOX_ACCESS_TOKEN missing');
  if(process.env.MAPBOX_PERMANENT_ALLOWED!=='1'){
    throw new Error('MAPBOX_PERMANENT_ALLOWED=1 is required before billable/storable benchmark calls');
  }
  const params=new URLSearchParams();
  if(input.number)params.set('address_number',String(input.number));
  if(input.street)params.set('street',String(input.street));
  if(input.city)params.set('place',String(input.city));
  if(input.state)params.set('region',String(input.state));
  if(input.postalCode)params.set('postcode',String(input.postalCode));
  params.set('country','br');
  params.set('types','address,street,postcode,place');
  params.set('language','pt');
  params.set('limit','3');
  params.set('permanent','true');
  params.set('access_token',token);
  const payload=await requestJson('https://api.mapbox.com/search/geocode/v6/forward?'+params.toString());
  return (payload.features||[]).map(normalizeMapboxResult).filter(Boolean);
}

const providerCalls={
  geoapify:geocodeGeoapify,
  mapbox:geocodeMapbox,
};

const results=[];
for(const item of selected){
  for(const provider of providerArg){
    const started=Date.now();
    try{
      const candidates=await providerCalls[provider](item.input);
      const best=selectBestGeocode(item.input,candidates);
      const evaluation=benchmarkCase(item.input,best?.candidate||null,item.reference||null);
      results.push({
        caseId:item.id,
        bucket:item.bucket||null,
        provider,
        ok:Boolean(best),
        elapsedMs:Date.now()-started,
        candidate:best?.candidate||null,
        score:evaluation.score,
        distanceMeters:evaluation.distanceMeters,
        withinTolerance:evaluation.withinTolerance,
      });
    }catch(error){
      results.push({
        caseId:item.id,
        bucket:item.bucket||null,
        provider,
        ok:false,
        elapsedMs:Date.now()-started,
        error:error instanceof Error?error.message:String(error),
      });
    }
    if(delayMs)await sleep(delayMs);
  }
}

function percentile(values,p){
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  const index=Math.min(sorted.length-1,Math.max(0,Math.ceil(p*sorted.length)-1));
  return sorted[index];
}
function average(values){
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}
function summarize(provider){
  const rows=results.filter(row=>row.provider===provider);
  const success=rows.filter(row=>row.ok);
  const referenced=success.filter(row=>Number.isFinite(row.distanceMeters));
  const within=referenced.filter(row=>row.withinTolerance===true);
  const auto=success.filter(row=>row.score?.verificationStatus==='AUTO_ACCEPTED');
  const addressPrecision=success.filter(row=>['ROOFTOP','ADDRESS'].includes(row.score?.precision));
  const distances=referenced.map(row=>row.distanceMeters);
  const componentScores=success.map(row=>row.score.componentScore);
  const internalScores=success.map(row=>row.score.internalConfidence);
  const successRate=rows.length?success.length/rows.length:0;
  const withinToleranceRate=referenced.length?within.length/referenced.length:null;
  const addressPrecisionRate=success.length?addressPrecision.length/success.length:0;
  const autoAcceptedRate=success.length?auto.length/success.length:0;
  const componentScoreAvg=average(componentScores)||0;
  const finalScore=(
    (withinToleranceRate??0)*0.40+
    addressPrecisionRate*0.20+
    componentScoreAvg*0.20+
    autoAcceptedRate*0.10+
    successRate*0.10
  );
  return {
    provider,
    requests:rows.length,
    successes:success.length,
    successRate,
    referenced:referenced.length,
    withinToleranceRate,
    addressPrecisionRate,
    autoAcceptedRate,
    componentScoreAvg,
    internalConfidenceAvg:average(internalScores),
    medianDistanceMeters:percentile(distances,0.5),
    p90DistanceMeters:percentile(distances,0.9),
    finalScore,
  };
}

const summaries=providerArg.map(summarize).sort((a,b)=>b.finalScore-a.finalScore);
const selectionReady=
  referencedCases>=80&&
  requiredBuckets.every(bucket=>(bucketCounts[bucket]||0)>=5)&&
  summaries.every(summary=>summary.referenced>=80);

let recommendation='INSUFFICIENT_GROUND_TRUTH';
if(selectionReady&&summaries.length>=2){
  const delta=summaries[0].finalScore-summaries[1].finalScore;
  recommendation=delta>=0.05?summaries[0].provider.toUpperCase():'MANUAL_REVIEW_TIE';
}else if(selectionReady&&summaries.length===1){
  recommendation=summaries[0].provider.toUpperCase();
}

const output={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  fixture:path.basename(fixturePath),
  selectedCases:selected.length,
  referencedCases,
  requiredBuckets,
  bucketCounts,
  providers:providerArg,
  summaries,
  recommendation,
  results,
};

fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({
  output:outputPath,
  recommendation,
  summaries,
  note:selectionReady
    ?'Benchmark has enough ground truth for a provider recommendation.'
    :'No provider decision is allowed until at least 80 manually verified references and 5 references per required bucket exist.'
},null,2));
