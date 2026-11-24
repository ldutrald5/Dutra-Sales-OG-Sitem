import { icon } from './icons.js';

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatNumber = value => number.format(value);
export const formatMoney = value => money.format(value);

const truckTypes = [
  ['VUC', 4], ['Toco', 6], ['Truck', 10], ['Carreta de 2 eixos', 14],
  ['Carreta de 3 eixos', 18], ['Bitrem', 26], ['Rodotrem', 34],
];

export function defaultSimulation(kind) {
  return kind === 'tires'
    ? { mode: 'quick', trucks: 35, perTruck: 18, price: 2000, rate: 20, counts: {} }
    : { trucks: 35, cost: 30000, rate: 5 };
}

export function numericField(label, key, value, { max = 99999, step = 1, prefix = '' } = {}) {
  return `<label class="field"><span>${label}</span><span class="number-wrap">${prefix ? `<span aria-hidden="true">${prefix}</span>` : ''}
    <input type="number" data-key="${key}" min="0" max="${max}" step="${step}" value="${Number(value)}" inputmode="${step === 1 ? 'numeric' : 'decimal'}">
  </span></label>`;
}

function slider(label, value, min, max, step) {
  return `<label class="range-group"><span class="range-label">${label}<output id="rate-value">${formatNumber(value)}%</output></span>
    <input type="range" data-key="rate" min="${min}" max="${max}" step="${step}" value="${value}">
    <span class="range-limits"><span>${min}%</span><span>${max}%</span></span>
  </label>`;
}

export function simulatorMarkup(kind, values, canImport) {
  const tires = kind === 'tires';
  const fleet = tires ? `<div class="segmented" aria-label="Forma de preenchimento">
    <button type="button" data-mode="quick" aria-pressed="${values.mode === 'quick'}">Preenchimento rápido</button>
    <button type="button" data-mode="types" aria-pressed="${values.mode === 'types'}">Por tipo de caminhão</button>
  </div>${values.mode === 'types'
    ? `<p class="formula">Confirme se os pneus por tipo de veículo correspondem à sua configuração.</p><div class="truck-types">${truckTypes.map(([label, count], index) => numericField(`${label} · ${count} pneus`, `type-${index}`, values.counts[index] ?? 0)).join('')}</div>`
    : `<div class="form-grid">${numericField('Caminhões na frota', 'trucks', values.trucks)}${numericField('Pneus por caminhão', 'perTruck', values.perTruck, { max: 100 })}</div>`}`
    : `<div class="form-grid">${numericField('Caminhões na frota', 'trucks', values.trucks)}${numericField('Gasto mensal por caminhão', 'cost', values.cost, { max: 99999999, step: 0.01, prefix: 'R$' })}</div>${canImport ? '<button class="text-button" type="button" data-import>Usar gasto informado no diagnóstico</button>' : ''}`;

  return `<div class="sim-grid">
    <section class="sim-form" aria-label="Dados da simulação">
      <div class="panel-title"><h3>Dados da frota</h3><button class="text-button" type="button" data-reset>${icon('reset', 15)} Restaurar exemplo</button></div>
      ${fleet}
      ${tires
        ? numericField('Custo médio por pneu', 'price', values.price, { max: 99999999, step: 0.01, prefix: 'R$' }) + slider('Ganho de vida útil estimado', values.rate, 5, 40, 5)
        : slider('Redução de consumo estimada', values.rate, 1, 15, 0.5)}
    </section>
    <section class="sim-results" aria-label="Resultado da simulação">
      <div class="result-heading">${icon(tires ? 'tire' : 'fuel', 24)} <h3>Projeção anual estimada</h3></div>
      <div id="sim-result" aria-live="polite"></div>
    </section>
  </div>`;
}

export function simulatorResults(kind, values) {
  const result = calculateSimulation(kind, values);
  if (kind === 'diesel') {
    const { total, monthly, annual } = result;
    return `<p class="result-amount">${money.format(annual)}</p>
      <dl><div><dt>Gasto mensal da frota</dt><dd>${money.format(total)}</dd></div>
      <div><dt>Economia mensal estimada</dt><dd>${money.format(monthly)}</dd></div></dl>
      <p class="formula">Gasto mensal da frota × ${number.format(values.rate)}% × 12 meses.</p>`;
  }

  const { trucks, tires, capital, saved, annual } = result;
  return `<p class="result-amount">${money.format(annual)}</p>
    <dl><div><dt>Frota monitorada</dt><dd>${number.format(trucks)} caminhões</dd></div>
    <div><dt>Total de pneus</dt><dd>${number.format(tires)}</dd></div>
    <div><dt>Valor dos pneus</dt><dd>${money.format(capital)}</dd></div>
    <div><dt>Pneus equivalentes ao ganho</dt><dd>${number.format(saved)}</dd></div></dl>
    <p class="formula">A projeção aplica ${number.format(values.rate)}% ao valor dos pneus, considerando um ciclo de referência por ano.</p>`;
}

export function calculateSimulation(kind, values) {
  if (kind === 'diesel') {
    const total = values.trucks * values.cost;
    const monthly = total * values.rate / 100;
    return { total, monthly, annual: monthly * 12 };
  }

  const byType = values.mode === 'types';
  const trucks = byType ? truckTypes.reduce((sum, _, index) => sum + (values.counts[index] ?? 0), 0) : values.trucks;
  const tires = byType ? truckTypes.reduce((sum, [, count], index) => sum + count * (values.counts[index] ?? 0), 0) : trucks * values.perTruck;
  const capital = tires * values.price;
  const saved = tires * values.rate / 100;
  return { trucks, tires, capital, saved, annual: capital * values.rate / 100 };
}
