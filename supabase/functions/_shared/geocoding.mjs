const clean=value=>String(value??'').trim();

export const GEOCODE_PRECISIONS=Object.freeze([
  'ROOFTOP','ADDRESS','STREET','POSTAL_CODE','NEIGHBORHOOD','CITY','REGION','UNKNOWN'
]);

export function normalizeText(value){
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/\b(avenida|av\.?|rua|r\.?|rodovia|rod\.?|estrada|est\.?|travessa|tv\.?)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

export function normalizePostalCode(value){
  return clean(value).replace(/\D/g,'');
}

export function normalizeState(value){
  return clean(value).toUpperCase();
}

export function normalizeCountryCode(value){
  return clean(value||'BR').toUpperCase();
}

export function tokenSimilarity(a,b){
  const left=new Set(normalizeText(a).split(' ').filter(Boolean));
  const right=new Set(normalizeText(b).split(' ').filter(Boolean));
  if(!left.size&&!right.size)return 1;
  if(!left.size||!right.size)return 0;
  let intersection=0;
  for(const token of left)if(right.has(token))intersection++;
  return intersection/(left.size+right.size-intersection);
}

export function haversineMeters(a,b){
  if(!a||!b)return null;
  const lat1=Number(a.lat),lon1=Number(a.lng);
  const lat2=Number(b.lat),lon2=Number(b.lng);
  if(![lat1,lon1,lat2,lon2].every(Number.isFinite))return null;
  const toRad=value=>value*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
  const h=Math.sin(dLat/2)**2+
    Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

function precisionSignal(precision){
  return ({
    ROOFTOP:1,
    ADDRESS:0.92,
    STREET:0.68,
    POSTAL_CODE:0.52,
    NEIGHBORHOOD:0.45,
    CITY:0.30,
    REGION:0.18,
    UNKNOWN:0.10
  })[precision]??0.10;
}

function mapGeoapifyPrecision(result){
  const type=clean(result?.result_type).toLowerCase();
  if(type==='building')return 'ADDRESS';
  if(type==='amenity'&&result?.street&&result?.housenumber)return 'ADDRESS';
  if(type==='street')return 'STREET';
  if(type==='postcode')return 'POSTAL_CODE';
  if(type==='suburb'||type==='district'||type==='locality')return 'NEIGHBORHOOD';
  if(type==='city')return 'CITY';
  if(type==='county'||type==='state'||type==='country')return 'REGION';
  return 'UNKNOWN';
}

function mapMapboxPrecision(feature){
  const p=feature?.properties||{};
  const type=clean(p.feature_type||feature?.feature_type||feature?.type).toLowerCase();
  if(type==='address'){
    const accuracy=clean(p?.coordinates?.accuracy).toLowerCase();
    if(accuracy==='rooftop')return 'ROOFTOP';
    if(['parcel','point','interpolated'].includes(accuracy))return 'ADDRESS';
    if(accuracy==='approximate')return 'POSTAL_CODE';
    return 'ADDRESS';
  }
  if(type==='street')return 'STREET';
  if(type==='postcode')return 'POSTAL_CODE';
  if(['neighborhood','locality','district'].includes(type))return 'NEIGHBORHOOD';
  if(type==='place')return 'CITY';
  if(type==='region'||type==='country')return 'REGION';
  return 'UNKNOWN';
}

function mapboxConfidence(value){
  return ({exact:1,high:0.90,medium:0.70,low:0.45})[clean(value).toLowerCase()]??0.50;
}

function finite(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

export function normalizeGeoapifyResult(result){
  if(!result||typeof result!=='object')return null;
  const lat=finite(result.lat),lng=finite(result.lon);
  if(lat===null||lng===null)return null;
  return Object.freeze({
    provider:'geoapify',
    providerRef:clean(result.place_id)||null,
    lat,lng,
    formattedAddress:clean(result.formatted)||null,
    street:clean(result.street)||null,
    number:clean(result.housenumber)||null,
    district:clean(result.suburb||result.district)||null,
    postalCode:normalizePostalCode(result.postcode)||null,
    city:clean(result.city)||null,
    state:clean(result.state_code||result.state)||null,
    countryCode:normalizeCountryCode(result.country_code)||null,
    precision:mapGeoapifyPrecision(result),
    providerConfidence:Math.max(0,Math.min(1,finite(result?.rank?.confidence)??0.50)),
    providerMatch:clean(result?.rank?.match_type)||null,
    attribution:clean(result?.datasource?.attribution)||'© OpenStreetMap contributors'
  });
}

export function normalizeMapboxResult(feature){
  if(!feature||typeof feature!=='object')return null;
  const p=feature.properties||{};
  const coords=p.coordinates||{};
  const geometry=feature.geometry?.coordinates||[];
  const lng=finite(coords.longitude??geometry[0]);
  const lat=finite(coords.latitude??geometry[1]);
  if(lat===null||lng===null)return null;

  const context=p.context||feature.context||{};
  const address=context.address||{};
  const street=context.street||{};
  const place=context.place||{};
  const region=context.region||{};
  const postcode=context.postcode||{};
  const country=context.country||{};
  const match=p.match_code||feature.match_code||{};

  return Object.freeze({
    provider:'mapbox_permanent',
    providerRef:clean(p.mapbox_id||feature.id)||null,
    lat,lng,
    formattedAddress:clean(p.full_address||p.name||feature.place_name)||null,
    street:clean(street.name||address.street_name||p.name)||null,
    number:clean(address.address_number||p.address)||null,
    district:clean(context.neighborhood?.name||context.locality?.name||context.district?.name)||null,
    postalCode:normalizePostalCode(postcode.name)||null,
    city:clean(place.name)||null,
    state:clean(region.region_code_full||region.region_code||region.name)||null,
    countryCode:normalizeCountryCode(country.country_code||country.country_code_alpha_3)||null,
    precision:mapMapboxPrecision(feature),
    providerConfidence:mapboxConfidence(match.confidence),
    providerMatch:clean(match.confidence)||null,
    attribution:'© Mapbox'
  });
}

function componentScore(input,candidate){
  const components=[];
  const add=(name,weight,inputValue,candidateValue,match)=>{
    if(!clean(inputValue))return;
    components.push({name,weight,score:Math.max(0,Math.min(1,match(inputValue,candidateValue)))});
  };

  add('country',0.05,input.countryCode||'BR',candidate.countryCode,(a,b)=>normalizeCountryCode(a)===normalizeCountryCode(b)?1:0);
  add('state',0.15,input.state,candidate.state,(a,b)=>{
    const aa=normalizeState(a),bb=normalizeState(b);
    if(aa===bb)return 1;
    return tokenSimilarity(a,b)>=0.8?0.75:0;
  });
  add('city',0.20,input.city,candidate.city,(a,b)=>{
    const sim=tokenSimilarity(a,b);
    return sim>=0.9?1:sim>=0.6?0.6:0;
  });
  add('postalCode',0.15,input.postalCode,candidate.postalCode,(a,b)=>{
    const aa=normalizePostalCode(a),bb=normalizePostalCode(b);
    if(!bb)return 0.2;
    if(aa===bb)return 1;
    return aa.slice(0,5)&&aa.slice(0,5)===bb.slice(0,5)?0.5:0;
  });
  add('street',0.25,input.street,candidate.street,(a,b)=>{
    const sim=tokenSimilarity(a,b);
    return sim>=0.85?1:sim>=0.55?0.6:sim>=0.35?0.3:0;
  });
  add('number',0.20,input.number,candidate.number,(a,b)=>{
    const aa=normalizeText(a),bb=normalizeText(b);
    if(!bb)return 0.15;
    return aa===bb?1:0;
  });

  const totalWeight=components.reduce((sum,item)=>sum+item.weight,0)||1;
  const score=components.reduce((sum,item)=>sum+item.weight*item.score,0)/totalWeight;
  return {score,components};
}

function hardMismatch(input,candidate){
  const issues=[];
  const country=normalizeCountryCode(input.countryCode||'BR');
  if(candidate.countryCode&&normalizeCountryCode(candidate.countryCode)!==country)issues.push('country');
  if(input.state&&candidate.state){
    const stateSame=normalizeState(input.state)===normalizeState(candidate.state)||
      tokenSimilarity(input.state,candidate.state)>=0.8;
    if(!stateSame)issues.push('state');
  }
  if(input.city&&candidate.city&&tokenSimilarity(input.city,candidate.city)<0.5)issues.push('city');
  return issues;
}

export function scoreGeocodeCandidate(input,candidate){
  if(!candidate)return Object.freeze({
    componentScore:0,
    providerSignal:0,
    precisionSignal:0,
    internalConfidence:0,
    hardMismatches:['no_result'],
    verificationStatus:'UNVERIFIED',
    precision:'UNKNOWN',
    components:[]
  });

  const component=componentScore(input,candidate);
  const providerSignal=Math.max(0,Math.min(1,Number(candidate.providerConfidence) || 0));
  const pSignal=precisionSignal(candidate.precision);
  let internal=component.score*0.55+providerSignal*0.30+pSignal*0.15;
  const mismatches=hardMismatch(input,candidate);

  if(mismatches.includes('country'))internal=Math.min(internal,0.20);
  if(mismatches.includes('state'))internal=Math.min(internal,0.40);
  if(mismatches.includes('city'))internal=Math.min(internal,0.49);

  const inPost=normalizePostalCode(input.postalCode);
  const outPost=normalizePostalCode(candidate.postalCode);
  if(inPost&&outPost&&inPost!==outPost&&['ROOFTOP','ADDRESS'].includes(candidate.precision)){
    internal=Math.min(internal,0.68);
  }
  if(clean(input.number)&&clean(candidate.number)&&normalizeText(input.number)!==normalizeText(candidate.number)&&['ROOFTOP','ADDRESS'].includes(candidate.precision)){
    internal=Math.min(internal,0.72);
  }

  internal=Math.max(0,Math.min(1,internal));
  const autoAccepted=
    mismatches.length===0 &&
    ['ROOFTOP','ADDRESS'].includes(candidate.precision) &&
    component.score>=0.85 &&
    internal>=0.86;

  return Object.freeze({
    componentScore:component.score,
    providerSignal,
    precisionSignal:pSignal,
    internalConfidence:internal,
    hardMismatches:mismatches,
    verificationStatus:autoAccepted?'AUTO_ACCEPTED':internal>=0.50?'NEEDS_REVIEW':'UNVERIFIED',
    precision:candidate.precision,
    components:component.components
  });
}

export function selectBestGeocode(input,candidates=[]){
  const evaluated=(Array.isArray(candidates)?candidates:[])
    .filter(Boolean)
    .map(candidate=>({candidate,score:scoreGeocodeCandidate(input,candidate)}))
    .sort((a,b)=>b.score.internalConfidence-a.score.internalConfidence);
  return evaluated[0]||null;
}

export function benchmarkCase(input,candidate,reference=null){
  const score=scoreGeocodeCandidate(input,candidate);
  const distanceMeters=reference?haversineMeters(
    {lat:candidate?.lat,lng:candidate?.lng},
    {lat:reference?.lat,lng:reference?.lng}
  ):null;
  const tolerance=Number(reference?.toleranceMeters);
  const withinTolerance=distanceMeters===null||!Number.isFinite(tolerance)?null:distanceMeters<=tolerance;
  return Object.freeze({score,distanceMeters,withinTolerance});
}
