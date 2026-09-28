(function attachCustomerLifecycle(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_CUSTOMER_LIFECYCLE=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createCustomerLifecycle(){
  'use strict';

  const clean=value=>String(value??'').trim();
  const key=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const iso=(value,fallback)=>{
    const date=new Date(value||fallback||Date.now());
    if(Number.isNaN(date.getTime()))throw new Error('Data de ciclo do cliente inválida.');
    return date.toISOString();
  };

  function deriveEvents(before={},after={},options={}){
    const now=iso(options.now);
    const clientId=clean(after.id||before.id);
    if(!clientId)throw new Error('Cliente inválido para eventos de ciclo.');
    const idFactory=typeof options.idFactory==='function'?options.idFactory:(type=>`EVT-LIFECYCLE-${type.replace(/[^a-z0-9]+/gi,'-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`);
    const events=[];
    const push=(type,at,extra={})=>events.push(Object.freeze({
      id:clean(idFactory(type))||`EVT-${Date.now()}`,
      type,
      at:iso(at,now),
      clientId,
      source:'client-sheet',
      ...extra
    }));

    const beforeInstallation=key(before.installationStatus);
    const afterInstallation=key(after.installationStatus);
    if(afterInstallation==='completed'&&beforeInstallation!=='completed'){
      push('installation.completed',after.installationCompletedAt||now,{installationStatus:'completed'});
    }

    const beforeSatisfaction=key(before.satisfactionStatus);
    const afterSatisfaction=key(after.satisfactionStatus);
    if(afterSatisfaction==='satisfied'&&beforeSatisfaction!=='satisfied'){
      push('customer.satisfaction.confirmed',now,{satisfactionStatus:'satisfied'});
    }

    const beforeTest=key(before.testStatus);
    const afterTest=key(after.testStatus);
    if(afterTest==='completed'&&beforeTest!=='completed')push('test.completed',now,{testEndsAt:clean(after.testEndsAt)||null});
    if(afterTest==='cancelled'&&beforeTest!=='cancelled')push('test.cancelled',now,{testEndsAt:clean(after.testEndsAt)||null});

    const beforeReferrals=Array.isArray(before.referrals)?before.referrals.length:0;
    const afterReferrals=Array.isArray(after.referrals)?after.referrals.length:0;
    if(afterReferrals>beforeReferrals){
      push('referral.received',now,{referralCountAdded:afterReferrals-beforeReferrals,totalReferrals:afterReferrals});
    }

    return Object.freeze(events);
  }

  return{deriveEvents};
}));
