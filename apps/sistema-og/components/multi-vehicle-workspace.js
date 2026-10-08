/* Read-only fleet presentation over the current quotation's calculated rows. */
(function attach(scope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.OG_MULTI_VEHICLE_WORKSPACE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const count = value => Number(value || 0).toLocaleString('pt-BR');
  const money = value => Number.isFinite(Number(value)) && value !== null && value !== undefined
    ? Number(value).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : 'Preço indisponível';
  const priceIssue = item => item.priceUnit === null || item.priceUnit === undefined || !Number.isFinite(Number(item.priceUnit))
    ? 'Preço indisponível · revise antes de concluir'
    : Number(item.priceUnit) === 0 ? 'Preço zero · revise antes de concluir' : '';

  function render(root, quoteData = {}, catalog = [], explainVehicle) {
    if (!root) return;
    const vehicles = Array.isArray(quoteData.vehicles) ? quoteData.vehicles : [];
    const extras = Array.isArray(quoteData.extraItems) ? quoteData.extraItems : [];
    const explanations = new Map(explainVehicle && typeof OG_TECHNICAL_APPLICATION_MAP !== 'undefined'
      ? vehicles.map(vehicle => [vehicle.id, explainVehicle(vehicle)]) : []);
    const names = new Map((Array.isArray(catalog) ? catalog : []).map(item => [item.code, item.name]));
    const consolidated = new Map();
    for (const vehicle of vehicles) {
      for (const item of vehicle.calculatedItems || []) {
        const quantity = Number(item.qty) * Number(vehicle.qty);
        if (!consolidated.has(item.code)) consolidated.set(item.code, { code:item.code, name:item.name || names.get(item.code) || item.code, qty:0, sources:[], issues:new Set() });
        const part = consolidated.get(item.code);
        part.qty += quantity;
        part.sources.push({ vehicleId:vehicle.id, name:vehicle.name, perVehicle:item.qty, vehicles:vehicle.qty, qty:quantity,
          applications:explanations.get(vehicle.id)?.rows.filter(row => row.code === item.code) || [] });
        const issue = priceIssue(item);
        if (issue) part.issues.add(issue);
      }
    }
    const extraGroups = new Map();
    for (const item of extras) {
      if (!extraGroups.has(item.code)) extraGroups.set(item.code, { code:item.code, name:item.name || names.get(item.code) || item.code, qty:0, issues:new Set() });
      const part = extraGroups.get(item.code);
      part.qty += Number(item.qty);
      const issue = priceIssue(item);
      if (issue) part.issues.add(issue);
    }
    const alerts = new Set([...consolidated.values(), ...extraGroups.values()].filter(part => part.issues.size).map(part => part.code));
    const stats = [['Veículos', quoteData.totalConjuntos], ['Configurações', vehicles.length], ['Peças', quoteData.totalPecas], ['Equalizadores', quoteData.totalEqualizadores], ['Pneus', quoteData.totalPneus]];
    root.dataset.vehicleCount = String(vehicles.length);
    root.dataset.priceReview = String(alerts.size > 0);
    root.innerHTML = `
      <header class="fleet-heading"><div><span class="og-kicker">MULTI-VEÍCULOS · OG</span><h2 id="fleet-workspace-title">Uma frota, uma cotação</h2><p>Revise cada veículo e acompanhe a composição completa do pedido.</p></div><div class="fleet-total"><span>Total da cotação atual</span><strong>${escape(money(quoteData.totalFinalVenda))}</strong><small>Condições e preços do fluxo atual</small></div></header>
      <dl class="fleet-metrics">${stats.map(([label,value]) => `<div><dt>${label}</dt><dd>${escape(count(value))}</dd></div>`).join('')}</dl>
      ${alerts.size ? `<p class="fleet-price-alert" role="status">${alerts.size} código${alerts.size === 1 ? '' : 's'} com preço zero ou indisponível. Revise os valores nas peças de cada veículo ou nos itens avulsos.</p>` : ''}
      ${explanations.size ? vehicles.map(vehicle => OG_TECHNICAL_APPLICATION_MAP.html(explanations.get(vehicle.id), {multiplier:Number(vehicle.qty),title:vehicle.name || 'Conjunto',vehicleId:vehicle.id,totals:{pieces:vehicle.totalPecas,tires:vehicle.totalPneus,subtotal:money(vehicle.totalSubtotal)}})).join('') : ''}
      <div class="fleet-composition"><section aria-labelledby="fleet-parts-title"><div class="fleet-section-heading"><h3 id="fleet-parts-title">Peças dos veículos</h3><span>Quantidade total da frota</span></div>
        ${consolidated.size ? `<ul class="fleet-parts">${[...consolidated.values()].map(part => `<li data-consolidated-code="${escape(part.code)}" data-consolidated-qty="${escape(part.qty)}"><div class="fleet-part-heading"><div><code>${escape(part.code)}</code><strong>${escape(part.name)}</strong></div><span>${escape(count(part.qty))} peças</span></div><ul class="fleet-provenance">${part.sources.map(source => `<li data-source-vehicle-id="${escape(source.vehicleId)}">${escape(source.name || 'Veículo')} · ${escape(count(source.perVehicle))} por veículo × ${escape(count(source.vehicles))} = ${escape(count(source.qty))}${source.applications.length ? `<ul>${source.applications.map(row => `<li>${escape(OG_TECHNICAL_APPLICATION_MAP.scopes[row.scope])} · ${escape(OG_TECHNICAL_APPLICATION_MAP.positions[row.position])} · ${escape(count(row.qty * source.vehicles))} peças</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>${[...part.issues].map(issue => `<small class="fleet-price-issue">${escape(issue)}</small>`).join('')}</li>`).join('')}</ul>` : '<p class="fleet-empty">Nenhum veículo nesta cotação. Adicione uma aplicação ou monte um pedido somente com peças avulsas.</p>'}
      </section><section aria-labelledby="fleet-extras-title"><div class="fleet-section-heading"><h3 id="fleet-extras-title">Itens avulsos</h3><span>Separados dos multiplicadores dos veículos</span></div>
        ${extraGroups.size ? `<ul class="fleet-parts fleet-extra-parts">${[...extraGroups.values()].map(part => `<li data-extra-code="${escape(part.code)}" data-extra-qty="${escape(part.qty)}"><div class="fleet-part-heading"><div><code>${escape(part.code)}</code><strong>${escape(part.name)}</strong></div><span>${escape(count(part.qty))} peças</span></div>${[...part.issues].map(issue => `<small class="fleet-price-issue">${escape(issue)}</small>`).join('')}</li>`).join('')}</ul>` : '<p class="fleet-empty">Nenhum item avulso. Ferramentas e peças extras aparecem aqui quando adicionadas ao pedido.</p>'}
      </section></div>
      ${vehicles.length ? `<details class="fleet-model-totals"><summary>Subtotais por configuração</summary><ul>${vehicles.map(vehicle => `<li><span>${escape(vehicle.name || 'Veículo')} · ${escape(count(vehicle.qty))} veículo${Number(vehicle.qty) === 1 ? '' : 's'}</span><strong>${escape(money(vehicle.totalSubtotal))}</strong><small>${escape(money(vehicle.unitSubtotal))} por veículo</small></li>`).join('')}</ul></details>` : ''}
      <p class="fleet-sync-hint">${typeof navigator !== 'undefined' && navigator.onLine === false ? 'Sem conexão agora. ' : ''}Alterações desta tela precisam ser salvas. A confirmação de sincronização aparece no status global.</p>`;
  }

  return Object.freeze({ render });
}));
