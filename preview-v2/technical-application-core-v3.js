(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;root.DUTRA_TECHNICAL_APPLICATION=api;}(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";

const clean=v=>String(v??"").trim();

function resolveVehicleSupports(vId, answers={}) {
  let result = {
    suporteTracao: { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true },
    suporteTruck: null,
    suporteCarreta: null,
    suporteDianteiro: { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true },
    axlesCount: { dianteiro: 1, tracao: 1, truck: 0, carreta: 0 }
  };

  const brand = answers.brand || 'outras';
  const mbYear = answers.mb_year || 'ge2017';
  const wheel = answers.wheel_size || '19';
  const truck34 = answers.has_truck_3_4 || 'nao';
  const scaniaAr = answers.scania_suspension === 'ar';
  const hasReducao = answers.has_reduction === 'sim';
  const traction6x4 = answers.traction_type === '6x4';
  const isBitruck = answers.is_bitruck === '8x2';

  switch (vId) {
    case '3_4':
      result.axlesCount = { dianteiro: 1, tracao: 1, truck: truck34 !== 'nao' ? 1 : 0, carreta: 0 };
      result.suporteTracao = { code: 'EQ-1155', name: 'Suporte Tração Universal 3/4', defined: true };
      result.suporteDianteiro = wheel === '19'
        ? { code: 'EQ-1340', name: 'Suporte Dianteiro 3/4 Roda 19"', defined: true }
        : { code: 'EQ-1320', name: 'Suporte Dianteiro 3/4 Roda 17"', defined: true };
      if (truck34 === 'sim_vw') result.suporteTruck = { code: 'EQ-1155', name: 'Suporte Truck 3/4 VW', defined: true };
      else if (truck34 === 'sim_mb') result.suporteTruck = { code: 'EQ-1145', name: 'Suporte Truck 3/4 MB', defined: true };
      break;

    case 'toco_4x2':
      result.axlesCount = { dianteiro: 1, tracao: 1, truck: 0, carreta: 0 };
      result.suporteTracao = brand === 'scania'
        ? { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true }
        : { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal / MB 2017+', defined: true });
      break;

    case 'trucado_6x2_8x2':
      result.axlesCount = { dianteiro: isBitruck ? 2 : 1, tracao: 1, truck: 1, carreta: 0 };
      if (brand === 'scania') {
        result.suporteTracao = scaniaAr
          ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true }
          : (hasReducao
            ? { code: 'EQ-1330', name: 'Suporte Redução Scania', defined: true }
            : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true });
      } else if (brand === 'volvo' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1330', name: 'Suporte Redução Volvo', defined: true };
      } else if (brand === 'mb' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
      } else {
        result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      }
      result.suporteTruck = (brand === 'scania' && scaniaAr)
        ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true }
        : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
      break;

    case 'trucado_reboque':
      result.axlesCount = { dianteiro: 1, tracao: 1, truck: 1, carreta: 2 };
      result.suporteTracao = brand === 'scania'
        ? (scaniaAr ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true } : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true })
        : { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      result.suporteTruck = (brand === 'scania' && scaniaAr)
        ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true }
        : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
      result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Reboque (2 Eixos)', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
      break;

    case 'cavalo_toco_carreta3':
      result.axlesCount = { dianteiro: 1, tracao: 1, truck: 0, carreta: 3 };
      result.suporteTracao = brand === 'scania'
        ? { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true }
        : { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Carreta (3 Eixos)', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
      break;

    case 'trucado_carreta3':
      result.axlesCount = { dianteiro: 1, tracao: 1, truck: 1, carreta: 3 };
      if (brand === 'scania') {
        result.suporteTracao = scaniaAr
          ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true }
          : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true };
      } else if (brand === 'mb' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
      } else {
        result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      }
      result.suporteTruck = (brand === 'scania' && scaniaAr)
        ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true }
        : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
      result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Carreta', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
      break;

    case 'bitrem_7eixos':
      result.axlesCount = { dianteiro: 1, tracao: traction6x4 ? 2 : 1, truck: traction6x4 ? 0 : 1, carreta: 4 };
      if (brand === 'scania') {
        result.suporteTracao = scaniaAr
          ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true }
          : (hasReducao
            ? { code: 'EQ-1330', name: 'Suporte Redução Scania', defined: true }
            : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true });
      } else if (brand === 'volvo' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1330', name: 'Suporte Redução Volvo', defined: true };
      } else if (brand === 'mb' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
      } else {
        result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      }
      if (!traction6x4) {
        result.suporteTruck = (brand === 'scania' && scaniaAr)
          ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true }
          : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
      }
      result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Bitrem (4 eixos)', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
      break;

    case 'rodotrem_9eixos':
      result.axlesCount = { dianteiro: 1, tracao: 2, truck: 0, carreta: 6 };
      if (brand === 'scania') {
        result.suporteTracao = scaniaAr
          ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true }
          : (hasReducao
            ? { code: 'EQ-1330', name: 'Suporte Redução Scania', defined: true }
            : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true });
      } else if (brand === 'volvo' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1330', name: 'Suporte Redução Volvo', defined: true };
      } else if (brand === 'mb' && hasReducao) {
        result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
      } else {
        result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
      }
      result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Rodotrem (6 eixos)', defined: true };
      result.suporteDianteiro = (brand === 'scania' || brand === 'volvo')
        ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true }
        : (brand === 'mb' && mbYear === 'lt2017'
          ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true }
          : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
      break;
  }

  return result;
}

function buildConsolidatedVehiclePieces(vId, answers={}, libras=120, includeDianteira=false) {
  const resolution = resolveVehicleSupports(vId, answers);
  const axles = resolution.axlesCount;
  const eqCode = `EQ-${libras}`;
  const eqDiantCode = `EQ-${libras}D`;
  const consolidatedMap = new Map();
  const addPiece = (code, qty) => {
    if (!code || qty <= 0) return;
    consolidatedMap.set(code, (consolidatedMap.get(code) || 0) + qty);
  };

  if (axles.tracao > 0 && resolution.suporteTracao) {
    const qtyConj = axles.tracao * 2;
    addPiece(eqCode, qtyConj);
    addPiece(resolution.suporteTracao.code, qtyConj);
    addPiece('EQ-1040', qtyConj);
    addPiece('EQ-1043', qtyConj);
  }
  if (axles.truck > 0 && resolution.suporteTruck) {
    const qtyConj = axles.truck * 2;
    addPiece(eqCode, qtyConj);
    addPiece(resolution.suporteTruck.code, qtyConj);
    addPiece('EQ-1040', qtyConj);
    addPiece('EQ-1043', qtyConj);
  }
  if (axles.carreta > 0 && resolution.suporteCarreta) {
    const qtyConj = axles.carreta * 2;
    addPiece(eqCode, qtyConj);
    addPiece(resolution.suporteCarreta.code, qtyConj);
    addPiece('EQ-1040', qtyConj);
    addPiece('EQ-1043', qtyConj);
  }
  if (includeDianteira && axles.dianteiro > 0 && resolution.suporteDianteiro) {
    const qtyD = axles.dianteiro * 2;
    addPiece(eqDiantCode, qtyD);
    addPiece(resolution.suporteDianteiro.code, qtyD);
    addPiece('EQ-1041', qtyD);
  }
  return {
    resultList:[...consolidatedMap.entries()].map(([code,qty])=>({code,qty,customPrice:null})),
    resolution
  };
}

function positionSupports(vId, answers={}, includeDianteira=false) {
  const resolution=resolveVehicleSupports(vId,answers),ax=resolution.axlesCount,rows=[];
  if(includeDianteira&&ax.dianteiro>0&&resolution.suporteDianteiro)rows.push({position:'dianteiro',axles:ax.dianteiro,qtyPerVehicle:ax.dianteiro*2,...resolution.suporteDianteiro});
  if(ax.tracao>0&&resolution.suporteTracao)rows.push({position:'tracao',axles:ax.tracao,qtyPerVehicle:ax.tracao*2,...resolution.suporteTracao});
  if(ax.truck>0&&resolution.suporteTruck)rows.push({position:'truck',axles:ax.truck,qtyPerVehicle:ax.truck*2,...resolution.suporteTruck});
  if(ax.carreta>0&&resolution.suporteCarreta)rows.push({position:'carreta',axles:ax.carreta,qtyPerVehicle:ax.carreta*2,...resolution.suporteCarreta});
  return rows;
}

return{resolveVehicleSupports,buildConsolidatedVehiclePieces,positionSupports};
}));