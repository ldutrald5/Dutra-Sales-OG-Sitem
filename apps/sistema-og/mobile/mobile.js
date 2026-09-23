/**
 * Olho de Gato (OG) — Motor de Interface Mobile
 * Otimizado para telas de smartphones, touch e disparo instantâneo para WhatsApp
 */

document.addEventListener('DOMContentLoaded', () => {
  // Verificação da base de dados
  const DB = window.OG_DATA || {};

  // Configurações de Veículos para Cotação Rápida Mobile
  const VEHICLE_CONFIGS = {
    cavalo_6x2: {
      name: 'Cavalo 6x2',
      pneus: 10,
      eqTraseiros: 4,
      eqDianteiros: 2,
      suportesTracao: 4,
      suportesDianteiros: 2,
      mangueiras: 10
    },
    cavalo_6x4: {
      name: 'Cavalo 6x4 Traçado',
      pneus: 10,
      eqTraseiros: 4,
      eqDianteiros: 2,
      suportesTracao: 4,
      suportesDianteiros: 2,
      mangueiras: 10
    },
    cavalo_4x2: {
      name: 'Cavalo 4x2 Toco',
      pneus: 6,
      eqTraseiros: 2,
      eqDianteiros: 2,
      suportesTracao: 2,
      suportesDianteiros: 2,
      mangueiras: 6
    },
    bitruck_8x2: {
      name: 'Bitruck 8x2',
      pneus: 12,
      eqTraseiros: 4,
      eqDianteiros: 4,
      suportesTracao: 4,
      suportesDianteiros: 4,
      mangueiras: 12
    },
    truck_6x2: {
      name: 'Truck 6x2 Tradicional',
      pneus: 10,
      eqTraseiros: 4,
      eqDianteiros: 2,
      suportesTracao: 4,
      suportesDianteiros: 2,
      mangueiras: 10
    },
    toco_4x2: {
      name: 'Toco 4x2 Urbano',
      pneus: 6,
      eqTraseiros: 2,
      eqDianteiros: 2,
      suportesTracao: 2,
      suportesDianteiros: 2,
      mangueiras: 6
    },
    '3_4': {
      name: 'Caminhão 3/4 Leve',
      pneus: 6,
      eqTraseiros: 2,
      eqDianteiros: 2,
      suportesTracao: 2,
      suportesDianteiros: 2,
      mangueiras: 6
    },
    carreta_3eixos: {
      name: 'Carreta 3 Eixos',
      pneus: 12,
      eqTraseiros: 6,
      eqDianteiros: 0,
      suportesTracao: 6,
      suportesDianteiros: 0,
      mangueiras: 12
    },
    bitrem: {
      name: 'Bi-trem 7 Eixos',
      pneus: 22,
      eqTraseiros: 10,
      eqDianteiros: 0,
      suportesTracao: 10,
      suportesDianteiros: 0,
      mangueiras: 20
    },
    rodotrem: {
      name: 'Rodotrem 9 Eixos',
      pneus: 34,
      eqTraseiros: 16,
      eqDianteiros: 0,
      suportesTracao: 16,
      suportesDianteiros: 0,
      mangueiras: 32
    }
  };

  // Formatador de Moeda
  const formatBRL = (val) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // =========================================================================
  // NAVEGAÇÃO ENTRE ABAS MOBILE (BOTTOM NAV)
  // =========================================================================
  const navItems = document.querySelectorAll('.bottom-nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      const activePane = document.getElementById(targetId);
      if (activePane) {
        activePane.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // =========================================================================
  // COTAÇÃO RÁPIDA MOBILE & CÁLCULOS
  // =========================================================================
  const vehicleTypeSelect = document.getElementById('m-vehicle-type');
  const vehicleQtyInput = document.getElementById('m-vehicle-qty');
  const librasSelect = document.getElementById('m-libras');
  const includeDianteiraCheck = document.getElementById('m-include-dianteira');
  const tierSelect = document.getElementById('m-tier');
  const parcelasSelect = document.getElementById('m-parcelas');
  const clientNameInput = document.getElementById('m-client-name');
  const clientCompanyInput = document.getElementById('m-client-company');
  const clientPhoneInput = document.getElementById('m-client-phone');
  const freteTextInput = document.getElementById('m-frete-text');

  // Elementos de Resumo
  const badgePneus = document.getElementById('m-badge-pneus');
  const resumoTotal = document.getElementById('m-resumo-total');
  const resumoParcela = document.getElementById('m-resumo-parcela');
  const resumoPecas = document.getElementById('m-resumo-pecas');
  const resumoPneusTotal = document.getElementById('m-resumo-pneus-total');

  let currentQuoteState = {
    total: 0,
    parcelaValor: 0,
    parcelas: 6,
    totalPecas: 0,
    totalPneus: 0,
    vehicleName: '',
    libras: '110',
    qty: 1
  };

  function updateQuoteCalculations() {
    const vKey = vehicleTypeSelect.value;
    const config = VEHICLE_CONFIGS[vKey] || VEHICLE_CONFIGS.cavalo_6x2;
    const qty = Math.max(1, parseInt(vehicleQtyInput.value, 10) || 1);
    const includeDianteira = includeDianteiraCheck.checked;
    const tierKey = tierSelect.value;
    const tier = (DB.pricingTiers && DB.pricingTiers[tierKey]) ? DB.pricingTiers[tierKey] : {
      equalizador: 213.00,
      suporte: 22.00,
      mangueira: 30.00
    };
    const parcelas = parseInt(parcelasSelect.value, 10) || 6;

    // Itens por veículo
    const eqTraseiros = config.eqTraseiros * qty;
    const eqDianteiros = includeDianteira ? (config.eqDianteiros * qty) : 0;
    const totalEqualizadores = eqTraseiros + eqDianteiros;

    const suportesTracao = config.suportesTracao * qty;
    const suportesDianteiros = includeDianteira ? (config.suportesDianteiros * qty) : 0;
    const totalSuportes = suportesTracao + suportesDianteiros;

    const totalMangueiras = includeDianteira ? (config.mangueiras * qty) : ((config.mangueiras - config.eqDianteiros) * qty);

    const custoEqualizadores = totalEqualizadores * tier.equalizador;
    const custoSuportes = totalSuportes * tier.suporte;
    const custoMangueiras = totalMangueiras * tier.mangueira;

    let subtotal = custoEqualizadores + custoSuportes + custoMangueiras;
    let totalFinal = subtotal;

    // Desconto de 3% no pagamento à vista
    if (parcelas === 1) {
      totalFinal = totalFinal * 0.97;
    }

    const parcelaValor = totalFinal / parcelas;
    const totalPecas = totalEqualizadores + totalSuportes + totalMangueiras;
    const pneusPorVeiculo = config.pneus;
    const totalPneus = pneusPorVeiculo * qty;

    // Atualização do Estado
    currentQuoteState = {
      total: totalFinal,
      subtotal: subtotal,
      parcelaValor: parcelaValor,
      parcelas: parcelas,
      totalPecas: totalPecas,
      totalPneus: totalPneus,
      vehicleName: config.name,
      libras: librasSelect.value,
      qty: qty,
      includeDianteira: includeDianteira,
      tierName: tier.name || tierKey,
      clientName: clientNameInput.value.trim(),
      clientCompany: clientCompanyInput.value.trim(),
      clientPhone: clientPhoneInput.value.trim(),
      frete: freteTextInput.value.trim() || 'A Negociar'
    };

    // Atualização da UI
    if (badgePneus) badgePneus.textContent = `${pneusPorVeiculo} Pneus/un`;
    if (resumoTotal) resumoTotal.textContent = formatBRL(totalFinal);
    if (resumoParcela) {
      if (parcelas === 1) {
        resumoParcela.textContent = `À Vista c/ 3% (${formatBRL(totalFinal)})`;
      } else {
        resumoParcela.textContent = `${parcelas}x de ${formatBRL(parcelaValor)}`;
      }
    }
    if (resumoPecas) resumoPecas.textContent = `${totalPecas} un`;
    if (resumoPneusTotal) resumoPneusTotal.textContent = `${totalPneus} pneus protegidos`;
  }

  // Listeners de recalculo
  [vehicleTypeSelect, vehicleQtyInput, librasSelect, includeDianteiraCheck, tierSelect, parcelasSelect].forEach(el => {
    if (el) el.addEventListener('change', updateQuoteCalculations);
  });
  if (vehicleQtyInput) vehicleQtyInput.addEventListener('input', updateQuoteCalculations);

  // =========================================================================
  // GERAÇÃO DE MENSAGENS PARA WHATSAPP
  // =========================================================================
  function buildWhatsappMessage(type = 'padrao') {
    const s = currentQuoteState;
    const saudacao = s.clientName ? `Olá *${s.clientName}*` : 'Olá amigo';
    const empresa = s.clientCompany ? ` (*${s.clientCompany}*)` : '';

    if (type === 'curta') {
      return `${saudacao}${empresa}! Segue proposta rápida *Olho de Gato Equalizadores* 🐾:

🚚 *Projeto:* ${s.qty}x ${s.vehicleName} (${s.libras} Lbs)
🛡️ *Pneus Protegidos:* ${s.totalPneus} pneus
💰 *Total:* ${formatBRL(s.total)}
💳 *Condição:* ${s.parcelas === 1 ? 'À Vista com 3% de desconto' : `${s.parcelas}x de ${formatBRL(s.parcelaValor)} sem juros`}
🚚 *Frete:* ${s.frete}

Equipamento oficial homologado com garantia e suporte de fábrica. Podemos emitir o pedido?`;
    }

    if (type === 'executiva_roi') {
      const economiaPneuAno = s.totalPneus * 350; // Estimativa conservadora de durabilidade extra
      return `*PROPOSTA EXECUTIVA DE RETORNO SOBRE INVESTIMENTO (ROI) — OLHO DE GATO* 🐾

Para: *${s.clientName || 'Diretoria / Gestão de Frota'}*${empresa}
Veículos: *${s.qty}x ${s.vehicleName}* | *${s.totalPneus} Pneus Monitorados*

📊 *DADOS FINANCEIROS:*
• Investimento Total: *${formatBRL(s.total)}*
• Parcelamento: *${s.parcelas}x de ${formatBRL(s.parcelaValor)}*
• Custo Mensal por Veículo: *${formatBRL(s.parcelaValor / s.qty)} / mês*

📈 *ECONOMIA PROJETADA:*
• Aumento médio de 20% a 30% na vida útil das carcaças.
• Redução de consumo de diesel por eliminação de arrasto térmico.
• Estimativa de Economia Anual: ~ *${formatBRL(economiaPneuAno)}*
• *Payback Estimado:* Retorno do investimento entre 4 a 6 meses de rodagem.

Ficamos à disposição para fechamento imediato e envio dos kits.`;
    }

    // Padrão
    return `*PROPOSTA COMERCIAL — OLHO DE GATO EQUALIZADORES* 🐾

${saudacao}${empresa}, segue a especificação técnica dos equalizadores para a sua frota:

🚚 *Veículo:* ${s.qty}x ${s.vehicleName}
⚙️ *Calibragem Contínua:* ${s.libras} PSI (Libras)
🛡️ *Pneus Atendidos:* ${s.totalPneus} pneus
📦 *Itens do Kit:* Equalizadores calibrados, suportes de aço e mangueiras trinoladas de 420 PSI
${s.includeDianteira ? '✅ Inclui proteção para eixo dianteiro (direcional)' : '⚠️ Apenas eixos traseiros/tração'}

💰 *VALORES E CONDIÇÕES:*
• Valor Total: *${formatBRL(s.total)}*
• Condição: *${s.parcelas === 1 ? 'À Vista (3% de desconto aplicado)' : `${s.parcelas}x de ${formatBRL(s.parcelaValor)} sem juros no faturado`}*
• Frete: *${s.frete}*

Fico no aguardo da sua confirmação para separar o lote no estoque!`;
  }

  // Disparo WhatsApp
  const btnSendWhatsapp = document.getElementById('m-btn-send-whatsapp');
  if (btnSendWhatsapp) {
    btnSendWhatsapp.addEventListener('click', () => {
      const msg = buildWhatsappMessage('padrao');
      const phone = (clientPhoneInput.value || '').replace(/\D/g, '');
      
      let url = '';
      if (phone.length >= 10) {
        const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
        url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`;
      } else {
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      }
      window.open(url, '_blank');
    });
  }

  // Copiar Proposta
  const btnCopyProposal = document.getElementById('m-btn-copy-proposal');
  if (btnCopyProposal) {
    btnCopyProposal.addEventListener('click', () => {
      const msg = buildWhatsappMessage('padrao');
      navigator.clipboard.writeText(msg).then(() => {
        const originalText = btnCopyProposal.innerHTML;
        btnCopyProposal.innerHTML = '<span>✅ Copiado com Sucesso!</span>';
        btnCopyProposal.classList.add('bg-emerald-700');
        setTimeout(() => {
          btnCopyProposal.innerHTML = originalText;
          btnCopyProposal.classList.remove('bg-emerald-700');
        }, 2000);
      });
    });
  }

  // Botões de Cópia da Aba WhatsApp
  const btnCopyWShort = document.getElementById('m-btn-copy-w-short');
  if (btnCopyWShort) {
    btnCopyWShort.addEventListener('click', () => {
      const msg = buildWhatsappMessage('curta');
      navigator.clipboard.writeText(msg).then(() => {
        alert('Modelo Curto copiado para a área de transferência!');
      });
    });
  }

  const btnCopyWStandard = document.getElementById('m-btn-copy-w-standard');
  if (btnCopyWStandard) {
    btnCopyWStandard.addEventListener('click', () => {
      const msg = buildWhatsappMessage('padrao');
      navigator.clipboard.writeText(msg).then(() => {
        alert('Modelo Padrão copiado para a área de transferência!');
      });
    });
  }

  const btnCopyWRoi = document.getElementById('m-btn-copy-w-roi');
  if (btnCopyWRoi) {
    btnCopyWRoi.addEventListener('click', () => {
      const msg = buildWhatsappMessage('executiva_roi');
      navigator.clipboard.writeText(msg).then(() => {
        alert('Modelo Executivo com ROI copiado para a área de transferência!');
      });
    });
  }

  // =========================================================================
  // CONSULTOR DE SUPORTES MOBILE
  // =========================================================================
  const supportLineSelect = document.getElementById('m-support-line');
  const supportQuestionsDiv = document.getElementById('m-support-questions');
  const supportTagsDiv = document.getElementById('m-support-tags');
  const supportDescP = document.getElementById('m-support-desc');

  const SUPPORTS_MAP = {
    scania: {
      tags: ['EQ-1190', 'EQ-1250', 'EQ-1135'],
      desc: 'Tração: EQ-1190 | Dianteira: EQ-1250 | Truck convencional mola: EQ-1135. (Caso possua suspensão a ar no truck, utilize EQ-1390).'
    },
    volvo: {
      tags: ['EQ-1145', 'EQ-1250', 'EQ-1135'],
      desc: 'Tração: EQ-1145 Universal | Dianteira: EQ-1250 | Truck e Carreta: EQ-1135. (Em caso de cubo com redução, suporte EQ-1330).'
    },
    mb: {
      tags: ['EQ-1145', 'EQ-1251', 'EQ-1300'],
      desc: 'Tração: EQ-1145. Dianteira: EQ-1251 (fabricados a partir de 2017) ou EQ-1300 (fabricados até 2016).'
    },
    vw: {
      tags: ['EQ-1145', 'EQ-1251', 'EQ-1155'],
      desc: 'Constellation/Meteor Tração: EQ-1145 | Dianteira: EQ-1251 | Se for linha 3/4 Delivery: Tração EQ-1155.'
    },
    iveco: {
      tags: ['EQ-1145', 'EQ-1251', 'EQ-1135'],
      desc: 'Tração Universal: EQ-1145 | Dianteiro: EQ-1251 | Truck: EQ-1135.'
    },
    carreta: {
      tags: ['EQ-1135', 'EQ-1120'],
      desc: 'Carretas e Semirreboques (Randon, Guerra, Facchini, Noma): Suporte universal de carretas EQ-1135.'
    }
  };

  function updateSupportAdvisor() {
    const line = supportLineSelect.value;
    const res = SUPPORTS_MAP[line] || SUPPORTS_MAP.scania;

    if (supportTagsDiv) {
      supportTagsDiv.innerHTML = res.tags.map(tag => `
        <span class="px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold text-xs border border-amber-400/50">
          ${tag}
        </span>
      `).join('');
    }

    if (supportDescP) {
      supportDescP.textContent = res.desc;
    }
  }

  if (supportLineSelect) {
    supportLineSelect.addEventListener('change', updateSupportAdvisor);
  }

  // =========================================================================
  // CATÁLOGO RÁPIDO MOBILE
  // =========================================================================
  const catalogSearchInput = document.getElementById('m-catalog-search');
  const catalogListDiv = document.getElementById('m-catalog-list');

  function renderCatalog(filter = '') {
    if (!catalogListDiv) return;
    const items = (DB.catalog || []);
    const f = filter.toLowerCase().trim();

    const filtered = items.filter(i => {
      return (i.code && i.code.toLowerCase().includes(f)) ||
             (i.name && i.name.toLowerCase().includes(f)) ||
             (i.desc && i.desc.toLowerCase().includes(f));
    });

    if (filtered.length === 0) {
      catalogListDiv.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs">Nenhuma peça encontrada para "${filter}".</div>`;
      return;
    }

    catalogListDiv.innerHTML = filtered.map(item => `
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-mono font-extrabold text-amber-400 text-xs">${item.code}</span>
            <span class="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-semibold uppercase">${item.category || 'Peça'}</span>
          </div>
          <div class="text-xs font-semibold text-slate-200 mt-0.5">${item.name}</div>
          <div class="text-[10px] text-slate-400 leading-snug">${item.desc || ''}</div>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="text-[10px] text-slate-400 block">Tabela</span>
          <span class="text-xs font-bold text-slate-100 font-mono">${formatBRL(item.priceBase)}</span>
        </div>
      </div>
    `).join('');
  }

  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', (e) => {
      renderCatalog(e.target.value);
    });
  }

  // Inicialização
  updateQuoteCalculations();
  updateSupportAdvisor();
  renderCatalog();
});
