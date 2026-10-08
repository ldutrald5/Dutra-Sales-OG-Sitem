/* Read-only explanation of provenance emitted by the canonical technical builder.
 * No compatibility mapping, quotation formula, or persisted state lives here. */
(function attach(scope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.OG_TECHNICAL_APPLICATION_MAP = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const scopes = Object.freeze({cavalo:'CAVALO / CAMINHÃO',carreta:'CARRETA / IMPLEMENTO',outro:'OUTRO',validar:'VALIDAR'});
  const positions = Object.freeze({dianteiro:'Dianteira',tracao:'Tração',truck:'Truck / eixo auxiliar',carreta:'Eixos do implemento',validar:'Posição a validar'});

  function model({items = [], applicationEntries = [], draft = {}, rule, questions = [], resolution, data = {}} = {}) {
    const manual = Array.isArray(draft.manualItems);
    const inputs = questions.flatMap(question => {
      const option = question.options.find(item => item.value === draft.answers?.[question.id]);
      return option ? [`${question.question} ${option.label}`] : [];
    });
    const context = [rule?.name, ...inputs, draft.libras ? `${draft.libras} PSI` : 'Libragem a validar'].filter(Boolean);
    const rows = items.flatMap(item => {
      const name = data.catalog?.find(part => part.code === item.code)?.name || item.code;
      const base = {code:item.code,name,qty:Number(item.qty),origin:manual ? 'manual' : 'calculada'};
      const entries = rule && !manual ? applicationEntries.filter(entry => entry.code === item.code) : [];
      if (entries.length && entries.every(entry => positions[entry.position]) && entries.reduce((sum,entry) => sum + Number(entry.qty),0) === Number(item.qty)) {
        return entries.map(entry => {
          const scope = entry.position === 'carreta' ? 'carreta' : 'cavalo';
          const positionContext = scope === 'carreta'
            ? [rule.name, `Eixos do implemento: ${resolution?.axlesCount?.carreta ?? 'VALIDAR'}`, `${draft.libras} PSI`]
            : context;
          return {...base,qty:Number(entry.qty),scope,position:entry.position,status:'runtime',path:[scopes[scope],...positionContext,positions[entry.position],`Regra do motor: ${rule.id}`,item.code]};
        });
      }
      const scope = manual && Object.hasOwn(scopes,item.applicationScope) ? item.applicationScope : 'validar';
      return [{...base,scope,position:'validar',status:'validate',path:[scopes[scope],...context,manual ? 'Escolha/ajuste manual; posição não confirmada pelo motor' : 'Contexto ou origem insuficiente',item.code]}];
    });
    return {rows,context,groups:Object.entries(scopes).map(([scope,label]) => ({scope,label,rows:rows.filter(row => row.scope === scope)})),manual};
  }

  function html(projection, {multiplier = 1, title = 'Mapa técnico do conjunto', vehicleId = '', totals} = {}) {
    return `<div class="application-map" data-map-vehicle-id="${escape(vehicleId)}" data-technical-review="TECHNICAL_REVIEW_REQUIRED"><h3>${escape(title)}</h3>${totals ? `<p>${escape(totals.pieces)} peças · ${escape(totals.tires)} pneus · ${escape(totals.subtotal)}</p>` : ''}<p class="application-map-note">CONFIRMADO NO MOTOR = origem calculada pelo software. Ajustes e contexto insuficiente ficam em VALIDAR. Confirmar a aplicação física com a fonte OG; fotos e tabelas não alteram as regras automaticamente.</p>
      <div class="application-map-groups">${projection.groups.filter(group => group.rows.length).map(group => `<section data-application-scope="${group.scope}"><h4>${escape(group.label)}</h4>${group.rows.map(row => `<details data-map-code="${escape(row.code)}" data-map-position="${row.position}" data-map-qty="${row.qty * multiplier}"><summary><span><code>${escape(row.code)}</code> · ${escape(positions[row.position])}</span><strong>${escape(row.qty * multiplier)} peças</strong><small>${row.status === 'runtime' ? 'CONFIRMADO NO MOTOR' : 'VALIDAR'} · Ver caminho técnico</small></summary><div class="application-map-detail"><strong>${escape(row.name)}</strong><p>Origem: ${escape(row.origin)} · ${row.qty} por configuração${multiplier !== 1 ? ` × ${multiplier}` : ''}</p><p>Aplicado em: ${escape(group.label)} · ${escape(positions[row.position])}</p><ol>${row.path.map(step => `<li>${escape(step)}</li>`).join('')}</ol>${row.origin === 'manual' ? '<p>Ajuste manual preservado. A classificação escolhida não certifica a instalação.</p>' : ''}</div></details>`).join('')}</section>`).join('')}</div>
      ${projection.rows.length ? '' : '<p>VALIDAR · Nenhuma origem técnica determinada.</p>'}</div>`;
  }
  return Object.freeze({model,html,scopes,positions});
}));
