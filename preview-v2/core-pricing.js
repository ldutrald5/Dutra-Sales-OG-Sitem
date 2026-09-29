(() => {
  'use strict';

  const money = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

  function install() {
    const form = document.querySelector('#proposal .formGrid');
    const firstItem = document.querySelector('#proposal #eqItemLabel')?.closest('.proposalRow');
    if (!form || !firstItem) return;

    if (!document.getElementById('proposalTier')) {
      const field = document.createElement('div');
      field.className = 'field full';
      field.innerHTML = '<label>Tabela comercial</label><select id="proposalTier"><option value="lead_ie">Lead — CNPJ com IE</option><option value="lead_sem_ie">Lead — sem IE</option><option value="revenda">Revenda</option><option value="tabela_base">Tabela geral</option></select>';
      form.appendChild(field);
    }

    const rows = [...document.querySelectorAll('#proposal .section .proposalRow')];
    const legacyKit = rows.find(row => row.textContent.includes('Kit de ferramentas'));
    if (legacyKit) legacyKit.style.display = 'none';

    let supportRow = document.getElementById('officialSupportRow');
    if (!supportRow) {
      supportRow = document.createElement('div');
      supportRow.id = 'officialSupportRow';
      supportRow.className = 'proposalRow';
      supportRow.innerHTML = '<div class="agendaIcon">S</div><div class="rowBody"><b id="officialSupportLabel">Suportes</b><small>Tabela oficial selecionada</small></div><strong id="officialSupportTotal">—</strong>';
      firstItem.after(supportRow);
    }

    let hoseRow = document.getElementById('officialHoseRow');
    if (!hoseRow) {
      hoseRow = document.createElement('div');
      hoseRow.id = 'officialHoseRow';
      hoseRow.className = 'proposalRow';
      hoseRow.innerHTML = '<div class="agendaIcon">M</div><div class="rowBody"><b id="officialHoseLabel">Mangueiras</b><small>Tabela oficial selecionada</small></div><strong id="officialHoseTotal">—</strong>';
      supportRow.after(hoseRow);
    }

    const hint = document.querySelector('#proposal .proposalHint');
    if (hint) hint.textContent = 'Cálculo conectado à tabela comercial do próprio DUTRA OS: 16 equalizadores, 16 suportes e 32 mangueiras por Rodotrem. Para outras configurações, use Aplicação Técnica ou Cotação Multi‑Veículos.';

    const tierSelect = document.getElementById('proposalTier');
    const qtyInput = document.getElementById('proposalQty');
    const installmentInput = document.getElementById('proposalInstallments');

    const recalc = () => {
      const db = typeof OG_DATA !== 'undefined' ? OG_DATA : null;
      const tier = db?.pricingTiers?.[tierSelect.value] || { equalizador:213, suporte:22, mangueira:30 };
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      const installments = Math.max(1, parseInt(installmentInput.value, 10) || 1);
      const eqUnits = qty * 16;
      const supportUnits = qty * 16;
      const hoseUnits = qty * 32;
      const tires = qty * 34;
      const eqTotal = eqUnits * Number(tier.equalizador || 0);
      const supportTotal = supportUnits * Number(tier.suporte || 0);
      const hoseTotal = hoseUnits * Number(tier.mangueira || 0);
      const subtotal = eqTotal + supportTotal + hoseTotal;
      const total = installments === 1 ? subtotal * 0.97 : subtotal;

      const tiresInput = document.getElementById('proposalTires');
      if (tiresInput) tiresInput.value = tires;
      const eqLabel = document.getElementById('eqItemLabel');
      if (eqLabel) eqLabel.textContent = 'Equalizadores · ' + eqUnits + ' unidades';
      const eqValue = document.getElementById('eqItemTotal');
      if (eqValue) eqValue.textContent = money(eqTotal);
      document.getElementById('officialSupportLabel').textContent = 'Suportes · ' + supportUnits + ' unidades';
      document.getElementById('officialSupportTotal').textContent = money(supportTotal);
      document.getElementById('officialHoseLabel').textContent = 'Mangueiras · ' + hoseUnits + ' unidades';
      document.getElementById('officialHoseTotal').textContent = money(hoseTotal);
      const products = document.getElementById('proposalProductsTotal');
      if (products) products.textContent = money(total);
      const totalView = document.getElementById('proposalTotal');
      if (totalView) totalView.textContent = money(total);
      const condition = document.getElementById('proposalCondition');
      if (condition) condition.textContent = installments === 1 ? 'À vista com 3%: ' + money(total) : installments + 'x de ' + money(total / installments);
    };

    ['input','change'].forEach(type => {
      qtyInput?.addEventListener(type, recalc);
      installmentInput?.addEventListener(type, recalc);
      tierSelect?.addEventListener(type, recalc);
    });
    recalc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();