/**
 * Motor de Lógica e Interface — Olho de Gato (OG)
 * Suporte a Frotas Multi-Veículos (Abas/Sanfona Recolhíveis),
 * 3 Modelos de Mensagens WhatsApp (Simples, Padrão e Executivo com ROI)
 * 3 Templates Oficiais de PDF/Impressão (incluindo o modelo Vendruscolo com psicologia de cores exata).
 */

document.addEventListener('DOMContentLoaded', () => {
  const TIRE_BASE_LIFE_MONTHS = 18;
  const TIRE_LIFE_GAIN_RATE = 0.20;
  // Estado Global da Aplicação
  const state = {
    currentTab: 'dia',
    activePdfTemplate: 'vendruscolo', // 'vendruscolo' | 'lorentrans' | 'multi_roi'
    activeWhatsappFormat: 'simples', // 'simples' | 'padrao' | 'executivo_roi'
    client: {
      nome: '',
      empresa: '',
      cnpj: '',
      ie: '',
      socioAdmin: '',
      telefone: '',
      vendedor: 'Lucas Dutra - Olho de Gato',
      vendedorTelefone: '44 9165-8321',
      cidadeUf: 'Maringá - PR',
      segmentId: 'transportadora',
      tier: 'lead_ie',
      paymentMethod: 'faturado',
      parcelasCount: 6, // 1x a 12x
      freteValor: 120.00,
      freteTexto: 'FRETE A NEGOCIAR (+/- R$ 120,00)',
      prazoEntrega: '15 DIAS ÚTEIS',
      precoPneu: 1750.00,
      locacaoMeses: 24,
      observacoes: ''
    },
    // Array de Veículos na Cotação (Multi-Veículos com sanfona/recolhimento)
    vehicles: [
      {
        id: 'veh_' + Date.now() + '_1',
        name: 'Mercedes-Benz Accelo (3/4)',
        vehicleTypeId: '3_4',
        libras: 110,
        includeDianteira: true,
        qty: 1,
        collapsed: false,
        items: [
          { code: 'EQ-110', qty: 2, customPrice: null },
          { code: 'EQ-110D', qty: 2, customPrice: null },
          { code: 'EQ-1155', qty: 2, customPrice: null }, // Suporte tração 3/4
          { code: 'EQ-1320', qty: 2, customPrice: null }, // Suporte dianteiro 3/4 Roda 17"
          { code: 'EQ-1040', qty: 2, customPrice: null },
          { code: 'EQ-1043', qty: 2, customPrice: null },
          { code: 'EQ-1041', qty: 2, customPrice: null }
        ]
      },
      {
        id: 'veh_' + Date.now() + '_2',
        name: 'VW Delivery 3/4 (110 LBS)',
        vehicleTypeId: '3_4',
        libras: 110,
        includeDianteira: true,
        qty: 1,
        collapsed: true,
        items: [
          { code: 'EQ-110', qty: 2, customPrice: null },
          { code: 'EQ-110D', qty: 2, customPrice: null },
          { code: 'EQ-1155', qty: 2, customPrice: null }, // Suporte tração 3/4
          { code: 'EQ-1340', qty: 2, customPrice: null }, // Suporte dianteiro 3/4 Roda 19"
          { code: 'EQ-1040', qty: 2, customPrice: null },
          { code: 'EQ-1043', qty: 2, customPrice: null },
          { code: 'EQ-1041', qty: 2, customPrice: null }
        ]
      }
    ],
    // Itens e Ferramentas Avulsas da Proposta (Kits, Ferramentas)
    extraItems: [
      { code: 'EQ-700', qty: 1, customPrice: null } // Kit Ferramenta Profissional c/ Medidor
    ],
    // Estado do Consultor Interativo
    consultant: {
      selectedVehicleId: '3_4',
      answers: {
        wheel_size: '17',
        has_truck_3_4: 'nao',
        brand: 'mb',
        mb_year: 'ge2017',
        scania_suspension: 'mola',
        has_reduction: 'nao',
        traction_type: '6x4',
        is_bitruck: '6x2'
      },
      libras: 110,
      includeDianteira: true,
      targetVehicleName: 'Mercedes-Benz Accelo'
    },
    history: [],
    operations: OG_OPERATIONS_MODEL.createEmptyOperations(),
    library: { query: '', type: 'all', status: 'active', audience: 'all', favoritesOnly: false },
    performance: { period: 'month', segment: 'all', status: 'all', state: 'all', seller: 'all', origin: 'all' },
    leads: [],
    selectedLeadId: null,
    selectedLeadIds: new Set(),
    leadFilterStatus: 'all',
    leadSearchQuery: '',
    salesDeskSearch: '',
    ocrImageBase64: null,
    ocrExtractedText: '',
    quoteImportImageBase64: null,
    quoteImportItems: [],
    callAI: {
      selectedLeadId: null,
      objective: 'primeiro_contato',
      script: [],
      step: 0,
      completed: [],
      notes: '',
      signals: [],
      sources: [],
      sessionId: null,
      fontSize: 1,
      recording: { recorder: null, streams: [], chunks: [], audioContext: null, url: null, startedAt: null }
    }
  };

  let serverSyncTimer = null;
  let serverRevision = 0;

  // Carrega histórico e leads
  try {
    const savedHistory = localStorage.getItem('og_cotacoes_history');
    if (savedHistory) state.history = JSON.parse(savedHistory);

    const savedLeads = localStorage.getItem('og_leads_crm');
    if (savedLeads) {
      state.leads = JSON.parse(savedLeads).map(normalizeLead);
    } else {
      state.leads = [];
      saveLeadsToStorage();
    }
    const savedOperations = localStorage.getItem('og_operations_state');
    state.operations = OG_OPERATIONS_MODEL.migrateOperations(savedOperations ? JSON.parse(savedOperations) : {});
    localStorage.setItem('og_operations_state', JSON.stringify(state.operations));
  } catch (e) {
    console.error('Erro ao ler localStorage', e);
  }

  function setSyncStatus(label, mode = 'idle') {
    const badge = document.getElementById('og-sync-status');
    if (!badge) return;
    badge.textContent = label;
    badge.dataset.mode = mode;
  }

  async function importLucas2026Leads() {
    try {
      const response = await fetch('/imports/lucas-2026.json', { cache: 'no-store' });
      if (!response.ok) return 0;
      const imported = await response.json();
      const incoming = Array.isArray(imported.leads) ? imported.leads : [];
      const existingIds = new Set(state.leads.map(lead => String(lead.id)));
      const newLeads = incoming
        .filter(lead => lead?.id && !existingIds.has(String(lead.id)))
        .map(normalizeLead);
      if (!newLeads.length) return 0;
      state.leads = [...newLeads, ...state.leads];
      localStorage.setItem('og_leads_crm', JSON.stringify(state.leads));
      return newLeads.length;
    } catch (error) {
      console.warn('Não foi possível carregar a base Lucas 2026.', error);
      return 0;
    }
  }

  function cloudAccessToken(forceAsk = false) {
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost' || /^192\.168\./.test(location.hostname)) return '';
    let token = forceAsk ? '' : localStorage.getItem('og_cloud_access_token') || '';
    if (!token) {
      token = window.prompt('Digite o código de acesso do Sistema OG:')?.trim() || '';
      if (token) localStorage.setItem('og_cloud_access_token', token);
    }
    return token;
  }

  function apiHeaders(includeContentType = false) {
    const headers = {};
    const token = cloudAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (includeContentType) headers['Content-Type'] = 'application/json';
    return headers;
  }

  async function apiFetch(url, options = {}) {
    let response = await fetch(url, { ...options, headers: { ...apiHeaders(Boolean(options.body)), ...(options.headers || {}) } });
    if (response.status === 401 && location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') {
      localStorage.removeItem('og_cloud_access_token');
      const token = cloudAccessToken(true);
      if (token) response = await fetch(url, { ...options, headers: { ...apiHeaders(Boolean(options.body)), ...(options.headers || {}) } });
    }
    return response;
  }

  function scheduleServerSync() {
    clearTimeout(serverSyncTimer);
    setSyncStatus('Salvando…', 'busy');
    serverSyncTimer = setTimeout(async () => {
      try {
        const response = await apiFetch('/api/state', {
          method: 'PUT',
          body: JSON.stringify({ leads: state.leads, history: state.history, operations: state.operations, revision: serverRevision })
        });
        if (!response.ok) throw new Error('Servidor indisponível');
        const saved = await response.json();
        serverRevision = saved.revision || serverRevision;
        setSyncStatus('Sincronizado', 'ok');
      } catch {
        setSyncStatus('Salvo neste aparelho', 'offline');
      }
    }, 450);
  }

  async function loadSharedState() {
    try {
      const response = await apiFetch('/api/state', { cache: 'no-store' });
      if (!response.ok) throw new Error('Sem sincronização');
      const shared = await response.json();
      serverRevision = Number(shared.revision || 0);
      const serverHasData = (shared.leads?.length || 0) + (shared.history?.length || 0) + (shared.operations?.activityEvents?.length || 0) > 0;
      const browserHasData = state.leads.length + state.history.length > 0;
      if (serverHasData) {
        state.leads = (shared.leads || []).map(normalizeLead);
        state.history = shared.history || [];
        state.operations = OG_OPERATIONS_MODEL.migrateOperations(shared.operations || state.operations);
        localStorage.setItem('og_leads_crm', JSON.stringify(state.leads));
        localStorage.setItem('og_cotacoes_history', JSON.stringify(state.history));
        localStorage.setItem('og_operations_state', JSON.stringify(state.operations));
        renderDayDashboard();
        if (state.currentTab === 'crm') renderCrmModule();
        if (state.currentTab === 'biblioteca') renderMaterialLibrary();
        if (state.currentTab === 'historico') renderHistory();
      } else if (browserHasData) scheduleServerSync();
      setSyncStatus('Sincronizado', 'ok');
    } catch {
      setSyncStatus('Salvo neste aparelho', 'offline');
    }
  }

  // Navegação de Abas
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  function switchTab(tabId) {
    state.currentTab = tabId;
    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.setAttribute('aria-current', 'page');
        t.classList.add('bg-amber-500', 'text-slate-950', 'font-bold', 'shadow-md');
        t.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/60');
      } else {
        t.removeAttribute('aria-current');
        t.classList.remove('bg-amber-500', 'text-slate-950', 'font-bold', 'shadow-md');
        t.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/60');
      }
    });

    document.querySelectorAll('[data-mobile-tab]').forEach(button => {
      const active = button.dataset.mobileTab === tabId;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    tabContents.forEach(c => {
      if (c.id === `tab-${tabId}`) {
        c.classList.remove('hidden');
      } else {
        c.classList.add('hidden');
      }
    });

    if (tabId === 'dia') renderDayDashboard();
    else if (tabId === 'historico') renderHistory();
    else if (tabId === 'catalogo') renderCatalog();
    else if (tabId === 'transportadoras') renderTransporters();
    else if (tabId === 'scripts') renderSalesKnowledge();
    else if (tabId === 'crm') renderCrmModule();
    else if (tabId === 'guia') renderConsultantEngine();
    else if (tabId === 'call-ai') renderCallAIContext();
    else if (tabId === 'biblioteca') renderMaterialLibrary();
    else if (tabId === 'operacoes') renderOperationsFoundation();
    document.querySelectorAll('.og-mobile-nav button').forEach(button => button.classList.toggle('active', button.dataset.mobileTab === tabId));
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // GESTÃO DE MÚLTIPLOS VEÍCULOS & CÁLCULOS POR VEÍCULO
  // =========================================================================

  function initMultiVehicleEngine() {
    const btnAddVehicle = document.getElementById('btn-add-vehicle-slot');
    const btnAddExtraItem = document.getElementById('btn-add-extra-piece');
    const selectExtraPiece = document.getElementById('quick-add-extra-piece-select');
    const inputExtraQty = document.getElementById('quick-add-extra-piece-qty');
    const btnStartPartsQuote = document.getElementById('btn-start-parts-quote');

    // Popula selects de peças avulsas
    if (selectExtraPiece) {
      selectExtraPiece.innerHTML = '<option value="">-- Adicionar Ferramenta ou Peça Avulsa --</option>';
      OG_DATA.catalog.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.code;
        opt.textContent = `[${item.code}] ${item.name} (${item.category.toUpperCase()})`;
        selectExtraPiece.appendChild(opt);
      });
    }

    if (btnAddVehicle) {
      btnAddVehicle.addEventListener('click', () => {
        // Recolhe os veículos existentes
        state.vehicles.forEach(v => { v.collapsed = true; });

        const count = state.vehicles.length + 1;
        const newVeh = {
          id: 'veh_' + Date.now(),
          name: `Veículo ${count} (Caminhão 3/4)`,
          vehicleTypeId: '3_4',
          libras: 110,
          includeDianteira: true,
          qty: 1,
          collapsed: false,
          items: [
            { code: 'EQ-110', qty: 2, customPrice: null },
            { code: 'EQ-110D', qty: 2, customPrice: null },
            { code: 'EQ-1155', qty: 2, customPrice: null },
            { code: 'EQ-1320', qty: 2, customPrice: null },
            { code: 'EQ-1040', qty: 2, customPrice: null },
            { code: 'EQ-1043', qty: 2, customPrice: null },
            { code: 'EQ-1041', qty: 2, customPrice: null }
          ]
        };

        state.vehicles.push(newVeh);
        recalculateQuote();
        showNotification(`Novo veículo adicionado! Configure as peças abaixo.`, 'success');
      });
    }

    if (btnAddExtraItem && selectExtraPiece && inputExtraQty) {
      btnAddExtraItem.addEventListener('click', () => {
        const code = selectExtraPiece.value;
        const qty = parseInt(inputExtraQty.value, 10) || 1;
        if (!code) {
          showNotification('Selecione uma peça avulsa!', 'warning');
          return;
        }

        const existing = state.extraItems.find(i => i.code === code);
        if (existing) {
          existing.qty += qty;
        } else {
          state.extraItems.push({ code, qty, customPrice: null });
        }

        selectExtraPiece.value = '';
        inputExtraQty.value = 1;
        recalculateQuote();
        showNotification('Item avulso adicionado!', 'success');
      });
    }

    if (btnStartPartsQuote) {
      btnStartPartsQuote.addEventListener('click', () => {
        const startPartsOnly = () => {
          state.vehicles = [];
          state.extraItems = [];
          recalculateQuote();
          document.getElementById('extra-items-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showNotification('Cotação de reposição iniciada. Adicione as peças necessárias.', 'success');
        };
        if (state.vehicles.length || state.extraItems.length) {
          if (confirm('Iniciar uma cotação apenas de peças? Os itens atuais desta tela serão removidos.')) startPartsOnly();
        } else startPartsOnly();
      });
    }

    // Seletor de Modelo de PDF
    const pdfTemplateSelect = document.getElementById('pdf-template-selector');
    if (pdfTemplateSelect) {
      pdfTemplateSelect.addEventListener('change', (e) => {
        state.activePdfTemplate = e.target.value;
        recalculateQuote();
        showNotification(`Modelo de proposta alterado para: ${pdfTemplateSelect.options[pdfTemplateSelect.selectedIndex].text}`, 'info');
      });
    }
  }

  function resolveItemPrice(itemCode, customPrice, importedItem = {}) {
    const tierId = state.client.tier || 'lead_ie';
    const tierInfo = OG_DATA.pricingTiers[tierId] || OG_DATA.pricingTiers.lead_ie;
    const knownCatalogItem = OG_DATA.catalog.find(c => c.code === itemCode);
    const catItem = knownCatalogItem ? {
      ...knownCatalogItem,
      name: importedItem.description || knownCatalogItem.name,
      internalCode: importedItem.internalCode || knownCatalogItem.internalCode
    } : {
      code: itemCode,
      internalCode: importedItem.internalCode || 'IMPORTADO',
      ncm: '90318099',
      name: importedItem.description || importedItem.name || `Peça importada (${itemCode})`,
      category: 'peca_importada',
      weight: importedItem.weight || 200,
      priceBase: importedItem.importedUnitPrice || 0
    };

    let standardPrice = catItem.priceBase || 30.00;

    if (catItem.category === 'equalizador') {
      standardPrice = tierInfo.equalizador;
    } else if (catItem.category === 'suporte') {
      standardPrice = tierInfo.suporte;
    } else if (catItem.category === 'mangueira') {
      standardPrice = tierInfo.mangueira;
    } else if (catItem.code === 'EQ-512') {
      standardPrice = tierInfo.bicoGiratorio || 11.50;
    } else if (catItem.code === 'EQ-518') {
      standardPrice = tierInfo.bicoEnchimento || 11.50;
    } else if (catItem.code === 'EQ-529') {
      standardPrice = tierInfo.anelVedacao || 0.40;
    } else {
      if (tierId === 'lead_sem_ie') {
        standardPrice = standardPrice * 1.12;
      }
    }

    const finalUnitPrice = (customPrice !== undefined && customPrice !== null && !isNaN(customPrice))
      ? customPrice
      : standardPrice;

    return {
      catalogItem: catItem,
      standardPrice,
      finalUnitPrice,
      isCustomPrice: customPrice !== undefined && customPrice !== null && !isNaN(customPrice) && customPrice !== standardPrice
    };
  }

  // =========================================================================
  // IMPORTAÇÃO DE ORÇAMENTOS: FOTO/TEXTO -> PRÉVIA EDITÁVEL -> PEÇAS AVULSAS
  // =========================================================================

  function initQuoteImport() {
    const modal = document.getElementById('modal-import-quote');
    const btnOpen = document.getElementById('btn-import-quote-modal');
    const btnClose = document.getElementById('btn-close-import-quote');
    const btnCancel = document.getElementById('btn-cancel-quote-import');
    const fileInput = document.getElementById('quote-ocr-file');
    const dropzone = document.getElementById('quote-ocr-dropzone');
    const textArea = document.getElementById('quote-ocr-text');
    const btnRead = document.getElementById('btn-read-quote-image');
    const btnParse = document.getElementById('btn-parse-quote-text');
    const btnApply = document.getElementById('btn-apply-quote-import');
    const status = document.getElementById('quote-ocr-status');

    const close = () => modal?.classList.add('hidden');
    if (btnOpen) btnOpen.addEventListener('click', () => modal?.classList.remove('hidden'));
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnCancel) btnCancel.addEventListener('click', close);
    if (modal) modal.addEventListener('click', (event) => { if (event.target === modal) close(); });

    const setImage = (file) => {
      if (!file || !file.type.startsWith('image/')) {
        showNotification('Selecione uma imagem de orçamento válida.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        state.quoteImportImageBase64 = event.target.result;
        if (status) status.textContent = `Imagem “${file.name}” pronta para leitura.`;
      };
      reader.readAsDataURL(file);
    };

    if (fileInput) fileInput.addEventListener('change', (event) => setImage(event.target.files[0]));
    if (dropzone) {
      dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('dragover'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropzone.classList.remove('dragover');
        setImage(event.dataTransfer.files?.[0]);
      });
    }

    if (btnRead) btnRead.addEventListener('click', async () => {
      if (!state.quoteImportImageBase64) return showNotification('Selecione a foto do orçamento primeiro.', 'warning');
      btnRead.disabled = true;
      if (status) status.textContent = 'Lendo os itens da imagem...';
      try {
        if (typeof Tesseract === 'undefined') await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
        const worker = await Tesseract.createWorker('por');
        await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
        const tableImage = await cropQuoteTableImage(state.quoteImportImageBase64);
        const result = await worker.recognize(tableImage);
        await worker.terminate();
        if (textArea) textArea.value = result.data.text;
        parseImportedQuote(result.data.text);
        if (status) status.textContent = 'Texto reconhecido. Confira os itens identificados abaixo.';
      } catch (error) {
        if (status) status.textContent = 'Não foi possível ler a imagem. Cole o texto manualmente e tente novamente.';
        console.error(error);
      } finally {
        btnRead.disabled = false;
      }
    });

    if (btnParse) btnParse.addEventListener('click', () => {
      parseImportedQuote(textArea?.value || '');
      if (status) status.textContent = 'Itens preparados. Revise antes de adicionar à cotação.';
    });

    if (btnApply) btnApply.addEventListener('click', () => {
      if (!state.quoteImportItems.length) return showNotification('Nenhum item válido para adicionar.', 'warning');
      state.quoteImportItems.forEach(item => {
        const existing = state.extraItems.find(extra => extra.sourceKey === item.sourceKey);
        if (existing) {
          existing.qty += item.qty;
          if (item.unitPrice > 0 && (existing.customPrice === null || existing.customPrice === undefined)) existing.customPrice = item.unitPrice;
        } else {
          state.extraItems.push({
            code: item.code,
            qty: item.qty,
            customPrice: item.unitPrice > 0 ? item.unitPrice : null,
            description: item.description,
            importedUnitPrice: item.unitPrice > 0 ? item.unitPrice : null,
            internalCode: item.internalCode,
            sourceKey: item.sourceKey
          });
        }
      });
      const itemCount = state.quoteImportItems.reduce((total, item) => total + item.qty, 0);
      recalculateQuote();
      close();
      showNotification(`${itemCount} peça${itemCount !== 1 ? 's' : ''} do orçamento adicionada${itemCount !== 1 ? 's' : ''} à cotação.`, 'success');
    });

    window.addEventListener('paste', (event) => {
      if (modal?.classList.contains('hidden') || !event.clipboardData) return;
      for (const item of event.clipboardData.items) {
        if (item.type.startsWith('image/')) { setImage(item.getAsFile()); break; }
      }
    });
  }

  function parseImportedQuote(rawText) {
    const catalogByCode = new Map(OG_DATA.catalog.map(item => [item.code.toUpperCase(), item]));
    const normalizedText = normalizeQuoteOcrText(rawText);
    const structuredItems = parseStructuredQuoteTable(normalizedText, catalogByCode);
    if (structuredItems.length) {
      state.quoteImportItems = structuredItems;
      renderQuoteImportPreview();
      return;
    }

    // Plano B para orçamentos com OCR menos organizado: mantém qualquer código EQ encontrado.
    const items = new Map();
    String(rawText || '').split(/\r?\n/).forEach(line => {
      const normalized = normalizeQuoteOcrText(line);
      const codeMatch = normalized.match(/\bEQ-\d{2,6}[A-Z]?\b/);
      if (!codeMatch) return;
      const prefix = normalized.slice(0, codeMatch.index);
      const qtyMatch = prefix.match(/\d+(?:[.,]\d+)?/);
      const qty = qtyMatch ? Math.max(1, Math.round(parseFloat(qtyMatch[0].replace(',', '.')))) : 1;
      const code = codeMatch[0];
      const afterCode = normalized.slice((codeMatch.index || 0) + code.length);
      const unitPrice = extractImportedUnitPrice(afterCode);
      const description = extractImportedDescription(afterCode);
      const internalCode = prefix.match(/\d+[.,]\d+/g)?.at(-1)?.replace(',', '.') || 'IMPORTADO';
      const sourceKey = `${internalCode}|${code}|${description}`;
      const previous = items.get(sourceKey);
      items.set(sourceKey, previous ? {
        ...previous,
        qty: previous.qty + qty,
        unitPrice: unitPrice || previous.unitPrice,
        description: previous.description || description
      } : {
        code,
        qty,
        unitPrice,
        description: catalogByCode.get(code)?.name || description || `Peça importada (${code})`,
        internalCode,
        sourceKey
      });
    });

    state.quoteImportItems = [...items.values()];
    renderQuoteImportPreview();
    if (!state.quoteImportItems.length) showNotification('Não encontrei linhas de peças no texto. Revise a imagem ou o texto reconhecido.', 'warning');
  }

  function normalizeQuoteOcrText(value) {
    return String(value || '').toUpperCase()
      .replace(/\bE\s*[QO0]\s*[-–—]?\s*/g, 'EQ-')
      .replace(/\bEQ[-\s]?([0-9OILSZ]{2,6})([A-Z]?)\b/g, (_, digits, suffix) => `EQ-${digits.replace(/[O]/g, '0').replace(/[IL]/g, '1').replace(/[SZ]/g, '5')}${suffix}`)
      .replace(/\bEQ[-\s]?(\d{2,6}[A-Z]?)\b/g, 'EQ-$1');
  }

  function cropQuoteTableImage(source) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        // Remove cabeçalho e rodapé: somente a área com a grade de produtos é lida.
        const left = Math.round(image.width * 0.01);
        const top = Math.round(image.height * 0.195);
        const width = Math.round(image.width * 0.98);
        const height = Math.round(image.height * 0.72);
        canvas.width = width * 2;
        canvas.height = height * 2;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, left, top, width, height, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => resolve(source);
      image.src = source;
    });
  }

  function parseStructuredQuoteTable(text, catalogByCode) {
    const compact = String(text || '').replace(/\s+/g, ' ').trim();
    const rowPattern = /(\d{1,3}[,.]\d{3})\s+(\d{1,4}(?:[,.]\d{3})?)\s+(EQ-\d{2,6}[A-Z]?)\s+(.+?)\s+(?:-|–)?\s*0[,.]00\s+([\d.]+,\d{2})\s+(?:PC|PÇ|UN|UND)\s+\d+[,.]\d{2}\s+\d+[,.]\d{2}\s+\d+[,.]\d{2}\s+([\d.]+,\d{2})/g;
    const items = [];
    let match;
    while ((match = rowPattern.exec(compact)) !== null) {
      const [, rawQty, internalCode, code, rawDescription, rawUnitPrice, rawTotal] = match;
      const qty = Math.max(1, Math.round(parseBrazilianCurrency(rawQty)));
      const total = parseBrazilianCurrency(rawTotal);
      const detectedPrice = parseBrazilianCurrency(rawUnitPrice);
      const unitPrice = detectedPrice > 0 ? detectedPrice : (total > 0 ? total / qty : 0);
      const description = extractImportedDescription(rawDescription) || catalogByCode.get(code)?.name || `Peça importada (${code})`;
      items.push({
        code,
        qty,
        unitPrice,
        sourceTotal: total,
        description,
        internalCode: String(internalCode).replace(',', '.'),
        sourceKey: `${internalCode}|${code}|${description}`
      });
    }
    return items;
  }

  function extractImportedUnitPrice(text) {
    const segment = String(text || '').replace(/\s+/g, ' ');
    const explicit = segment.match(/R\$\s*([\d.]+,\d{2})/);
    if (explicit) return parseBrazilianCurrency(explicit[1]);
    // Padrão do orçamento: descrição | P.B. 0,00 | VL. UNIT. 35,00 | UND. PC
    const tablePrice = segment.match(/(?:^|\s|-)(?:0[,.]00)\s+([\d.]+,\d{2})\s+(?:PC|PÇ|UN|UND)\b/);
    if (tablePrice) return parseBrazilianCurrency(tablePrice[1]);
    const values = [...segment.matchAll(/\b([\d.]+,\d{2})\b/g)].map(match => parseBrazilianCurrency(match[1]));
    return values.find(value => value > 0) || 0;
  }

  function parseBrazilianCurrency(value) {
    return Number(String(value).replace(/\./g, '').replace(',', '.')) || 0;
  }

  function extractImportedDescription(text) {
    return String(text || '')
      .replace(/\b(?:-|R\$|0[,.]00)\b.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  function renderQuoteImportPreview() {
    const preview = document.getElementById('quote-import-preview');
    const tbody = document.getElementById('quote-import-tbody');
    const count = document.getElementById('quote-import-count');
    if (!preview || !tbody) return;
    preview.classList.toggle('hidden', state.quoteImportItems.length === 0);
    if (!state.quoteImportItems.length) return;
    tbody.innerHTML = state.quoteImportItems.map((item, index) => {
      const catalogItem = OG_DATA.catalog.find(entry => entry.code === item.code);
      const sourceLabel = catalogItem ? '' : '<span class="block text-[10px] text-sky-400 mt-0.5">Novo item importado</span>';
      const total = Number(item.unitPrice || 0) * Number(item.qty || 0);
      return `<tr class="border-b border-slate-800/60"><td class="p-2 font-mono font-bold text-amber-300">${item.code}</td><td class="p-2 text-slate-200">${item.description || catalogItem?.name}${sourceLabel}</td><td class="p-2 text-center"><input data-import-qty="${index}" type="number" min="1" max="9999" value="${item.qty}" class="w-16 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-slate-100"></td><td class="p-2 text-right"><input data-import-price="${index}" type="number" step="0.01" min="0" value="${Number(item.unitPrice || 0).toFixed(2)}" class="w-20 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-right text-slate-100" title="Valor unitário reconhecido"></td><td class="p-2 text-right font-mono text-slate-300">R$ ${total.toFixed(2)}</td><td class="p-2 text-right"><button data-remove-import="${index}" class="text-slate-500 hover:text-rose-400">✕</button></td></tr>`;
    }).join('');
    if (count) count.textContent = `${state.quoteImportItems.length} tipo${state.quoteImportItems.length !== 1 ? 's' : ''} de peça`;
    tbody.querySelectorAll('[data-import-qty]').forEach(input => input.addEventListener('change', () => {
      const index = Number(input.dataset.importQty);
      const qty = Number(input.value);
      if (qty > 0) state.quoteImportItems[index].qty = qty;
      else state.quoteImportItems.splice(index, 1);
      renderQuoteImportPreview();
    }));
    tbody.querySelectorAll('[data-import-price]').forEach(input => input.addEventListener('change', () => {
      const index = Number(input.dataset.importPrice);
      state.quoteImportItems[index].unitPrice = Math.max(0, Number(input.value) || 0);
      renderQuoteImportPreview();
    }));
    tbody.querySelectorAll('[data-remove-import]').forEach(button => button.addEventListener('click', () => {
      state.quoteImportItems.splice(Number(button.dataset.removeImport), 1);
      renderQuoteImportPreview();
    }));
  }

  function calculateCompleteQuote() {
    let vehiclesCalculated = [];
    let totalPecasFrota = 0;
    let totalEqualizadoresFrota = 0;
    let totalSubtotalProdutos = 0;
    let totalPesoGramasFrota = 0;

    // 1. Processa cada veículo
    state.vehicles.forEach(veh => {
      let vehItems = [];
      let vehSubtotal = 0;
      let vehPecasCount = 0;
      let vehEqualizadoresCount = 0;

      veh.items.forEach(entry => {
        const { catalogItem, standardPrice, finalUnitPrice, isCustomPrice } = resolveItemPrice(entry.code, entry.customPrice, entry);
        const subtotal = finalUnitPrice * entry.qty;

        vehItems.push({
          code: catalogItem.code,
          internalCode: catalogItem.internalCode || '—',
          ncm: catalogItem.ncm || '90318099',
          name: catalogItem.name,
          category: catalogItem.category,
          qty: entry.qty,
          weightUnit: catalogItem.weight || 200,
          priceUnit: finalUnitPrice,
          standardPrice: standardPrice,
          isCustomPrice: isCustomPrice,
          subtotal: subtotal
        });

        vehSubtotal += subtotal;
        vehPecasCount += entry.qty;
        if (catalogItem.category === 'equalizador') {
          vehEqualizadoresCount += entry.qty;
        }
        totalPesoGramasFrota += (catalogItem.weight || 200) * entry.qty * veh.qty;
      });

      const vehSubtotalTotal = vehSubtotal * veh.qty;
      totalSubtotalProdutos += vehSubtotalTotal;
      totalPecasFrota += vehPecasCount * veh.qty;
      totalEqualizadoresFrota += vehEqualizadoresCount * veh.qty;

      vehiclesCalculated.push({
        ...veh,
        calculatedItems: vehItems,
        unitSubtotal: vehSubtotal,
        totalSubtotal: vehSubtotalTotal,
        totalPecas: vehPecasCount * veh.qty,
        totalEqualizadores: vehEqualizadoresCount * veh.qty,
        totalPneus: vehEqualizadoresCount * 2 * veh.qty
      });
    });

    // 2. Processa itens avulsos
    let extraCalculated = [];
    let extraSubtotal = 0;
    state.extraItems.forEach(entry => {
      const { catalogItem, standardPrice, finalUnitPrice, isCustomPrice } = resolveItemPrice(entry.code, entry.customPrice, entry);
      const subtotal = finalUnitPrice * entry.qty;

      extraCalculated.push({
        code: catalogItem.code,
        internalCode: catalogItem.internalCode || '—',
        ncm: catalogItem.ncm || '90318099',
        name: catalogItem.name,
        category: catalogItem.category,
        qty: entry.qty,
        weightUnit: catalogItem.weight || 200,
        priceUnit: finalUnitPrice,
        standardPrice: standardPrice,
        isCustomPrice: isCustomPrice,
        subtotal: subtotal
      });

      extraSubtotal += subtotal;
      totalSubtotalProdutos += subtotal;
      totalPecasFrota += entry.qty;
      if (catalogItem.category === 'equalizador') {
        totalEqualizadoresFrota += entry.qty;
      }
      totalPesoGramasFrota += (catalogItem.weight || 200) * entry.qty;
    });

    // 3. Totais Financeiros e Condições
    const isCartao = state.client.paymentMethod === 'cartao';
    const taxaCartaoValor = isCartao ? totalSubtotalProdutos * 0.12 : 0;
    const totalFinalVenda = totalSubtotalProdutos + taxaCartaoValor;

    const totalPneusFrota = totalEqualizadoresFrota * 2;
    const precoPneu = parseFloat(state.client.precoPneu) || 1750.00;
    const patrimonioEmRisco = totalPneusFrota * precoPneu;

    const parcelas = parseInt(state.client.parcelasCount, 10) || 6;
    const valorParcela = totalFinalVenda / parcelas;

    const totalConjuntos = state.vehicles.reduce((acc, v) => acc + (parseInt(v.qty, 10) || 1), 0);
    const custoPorConjuntoMes = totalConjuntos > 0 ? valorParcela / totalConjuntos : valorParcela;

    // Cálculo de ROI e Payback transparente
    // Premissa 1: ciclo-base de 18 meses e +20% de vida útil (novo ciclo: 21,6 meses)
    const patrimonioPneus = totalPneusFrota * precoPneu;
    const vidaUtilComOgMeses = TIRE_BASE_LIFE_MONTHS * (1 + TIRE_LIFE_GAIN_RATE);
    const custoPneusAnualSemOg = patrimonioPneus * (12 / TIRE_BASE_LIFE_MONTHS);
    const custoPneusAnualComOg = patrimonioPneus * (12 / vidaUtilComOgMeses);
    const economiaPneusAnual = Math.max(0, custoPneusAnualSemOg - custoPneusAnualComOg);
    const economiaPneusMensal = economiaPneusAnual / 12;

    // Premissa 2: 2% de economia média no consumo de combustível
    const dieselPorVeiculoAno = 4320.00; // Média de R$ 18.000 diesel/mês * 2% = R$ 360/mês = R$ 4.320/veículo/ano
    const economiaDieselAnual = totalConjuntos > 0 ? totalConjuntos * dieselPorVeiculoAno : (totalPneusFrota * 432.00);
    const economiaDieselMensal = economiaDieselAnual / 12;

    // Totais de Retorno
    const economiaTotalAnual = economiaPneusAnual + economiaDieselAnual;
    const economiaTotalMensal = economiaTotalAnual / 12;

    const paybackDias = economiaTotalAnual > 0 ? Math.max(15, Math.round((totalFinalVenda / (economiaTotalAnual / 365)))) : 45;
    const paybackMeses = (paybackDias / 30).toFixed(1);
    const roiPercentual12m = totalFinalVenda > 0 ? Math.max(0, Math.round(((economiaTotalAnual - totalFinalVenda) / totalFinalVenda) * 100)) : 150;
    const custoPorVeiculo = totalConjuntos > 0 ? totalFinalVenda / totalConjuntos : totalFinalVenda;

    // Condições de Pagamento Comparativas
    const valorAVistaDesconto = totalFinalVenda * 0.97; // 3% desconto à vista
    const valorParcela2x = totalFinalVenda / 2;
    const valorParcela3x = totalFinalVenda / 3;

    return {
      vehicles: vehiclesCalculated,
      extraItems: extraCalculated,
      extraSubtotal,
      totalPecas: totalPecasFrota,
      totalEqualizadores: totalEqualizadoresFrota,
      totalPneus: totalPneusFrota,
      totalConjuntos,
      subtotalProdutos: totalSubtotalProdutos,
      taxaCartaoValor,
      totalFinalVenda,
      parcelas,
      valorParcela,
      custoPorConjuntoMes,
      custoPorVeiculo,
      patrimonioEmRisco,
      precoPneu,
      vidaUtilPneuMeses: TIRE_BASE_LIFE_MONTHS,
      vidaUtilComOgMeses,
      economiaPneusAnual,
      economiaPneusMensal,
      economiaDieselAnual,
      economiaDieselMensal,
      economiaTotalAnual,
      economiaTotalMensal,
      paybackMeses,
      paybackDias,
      roiPercentual12m,
      valorAVistaDesconto,
      valorParcela2x,
      valorParcela3x
    };
  }

  function recalculateQuote() {
    const data = calculateCompleteQuote();
    state.lastQuoteData = data;

    renderVehicleAccordions(data);
    renderExtraItemsTable(data);
    renderMetrics(data);
    renderFreightQuoteInfo(data);
    renderOfficialProposalDocument(data);
    setupExportButtons(data);
  }

  // =========================================================================
  // RENDERIZAÇÃO DA SANFONA / ABAS DE VEÍCULOS
  // =========================================================================

  function renderVehicleAccordions(quoteData) {
    const container = document.getElementById('vehicles-accordion-container');
    const badgeTotalVehicles = document.getElementById('badge-total-vehicles-count');
    if (!container) return;

    if (badgeTotalVehicles) {
      badgeTotalVehicles.textContent = `${quoteData.vehicles.length} veículo${quoteData.vehicles.length > 1 ? 's' : ''}`;
    }

    if (quoteData.vehicles.length === 0) {
      container.innerHTML = `
        <div class="clean-card p-8 text-center text-slate-500">
          <div class="text-base font-semibold text-slate-400 mb-1">Nenhum veículo adicionado à cotação</div>
          <div class="text-xs text-slate-500 mb-4">Adicione o primeiro veículo da frota (ex: Accelo, VW 3/4, Scania, Volvo...)</div>
          <button id="btn-add-first-vehicle" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
            + Adicionar Primeiro Veículo
          </button>
        </div>
      `;
      const btnFirst = container.querySelector('#btn-add-first-vehicle');
      if (btnFirst) {
        btnFirst.onclick = () => {
          const btnAdd = document.getElementById('btn-add-vehicle-slot');
          if (btnAdd) btnAdd.click();
        };
      }
      return;
    }

    container.innerHTML = '';
    quoteData.vehicles.forEach((veh, vehIndex) => {
      const card = document.createElement('div');
      card.className = `vehicle-card mb-3 ${!veh.collapsed ? 'active-vehicle' : ''}`;

      // Linhas da tabela interna do veículo
      let itemsRows = veh.calculatedItems.map((item, itemIndex) => `
        <tr class="border-b border-slate-800/40 hover:bg-slate-800/20 text-xs">
          <td class="py-2.5 px-3">
            <span class="font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">${item.code}</span>
            <span class="text-[10px] text-slate-400 block mt-0.5">Cód: ${item.internalCode} | NCM: ${item.ncm}</span>
          </td>
          <td class="py-2.5 px-3">
            <div class="font-semibold text-slate-200">${item.name}</div>
            <div class="text-[10px] text-slate-500 uppercase">${item.category}</div>
          </td>
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-1">
              <button data-vidx="${vehIndex}" data-iidx="${itemIndex}" data-action="dec" class="btn-veh-qty qty-stepper-btn" style="width: 1.6rem; height: 1.6rem; font-size: 11px;">−</button>
              <input type="number" min="1" max="99" value="${item.qty}" data-vidx="${vehIndex}" data-iidx="${itemIndex}" class="input-veh-item-qty w-12 bg-slate-900 border border-slate-700 rounded py-0.5 text-center text-xs font-bold text-slate-100">
              <button data-vidx="${vehIndex}" data-iidx="${itemIndex}" data-action="inc" class="btn-veh-qty qty-stepper-btn" style="width: 1.6rem; height: 1.6rem; font-size: 11px;">+</button>
            </div>
          </td>
          <td class="py-2.5 px-3 text-right">
            <div class="inline-flex items-center justify-end gap-1">
              <span class="text-[10px] text-slate-400">R$</span>
              <input type="number" step="0.01" min="0" value="${item.priceUnit.toFixed(2)}" data-vidx="${vehIndex}" data-iidx="${itemIndex}" class="input-veh-item-price w-20 bg-slate-900 border ${item.isCustomPrice ? 'border-amber-500 text-amber-300 font-bold' : 'border-slate-700 text-slate-200'} rounded px-1.5 py-0.5 text-right text-xs" title="Editar valor unitário">
            </div>
            ${item.isCustomPrice ? `<div class="text-[9px] text-amber-400/80 cursor-pointer btn-reset-veh-price" data-vidx="${vehIndex}" data-iidx="${itemIndex}">Padrão: R$ ${item.standardPrice.toFixed(2)} (↺)</div>` : ''}
          </td>
          <td class="py-2.5 px-3 text-right font-bold font-mono text-amber-400">
            R$ ${item.subtotal.toFixed(2)}
          </td>
          <td class="py-2.5 px-3 text-right">
            <button data-vidx="${vehIndex}" data-del-item="${itemIndex}" class="text-slate-500 hover:text-red-400 p-1">✕</button>
          </td>
        </tr>
      `).join('');

      card.innerHTML = `
        <!-- Barra de Cabeçalho / Sanfona (Recolhível) -->
        <div class="vehicle-header-bar p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/90">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <span class="text-lg">🚛</span>
            <div class="flex-1 sm:flex-initial">
              <div class="flex items-center gap-2">
                <input type="text" value="${veh.name}" data-vidx="${vehIndex}" class="input-veh-name bg-transparent font-bold text-sm text-slate-100 hover:bg-slate-800/50 focus:bg-slate-950 focus:border-amber-500 rounded px-1 border border-transparent focus:border">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  ${veh.totalEqualizadores * 2} PNEUS
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Qtd de Caminhões deste modelo: <b>${veh.qty} un</b></span> •
                <span>Subtotal: <b class="text-emerald-400">R$ ${veh.totalSubtotal.toFixed(2)}</b></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <div class="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold">Qtd Veículos:</span>
              <input type="number" min="1" max="100" value="${veh.qty}" data-vidx="${vehIndex}" class="input-veh-multiplier w-12 bg-slate-900 border border-slate-700 text-center text-xs font-bold text-slate-100 rounded">
            </div>

            <button data-toggle-vidx="${vehIndex}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1">
              <span>${veh.collapsed ? '▼ Expandir Peças' : '▲ Recolher'}</span>
            </button>

            <button data-del-vidx="${vehIndex}" title="Excluir este veículo" class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>

        <!-- Conteúdo do Veículo (Tabela e Seletor de Peças) -->
        <div class="vehicle-body p-4 ${veh.collapsed ? 'hidden' : ''}">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2 px-3">Código</th>
                  <th class="py-2 px-3">Descrição da Peça</th>
                  <th class="py-2 px-3">Quantidade</th>
                  <th class="py-2 px-3 text-right">Valor Unitário</th>
                  <th class="py-2 px-3 text-right">Subtotal</th>
                  <th class="py-2 px-3 text-right w-8"></th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- Adicionar Peça neste Veículo Específico -->
          <div class="mt-3 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <select data-add-select-vidx="${vehIndex}" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 flex-1 sm:w-64 focus:outline-none">
                <option value="">+ Adicionar Suporte ou Peça a este caminhão</option>
                ${OG_DATA.catalog.map(c => `<option value="${c.code}">[${c.code}] ${c.name}</option>`).join('')}
              </select>
              <button data-add-btn-vidx="${vehIndex}" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition">
                + Incluir
              </button>
            </div>

            <div class="text-right text-xs text-slate-300">
              Subtotal deste modelo: <span class="font-bold text-amber-400 font-mono text-sm">R$ ${veh.totalSubtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Eventos de Expansão / Recolhimento
    container.querySelectorAll('[data-toggle-vidx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vidx = parseInt(btn.getAttribute('data-toggle-vidx'), 10);
        state.vehicles[vidx].collapsed = !state.vehicles[vidx].collapsed;
        recalculateQuote();
      });
    });

    // Eventos de Renomear Veículo
    container.querySelectorAll('.input-veh-name').forEach(input => {
      input.addEventListener('change', (e) => {
        const vidx = parseInt(input.getAttribute('data-vidx'), 10);
        state.vehicles[vidx].name = e.target.value.trim() || `Veículo ${vidx + 1}`;
        recalculateQuote();
      });
    });

    // Eventos de Multiplicador de Veículos
    container.querySelectorAll('.input-veh-multiplier').forEach(input => {
      input.addEventListener('change', (e) => {
        const vidx = parseInt(input.getAttribute('data-vidx'), 10);
        const val = parseInt(e.target.value, 10);
        state.vehicles[vidx].qty = val > 0 ? val : 1;
        recalculateQuote();
      });
    });

    // Eventos de Exclusão de Veículo
    container.querySelectorAll('[data-del-vidx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vidx = parseInt(btn.getAttribute('data-del-vidx'), 10);
        if (confirm(`Remover "${state.vehicles[vidx].name}" da cotação?`)) {
          state.vehicles.splice(vidx, 1);
          recalculateQuote();
          showNotification('Veículo removido.', 'info');
        }
      });
    });

    // Eventos de Quantidade das Peças no Veículo
    container.querySelectorAll('.btn-veh-qty').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidx = parseInt(btn.getAttribute('data-vidx'), 10);
        const iidx = parseInt(btn.getAttribute('data-iidx'), 10);
        const action = btn.getAttribute('data-action');
        if (action === 'inc') {
          state.vehicles[vidx].items[iidx].qty += 1;
        } else if (action === 'dec') {
          if (state.vehicles[vidx].items[iidx].qty > 1) {
            state.vehicles[vidx].items[iidx].qty -= 1;
          } else {
            state.vehicles[vidx].items.splice(iidx, 1);
          }
        }
        recalculateQuote();
      });
    });

    container.querySelectorAll('.input-veh-item-qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const vidx = parseInt(input.getAttribute('data-vidx'), 10);
        const iidx = parseInt(input.getAttribute('data-iidx'), 10);
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
          state.vehicles[vidx].items[iidx].qty = val;
        } else {
          state.vehicles[vidx].items.splice(iidx, 1);
        }
        recalculateQuote();
      });
    });

    // Eventos de Edição de Preço Unitário no Veículo
    container.querySelectorAll('.input-veh-item-price').forEach(input => {
      input.addEventListener('change', (e) => {
        const vidx = parseInt(input.getAttribute('data-vidx'), 10);
        const iidx = parseInt(input.getAttribute('data-iidx'), 10);
        const val = parseFloat(e.target.value.replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          state.vehicles[vidx].items[iidx].customPrice = val;
        } else {
          delete state.vehicles[vidx].items[iidx].customPrice;
        }
        recalculateQuote();
      });
    });

    container.querySelectorAll('.btn-reset-veh-price').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidx = parseInt(btn.getAttribute('data-vidx'), 10);
        const iidx = parseInt(btn.getAttribute('data-iidx'), 10);
        delete state.vehicles[vidx].items[iidx].customPrice;
        recalculateQuote();
      });
    });

    container.querySelectorAll('[data-del-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidx = parseInt(btn.getAttribute('data-vidx'), 10);
        const iidx = parseInt(btn.getAttribute('data-del-item'), 10);
        state.vehicles[vidx].items.splice(iidx, 1);
        recalculateQuote();
      });
    });

    // Eventos de Adição de Peça no Veículo
    container.querySelectorAll('[data-add-btn-vidx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidx = parseInt(btn.getAttribute('data-add-btn-vidx'), 10);
        const sel = container.querySelector(`[data-add-select-vidx="${vidx}"]`);
        if (!sel || !sel.value) return;

        const code = sel.value;
        const existing = state.vehicles[vidx].items.find(i => i.code === code);
        if (existing) {
          existing.qty += 1;
        } else {
          state.vehicles[vidx].items.push({ code, qty: 1, customPrice: null });
        }

        sel.value = '';
        recalculateQuote();
      });
    });
  }

  function renderExtraItemsTable(quoteData) {
    const tbody = document.getElementById('extra-items-tbody');
    const container = document.getElementById('extra-items-container');
    if (!tbody || !container) return;

    container.classList.remove('hidden');
    tbody.innerHTML = '';
    if (quoteData.extraItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-5 text-center text-xs text-slate-500">Nenhuma peça adicionada ainda. Escolha uma peça abaixo ou importe um orçamento.</td></tr>';
      return;
    }
    quoteData.extraItems.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800/50 hover:bg-slate-800/30 text-xs';
      tr.innerHTML = `
        <td class="py-2.5 px-3 font-mono font-bold text-amber-400">${item.code}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-200">${item.name}</td>
        <td class="py-2.5 px-3 text-center">
          <input type="number" min="1" max="9999" value="${item.qty}" data-extra-qty-idx="${index}" class="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs font-bold text-slate-100">
        </td>
        <td class="py-2.5 px-3 text-right">
          <input type="number" step="0.01" value="${item.priceUnit.toFixed(2)}" data-extra-price-idx="${index}" class="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs font-bold text-slate-100">
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-amber-400 font-mono">R$ ${item.subtotal.toFixed(2)}</td>
        <td class="py-2.5 px-3 text-right">
          <button data-del-extra="${index}" class="text-slate-500 hover:text-red-400 p-1">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-extra-price-idx]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(input.getAttribute('data-extra-price-idx'), 10);
        const val = parseFloat(e.target.value.replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          state.extraItems[idx].customPrice = val;
        } else {
          delete state.extraItems[idx].customPrice;
        }
        recalculateQuote();
      });
    });

    tbody.querySelectorAll('[data-extra-qty-idx]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(input.getAttribute('data-extra-qty-idx'), 10);
        const qty = parseInt(e.target.value, 10);
        if (qty > 0) state.extraItems[idx].qty = qty;
        else state.extraItems.splice(idx, 1);
        recalculateQuote();
      });
    });

    tbody.querySelectorAll('[data-del-extra]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-del-extra'), 10);
        state.extraItems.splice(idx, 1);
        recalculateQuote();
      });
    });
  }

  /**
   * Calcula peso, volumes e dimensões estimadas para pedir cotação de frete.
   * Usado só internamente (card na aba Cotação) — nunca entra no PDF/mensagem do cliente.
   */
  function getFreightEstimate(data) {
    let pesoTotalGramas = 0;
    data.vehicles.forEach(v => {
      v.calculatedItems.forEach(it => { pesoTotalGramas += (it.weightUnit || 200) * it.qty * v.qty; });
    });
    data.extraItems.forEach(it => { pesoTotalGramas += (it.weightUnit || 200) * it.qty; });

    const pesoTotalKg = Math.max(0.5, pesoTotalGramas / 1000);
    const volumes = Math.max(1, Math.ceil(pesoTotalKg / 15));
    const pesoPorVolume = pesoTotalKg / volumes;
    const dim = { altura: 25, largura: 30, comprimento: 40 };

    return { pesoTotalKg, volumes, pesoPorVolume, dim };
  }

  function renderFreightQuoteInfo(data) {
    const est = getFreightEstimate(data);
    const elPeso = document.getElementById('freight-info-peso');
    const elVol = document.getElementById('freight-info-volumes');
    const elDim = document.getElementById('freight-info-dim');
    const elDestino = document.getElementById('freight-info-destino');

    if (elPeso) elPeso.textContent = `${est.pesoTotalKg.toFixed(1)} kg`;
    if (elVol) elVol.textContent = `${est.volumes} (${est.pesoPorVolume.toFixed(1)} kg cada)`;
    if (elDim) elDim.textContent = `${est.dim.comprimento}x${est.dim.largura}x${est.dim.altura} cm`;
    if (elDestino) elDestino.textContent = state.client.cidadeUf || '—';
  }

  function initFreightQuoteInfoCard() {
    const btn = document.getElementById('btn-copy-freight-info');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const data = state.lastQuoteData || calculateCompleteQuote();
      const est = getFreightEstimate(data);
      const destino = state.client.cidadeUf || '[cidade/UF do destinatário]';
      const txt =
`Dados para cotação de frete:
Origem: Maringá - PR
Destino: ${destino}
Peso total: ${est.pesoTotalKg.toFixed(1)} kg
Volumes: ${est.volumes} (${est.pesoPorVolume.toFixed(1)} kg cada)
Dimensões por volume: ${est.dim.comprimento}x${est.dim.largura}x${est.dim.altura} cm`;

      navigator.clipboard.writeText(txt).then(() => {
        showNotification('Dados de frete copiados!', 'success');
      }).catch(() => {
        showNotification('Não foi possível copiar automaticamente.', 'warning');
      });
    });
  }

  function renderMetrics(m) {
    const elSubtotal = document.getElementById('metric-subtotal');
    const elTotal = document.getElementById('metric-total');
    const elCondicao = document.getElementById('metric-condicao');
    const elPecas = document.getElementById('metric-pecas');
    const elParcelaInfo = document.getElementById('metric-parcela-info');

    if (elSubtotal) elSubtotal.textContent = `Subtotal: R$ ${m.subtotalProdutos.toFixed(2)}`;
    if (elTotal) elTotal.textContent = `R$ ${m.totalFinalVenda.toFixed(2)}`;
    if (elCondicao) elCondicao.textContent = `${m.parcelas}x de R$ ${m.valorParcela.toFixed(2)}`;
    if (elParcelaInfo) elParcelaInfo.textContent = `R$ ${m.custoPorConjuntoMes.toFixed(2)} / conjunto / mês`;
    if (elPecas) elPecas.textContent = `${m.totalPecas} peças (${m.totalPneus} pneus equalizados em ${m.totalConjuntos} veículos)`;
  }

  // =========================================================================
  // 3 TEMPLATES OFICIAIS DE PDF / IMPRESSÃO (CORES EXATAS & PSICOLOGIA)
  // =========================================================================

  function renderOfficialProposalDocument(quoteData) {
    const docEl = document.getElementById('official-proposal-print');
    if (!docEl) return;

    if (state.activePdfTemplate === 'vendruscolo') {
      docEl.innerHTML = buildVendruscoloPdfHtml(quoteData);
    } else if (state.activePdfTemplate === 'lorentrans') {
      docEl.innerHTML = buildLorentransPdfHtml(quoteData);
    } else {
      docEl.innerHTML = buildMultiVehicleRoiPdfHtml(quoteData);
    }
  }

  /**
   * TEMPLATE 1: VENDRUSCOLO (Modelo Simples / Ágil da Foto Anexada)
   * Cores Exatas: Fundo #12141a, Dourado #f59e0b, Valores em Verde Neon #10b981, Frete em Amarelo
   */
  function buildVendruscoloPdfHtml(data) {
    const clientNome = state.client.nome || '';
    const clientEmpresa = state.client.empresa || 'EMPRESA NÃO INFORMADA';
    const clientCnpj = state.client.cnpj || '';
    const clientIe = state.client.ie || '';
    const freteLabel = state.client.freteTexto || 'FRETE A NEGOCIAR (+/- R$ 120,00)';

    // Resumo dos nomes dos veículos
    const kitNomeFrota = data.vehicles.map(v => `${v.qty > 1 ? v.qty + 'x ' : ''}${v.name}`).join(' + ') || 'KIT COMPLETO';

    // Lista consolidada de itens para a tabela
    let rowsHtml = '';
    data.vehicles.forEach(v => {
      v.calculatedItems.forEach(it => {
        const qtyTotal = it.qty * v.qty;
        const totalItem = it.priceUnit * qtyTotal;
        rowsHtml += `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 6px 8px; font-weight: 700; color: #94a3b8; font-family: monospace;">${String(qtyTotal).padStart(2, '0')} un</td>
            <td style="padding: 6px 8px; color: #e2e8f0; font-weight: 600;">${it.code} — ${it.name} <span style="font-size: 10px; color: #64748b;">(${v.name})</span></td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 800; color: #10b981; font-family: monospace;">R$ ${totalItem.toFixed(2)}</td>
          </tr>
        `;
      });
    });

    data.extraItems.forEach(it => {
      rowsHtml += `
        <tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 6px 8px; font-weight: 700; color: #94a3b8; font-family: monospace;">${String(it.qty).padStart(2, '0')} un</td>
          <td style="padding: 6px 8px; color: #e2e8f0; font-weight: 600;">${it.code} — ${it.name}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: 800; color: #10b981; font-family: monospace;">R$ ${it.subtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <div class="doc-wrapper" style="padding: 24px; background: #12141a; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;">
        
        <!-- CABEÇALHO DA EMPRESA -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #f59e0b; letter-spacing: -0.02em;">OLHO DE GATO</div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">Equalização Passiva de Pressão de Pneus</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #94a3b8; font-family: monospace;">
            <div style="color: #cbd5e1; font-weight: 700;">equalizador.com.br</div>
          </div>
        </div>

        <!-- TÍTULO PROPOSTA COMERCIAL & DADOS DO CLIENTE -->
        <div style="margin-bottom: 14px; background: #161b26; border: 1px solid #283244; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">PROPOSTA COMERCIAL</div>
          <div style="font-size: 16px; font-weight: 900; color: #ffffff; text-transform: uppercase; margin-top: 2px;">${clientEmpresa}</div>
          <div style="font-size: 11px; color: #cbd5e1; font-family: monospace; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 12px;">
            ${clientNome ? `<span><b>Contato:</b> ${clientNome}</span>` : ''}
            <span><b>CNPJ:</b> ${clientCnpj}</span>
            <span><b>IE:</b> ${clientIe}</span>
          </div>
        </div>

        <!-- BANNER AMARELO DO KIT / VEÍCULO -->
        <div style="border-top: 2px solid #f59e0b; border-bottom: 2px solid #f59e0b; padding: 6px 0; margin-bottom: 18px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">
            KIT COMPLETO — ${kitNomeFrota}
          </div>
        </div>

        <!-- TABELA ITENS DO PEDIDO -->
        <div style="margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
            ITENS DO PEDIDO
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- SUBTOTAL, FRETE E TOTAL DO PEDIDO -->
        <div style="margin-bottom: 16px; font-size: 11.5px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 8px; color: #cbd5e1;">
            <span>Subtotal:</span>
            <span style="font-weight: 800; font-family: monospace; color: #ffffff;">R$ ${data.subtotalProdutos.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 8px; color: #94a3b8;">
            <span>Frete:</span>
            <span style="color: #f59e0b; font-weight: 800; text-transform: uppercase;">${freteLabel}</span>
          </div>
          <div style="background: #181d28; border: 1px solid #283244; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span style="font-size: 13px; font-weight: 900; color: #f59e0b; text-transform: uppercase;">TOTAL DO PEDIDO:</span>
            <span style="font-size: 18px; font-weight: 900; color: #ffffff; font-family: monospace;">R$ ${data.totalFinalVenda.toFixed(2)}</span>
          </div>
        </div>

        <!-- PRAZO DE ENTREGA -->
        <div style="border-left: 4px solid #f59e0b; padding-left: 10px; margin-bottom: 18px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">PRAZO DE ENTREGA: ${state.client.prazoEntrega || '15 DIAS ÚTEIS'}</div>
          <div style="font-size: 10px; color: #94a3b8;">Após confirmação do pedido de compra</div>
        </div>

        <!-- CONDIÇÕES DE PAGAMENTO (3 CARDS LADO A LADO) -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
            CONDIÇÕES DE PAGAMENTO
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            
            <!-- Card 1: À Vista -->
            <div class="doc-payment-card" style="padding: 12px; text-align: center;">
              <div style="font-size: 9.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">À VISTA — 3% DESCONTO</div>
              <div style="font-size: 10px; color: #cbd5e1; margin: 4px 0;">Pagamento à vista</div>
              <div style="font-size: 9.5px; color: #f59e0b; font-weight: 700;">3% de desconto</div>
              <div style="font-size: 16px; font-weight: 900; color: #ffffff; font-family: monospace; margin-top: 4px;">R$ ${data.valorAVistaDesconto.toFixed(2)}</div>
            </div>

            <!-- Card 2: 30/60 Dias -->
            <div class="doc-payment-card" style="padding: 12px; text-align: center;">
              <div style="font-size: 9.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">OPÇÃO — 30/60 DIAS</div>
              <div style="font-size: 10px; color: #cbd5e1; margin: 4px 0;">2 parcelas iguais</div>
              <div style="font-size: 16px; font-weight: 900; color: #ffffff; font-family: monospace; margin-top: 14px;">2x de R$ ${data.valorParcela2x.toFixed(2)}</div>
            </div>

            <!-- Card 3: Condição Faturada Selecionada -->
            <div class="doc-payment-card-recommended" style="padding: 0; text-align: center; overflow: hidden;">
              <div style="background: #10b981; color: #090d16; font-size: 9.5px; font-weight: 900; padding: 3px 0; text-transform: uppercase;">
                ✓ CONDIÇÃO FATURADA ${data.parcelas}X
              </div>
              <div style="padding: 10px;">
                <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 6px;">${data.parcelas} parcelas fixas</div>
                <div style="font-size: 16px; font-weight: 900; color: #10b981; font-family: monospace;">${data.parcelas}x de R$ ${data.valorParcela.toFixed(2)}</div>
              </div>
            </div>

          </div>
        </div>

        <!-- AVISO LEGAL -->
        <div style="font-size: 9px; color: #64748b; margin-bottom: 24px; line-height: 1.4;">
          • Frete +/- R$ 120,00 · Desconto de 3% válido exclusivamente para pagamento à vista · Sujeito a confirmação de estoque
        </div>

        <!-- RODAPÉ EXECUTIVO VENDAS -->
        <div style="text-align: center; border-top: 1px solid #283244; padding-top: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">OLHO DE GATO — EFICIÊNCIA OPERACIONAL, PREVENÇÃO E PRESERVAÇÃO DE PNEUS</div>
          <div style="font-size: 13px; color: #ffffff; font-weight: 800; margin-top: 4px;">Lucas Dutra - Olho de Gato</div>
          <div style="font-size: 11px; color: #38bdf8; margin-top: 2px; font-family: monospace; font-weight: 700;">
            WhatsApp / Fone: 44 9165-8321
          </div>
        </div>

      </div>
    `;
  }

  /**
   * TEMPLATE 2: LORENTRANS (Modelo Executivo com Risco e Diluição Mensal)
   */
  function buildLorentransPdfHtml(data) {
    const clientNome = state.client.nome || '';
    const clientEmpresa = state.client.empresa || 'EMPRESA NÃO INFORMADA';
    const clientCnpj = state.client.cnpj || '';
    const clientIe = state.client.ie || '';
    const clientSocio = state.client.socioAdmin || '';
    const freteLabel = state.client.freteTexto || 'FRETE A NEGOCIAR (+/- R$ 120,00)';
    const veicNomes = data.vehicles.map(v => `${v.qty}x ${v.name}`).join(' + ');

    let rowsHtml = '';
    data.vehicles.forEach(v => {
      v.calculatedItems.forEach(it => {
        const qtyTotal = it.qty * v.qty;
        rowsHtml += `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 6px 8px; font-weight: 700; color: #f8fafc; font-family: monospace;">${String(qtyTotal).padStart(2, '0')} un</td>
            <td style="padding: 6px 8px; color: #e2e8f0;">${it.code} — ${it.name} <span style="font-size: 10px; color: #64748b;">(${v.name})</span></td>
            <td style="padding: 6px 8px; font-family: monospace; color: #94a3b8;">${it.ncm}</td>
            <td style="padding: 6px 8px; font-family: monospace; color: #94a3b8;">${it.internalCode}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #10b981; font-family: monospace;">R$ ${(it.priceUnit * qtyTotal).toFixed(2)}</td>
          </tr>
        `;
      });
    });

    return `
      <div class="doc-wrapper" style="padding: 24px; background: #12141a; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #243044; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #f59e0b; letter-spacing: -0.02em;">OLHO DE GATO</div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">Equalização Passiva de Pressão de Pneus</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #94a3b8; font-family: monospace;">
            <div style="color: #cbd5e1; font-weight: 700;">equalizador.com.br</div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
          <div style="font-size: 18px; font-weight: 900; color: #f8fafc; text-transform: uppercase;">${clientEmpresa}</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; font-family: monospace; display: flex; flex-wrap: wrap; gap: 12px;">
            ${clientNome ? `<span><b>Contato:</b> ${clientNome}</span>` : ''}
            <span><b>CNPJ:</b> ${clientCnpj}</span>
            <span><b>IE:</b> ${clientIe}</span>
            ${clientSocio ? `<span><b>Sócio:</b> ${clientSocio}</span>` : ''}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
            Frota: ${veicNomes} · <b>${data.totalPneus} Pneus Protegidos</b>
          </div>
          <div style="font-size: 11px; color: #f59e0b; font-weight: 800; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
            PROPOSTA COMERCIAL · ${freteLabel}
          </div>
        </div>

        <div style="margin-bottom: 18px;">
          <div style="font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
            ITENS DO PEDIDO
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 2px solid #ef4444; color: #f59e0b; font-weight: 800; text-transform: uppercase; font-size: 10px;">
                <th style="padding: 6px 8px;">QTD</th>
                <th style="padding: 6px 8px;">DESCRIÇÃO DO PRODUTO</th>
                <th style="padding: 6px 8px;">NCM</th>
                <th style="padding: 6px 8px;">CÓD.</th>
                <th style="padding: 6px 8px; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 12px; font-size: 11px; border-top: 1px solid #334155; padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 4px;">
              <span>Total dos itens:</span>
              <span style="font-weight: 700; font-family: monospace;">R$ ${data.subtotalProdutos.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #94a3b8; margin-bottom: 4px;">
              <span>Frete:</span>
              <span style="color: #f59e0b; font-weight: 700;">${freteLabel}</span>
            </div>
            <div style="background: #090d16; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; font-weight: 900; color: #f59e0b; text-transform: uppercase;">TOTAL DO PEDIDO:</span>
              <span style="font-size: 18px; font-weight: 900; color: #f8fafc; font-family: monospace;">R$ ${data.totalFinalVenda.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- PATRIMÔNIO EM RISCO -->
        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            ● PATRIMÔNIO EM RISCO — ${data.totalPneus} PNEUS SEM PROTEÇÃO
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px;">
            <div style="font-size: 24px; font-weight: 900; color: #ef4444; font-family: monospace;">
              R$ ${data.patrimonioEmRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style="font-size: 11px; color: #94a3b8;">
              Patrimônio exposto sem proteção Olho de Gato
            </div>
          </div>
        </div>

        <!-- CONDIÇÃO NEGOCIADA -->
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
          <div style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            ■ CONDIÇÃO NEGOCIADA — ${data.parcelas}x (PAGAMENTO MENSAL)
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: #cbd5e1;">${data.parcelas} parcelas mensais iguais</div>
              <div style="font-size: 20px; font-weight: 900; color: #f8fafc; font-family: monospace; margin-top: 2px;">
                ${data.parcelas}x de R$ ${data.valorParcela.toFixed(2)}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #cbd5e1;">Custo por conjunto / mês:</div>
              <div style="font-size: 20px; font-weight: 900; color: #34d399; font-family: monospace; margin-top: 2px;">
                R$ ${data.custoPorConjuntoMes.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #334155; padding-top: 12px; font-size: 9.5px; color: #94a3b8;">
          <div style="color: #f59e0b; font-weight: 800; text-transform: uppercase;">OLHO DE GATO — EFICIÊNCIA OPERACIONAL, PREVENÇÃO E PRESERVAÇÃO DE PNEUS</div>
          <div style="font-size: 13px; font-weight: 900; color: #ffffff; margin-top: 3px;">Lucas Dutra - Olho de Gato</div>
          <div style="color: #38bdf8; font-family: monospace; font-weight: 700; margin-top: 2px;">WhatsApp / Fone: 44 9165-8321</div>
        </div>

      </div>
    `;
  }

  /**
   * TEMPLATE 3: MULTI-VEÍCULOS COM ROI & ANÁLISE ECONÔMICA
   */
  function buildMultiVehicleRoiPdfHtml(data) {
    const clientNome = state.client.nome || '';
    const clientEmpresa = state.client.empresa || 'EMPRESA NÃO INFORMADA';
    const clientCnpj = state.client.cnpj || '';
    const clientIe = state.client.ie || '';
    const freteLabel = state.client.freteTexto || 'FRETE A NEGOCIAR (+/- R$ 120,00)';

    let vehicleCardsHtml = data.vehicles.map(v => `
      <div style="background: #161b26; border: 1px solid #283244; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #283244; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="font-weight: 800; color: #f59e0b; font-size: 12px;">🚛 ${v.name} (${v.qty} un)</div>
          <div style="font-weight: 800; color: #10b981; font-family: monospace; font-size: 12px;">R$ ${v.totalSubtotal.toFixed(2)}</div>
        </div>
        <div style="font-size: 10.5px; color: #cbd5e1; line-height: 1.5;">
          ${v.calculatedItems.map(it => `• <b>${it.qty * v.qty}x</b> ${it.code} (${it.name}) — R$ ${(it.priceUnit * it.qty * v.qty).toFixed(2)}`).join('<br>')}
        </div>
      </div>
    `).join('');

    return `
      <div class="doc-wrapper" style="padding: 24px; background: #12141a; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #f59e0b;">OLHO DE GATO</div>
            <div style="font-size: 11px; color: #94a3b8;">Estudo Técnico & Análise de Retorno sobre Investimento (ROI)</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #94a3b8; font-family: monospace;">
            <div style="color: #cbd5e1; font-weight: 700;">equalizador.com.br</div>
          </div>
        </div>

        <div style="margin-bottom: 14px; background: #161b26; border: 1px solid #283244; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 16px; font-weight: 900; color: #ffffff; text-transform: uppercase;">${clientEmpresa}</div>
          <div style="font-size: 11px; color: #cbd5e1; font-family: monospace; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 12px;">
            ${clientNome ? `<span><b>Contato:</b> ${clientNome}</span>` : ''}
            <span><b>CNPJ:</b> ${clientCnpj}</span>
            <span><b>IE:</b> ${clientIe}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Proposta Técnica Integrada para Frota Mista (${data.totalConjuntos} veículos · ${data.totalPneus} pneus equalizados)</div>
        </div>

        <!-- QUADRO DE VEÍCULOS -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin-bottom: 8px;">DETALHAMENTO TÉCNICO POR VEÍCULO</div>
          ${vehicleCardsHtml}
        </div>

        <!-- QUADRO DE ROI / PAYBACK COM ORIGEM DOS CÁLCULOS -->
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%); border: 1px solid #10b981; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 900; color: #10b981; text-transform: uppercase; margin-bottom: 8px;">
            📊 RETORNO FINANCEIRO ESTIMADO & PREMISSAS DE CÁLCULO
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px; margin-bottom: 10px;">
            <div>
              <div style="color: #94a3b8;">Economia em Pneus (18 → ${data.vidaUtilComOgMeses.toFixed(1)} meses):</div>
              <div style="font-size: 14px; font-weight: 800; color: #34d399; font-family: monospace; margin-top: 2px;">R$ ${data.economiaPneusMensal.toFixed(2)}/mês</div>
              <div style="font-size: 10px; color: #64748b;">(R$ ${data.economiaPneusAnual.toFixed(2)}/ano)</div>
            </div>
            <div>
              <div style="color: #94a3b8;">Economia Estimada Diesel (2%):</div>
              <div style="font-size: 14px; font-weight: 800; color: #60a5fa; font-family: monospace; margin-top: 2px;">R$ ${data.economiaDieselMensal.toFixed(2)}/mês</div>
              <div style="font-size: 10px; color: #64748b;">(R$ ${data.economiaDieselAnual.toFixed(2)}/ano)</div>
            </div>
            <div>
              <div style="color: #94a3b8;">Payback do Investimento:</div>
              <div style="font-size: 16px; font-weight: 900; color: #f59e0b; font-family: monospace; margin-top: 2px;">~${data.paybackDias} dias</div>
              <div style="font-size: 10px; color: #64748b;">(~${data.paybackMeses} meses de rodagem)</div>
            </div>
          </div>
          <div style="font-size: 9.5px; color: #94a3b8; border-top: 1px solid rgba(16, 185, 129, 0.2); padding-top: 6px; line-height: 1.4;">
            * <b>Origem dos Cálculos:</b> Pneus: +20% na quilometragem rodada pela equalização contínua de par casado. Diesel: redução de 2% de arrasto por pressão uniforme (média de ~R$ 360,00/mês de economia por caminhão). Economia Líquida Total: <b>R$ ${data.economiaTotalMensal.toFixed(2)}/mês (R$ ${data.economiaTotalAnual.toFixed(2)}/ano)</b>.
          </div>
        </div>

        <!-- TOTAL E PARCELAS -->
        <div style="background: #181d28; border: 1px solid #283244; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 10px; color: #94a3b8;">INVESTIMENTO TOTAL (${freteLabel}):</div>
            <div style="font-size: 20px; font-weight: 900; color: #ffffff; font-family: monospace;">R$ ${data.totalFinalVenda.toFixed(2)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: #94a3b8;">CONDIÇÃO FATURADA:</div>
            <div style="font-size: 16px; font-weight: 800; color: #10b981; font-family: monospace;">${data.parcelas}x de R$ ${data.valorParcela.toFixed(2)}</div>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #283244; padding-top: 12px; font-size: 9.5px; color: #94a3b8;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">OLHO DE GATO — EFICIÊNCIA OPERACIONAL, PREVENÇÃO E PRESERVAÇÃO DE PNEUS</div>
          <div style="font-size: 13px; font-weight: 900; color: #ffffff; margin-top: 3px;">Lucas Dutra - Olho de Gato</div>
          <div style="color: #38bdf8; font-family: monospace; font-weight: 700; margin-top: 2px;">WhatsApp / Fone: 44 9165-8321</div>
        </div>

      </div>
    `;
  }

  // =========================================================================
  // 3 MODELOS DE MENSAGENS PARA WHATSAPP
  // =========================================================================

  function generateWhatsappText(quoteData, formatType) {
    const clientEmpresa = state.client.empresa || state.client.nome || 'Cliente';
    const clientNome = state.client.nome || '';
    const resumoVeiculos = quoteData.vehicles.map(v => `${v.qty > 1 ? v.qty + ' × ' : '1 × '}${v.name}`).join(' + ') || 'Kit Frota';
    const freteInstalacao = state.client.freteTexto || 'FRETE A NEGOCIAR (+/- R$ 120,00)';

    if (formatType === 'simples') {
      // 1. Simples e Curto (Esboço do usuário: ~5 linhas sem "Ver mais")
      let msg = `🐾 *OLHO DE GATO | PROPOSTA*\n`;
      msg += `Cliente: *${clientNome ? clientNome + ' - ' + clientEmpresa : clientEmpresa}*\n`;
      msg += `Veículos: *${resumoVeiculos}*\n`;
      msg += `Pneus atendidos: *${quoteData.totalPneus} un*\n`;
      msg += `💵 Investimento: *R$ ${quoteData.totalFinalVenda.toFixed(2)}*\n`;
      msg += `💳 Condição: *${quoteData.parcelas}x de R$ ${quoteData.valorParcela.toFixed(2)}*\n`;
      msg += `🚚 Frete + instalação: *${freteInstalacao}*\n`;
      msg += `📞 Contato: *Lucas Dutra - Olho de Gato | 44 9165-8321*`;
      return msg;
    }

    if (formatType === 'padrao') {
      // 2. Médio / Padrão Comercial com detalhamento de peças por veículo
      let msg = `🐾 *OLHO DE GATO | PROPOSTA COMERCIAL*\n`;
      msg += `Cliente: *${clientEmpresa}*${state.client.cnpj ? ` (CNPJ: ${state.client.cnpj})` : ''}\n`;
      msg += `Veículos: *${resumoVeiculos}*\n`;
      msg += `Pneus atendidos: *${quoteData.totalPneus} pneus*\n\n`;
      msg += `📋 *DETALHAMENTO DAS PEÇAS POR VEÍCULO:*\n`;
      quoteData.vehicles.forEach(v => {
        const pecas = v.calculatedItems.map(it => `${it.qty * v.qty}x ${it.code}`).join(', ');
        msg += `▫️ *${v.name}* (${v.qty} un): ${pecas} ➔ *R$ ${v.totalSubtotal.toFixed(2)}*\n`;
      });
      if (quoteData.extraItems.length > 0) {
        const extras = quoteData.extraItems.map(it => `${it.qty}x ${it.code}`).join(', ');
        msg += `▫️ *Itens Extras:* ${extras} ➔ *R$ ${quoteData.extraSubtotal.toFixed(2)}*\n`;
      }
      msg += `\n📦 *Total Geral:* ${quoteData.totalPecas} peças (${quoteData.totalPneus} pneus equalizados)\n`;
      msg += `💵 *Investimento Total:* *R$ ${quoteData.totalFinalVenda.toFixed(2)}*\n\n`;
      msg += `💳 *Condições de Pagamento:*\n`;
      msg += `• À Vista c/ 3% desconto: *R$ ${quoteData.valorAVistaDesconto.toFixed(2)}*\n`;
      msg += `• 30/60 dias: *2x de R$ ${quoteData.valorParcela2x.toFixed(2)}*\n`;
      msg += `• ${quoteData.parcelas}x Faturado: *${quoteData.parcelas}x de R$ ${quoteData.valorParcela.toFixed(2)}* (Sem Juros)\n\n`;
      msg += `🚚 *Frete:* ${freteInstalacao} | *Instalação e Treinamento inclusos*\n`;
      msg += `📞 *Contato:* Lucas Dutra - Olho de Gato | 44 9165-8321`;
      return msg;
    }

    // 3. Executivo / Técnico com ROI e Payback
    let msg = `📊 *ESTUDO TÉCNICO & RETORNO DE INVESTIMENTO (ROI) — OLHO DE GATO*\n`;
    msg += `Cliente: *${clientEmpresa}* | A/C: Gestão de Frota e Diretoria\n`;
    msg += `Veículos: *${resumoVeiculos}* (${quoteData.totalConjuntos} veículos)\n`;
    msg += `Pneus atendidos: *${quoteData.totalPneus} pneus equalizados*\n\n`;
    msg += `🛡️ *PROTEÇÃO PATRIMONIAL:*\n`;
    msg += `• Patrimônio de Pneus Protegido: *R$ ${quoteData.patrimonioEmRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    msg += `📈 *PREMISSAS DE ECONOMIA & GANHO FINANCEIRO:*\n`;
    msg += `• Pneus (vida útil de 18 para ${quoteData.vidaUtilComOgMeses.toFixed(1)} meses): Economia de *R$ ${quoteData.economiaPneusMensal.toFixed(2)}/mês* (R$ ${quoteData.economiaPneusAnual.toFixed(2)}/ano)\n`;
    msg += `• Combustível (est. 2% economia diesel): Economia de *R$ ${quoteData.economiaDieselMensal.toFixed(2)}/mês* (R$ ${quoteData.economiaDieselAnual.toFixed(2)}/ano)\n`;
    msg += `• *Economia Total Estimada:* *R$ ${quoteData.economiaTotalMensal.toFixed(2)}/mês* (R$ ${quoteData.economiaTotalAnual.toFixed(2)}/ano)\n`;
    msg += `⏱️ *Payback do Investimento:* ~*${quoteData.paybackDias} dias* de operação! (~${quoteData.paybackMeses} meses)\n\n`;
    msg += `💵 *Investimento:* *R$ ${quoteData.totalFinalVenda.toFixed(2)}*\n`;
    msg += `💳 *Condição:* *${quoteData.parcelas}x de R$ ${quoteData.valorParcela.toFixed(2)}* (R$ ${quoteData.custoPorConjuntoMes.toFixed(2)}/mês por veículo)\n`;
    msg += `🚚 *Frete:* ${freteInstalacao} | Treinamento técnico incluso\n`;
    msg += `📞 *Contato:* Lucas Dutra - Olho de Gato | 44 9165-8321`;
    return msg;
  }

  function setupExportButtons(quoteData) {
    const btnWhatsappSimple = document.getElementById('btn-copy-whatsapp-simple');
    const btnWhatsappStandard = document.getElementById('btn-copy-whatsapp-standard');
    const btnWhatsappRoi = document.getElementById('btn-copy-whatsapp-roi');
    const btnPrint = document.getElementById('btn-print-quote');
    const btnSave = document.getElementById('btn-save-quote');

    const handleCopySend = (type) => {
      const text = generateWhatsappText(quoteData, type);
      navigator.clipboard.writeText(text).then(() => {
        showNotification(`Mensagem (${type.toUpperCase()}) copiada para o WhatsApp!`, 'success');
        let phoneClean = (state.client.telefone || '').replace(/\D/g, '');
        if (phoneClean.length >= 10) {
          if (!phoneClean.startsWith('55')) phoneClean = '55' + phoneClean;
          window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(text)}`, '_blank');
        }
      }).catch(() => {
        alert('Texto gerado:\n\n' + text);
      });
    };

    if (btnWhatsappSimple) btnWhatsappSimple.onclick = () => handleCopySend('simples');
    if (btnWhatsappStandard) btnWhatsappStandard.onclick = () => handleCopySend('padrao');
    if (btnWhatsappRoi) btnWhatsappRoi.onclick = () => handleCopySend('executivo_roi');

    if (btnPrint) {
      btnPrint.onclick = () => {
        window.print();
      };
    }

    if (btnSave) {
      btnSave.onclick = () => {
        saveQuoteToHistory(quoteData);
      };
    }
  }

  function saveQuoteToHistory(quoteData) {
    const newQuote = {
      id: 'COT-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      clientName: state.client.nome || 'Cliente sem nome',
      clientCompany: state.client.empresa || '',
      totalValue: quoteData.totalFinalVenda,
      totalPecas: quoteData.totalPecas,
      payload: JSON.parse(JSON.stringify(state))
    };

    state.history.unshift(newQuote);
    if (state.history.length > 50) state.history.pop();

    try {
      localStorage.setItem('og_cotacoes_history', JSON.stringify(state.history));
      scheduleServerSync();
      const phoneKey = (state.client.telefone || '').replace(/\D/g, '');
      const companyKey = (state.client.empresa || '').trim().toLowerCase();
      const relatedLead = state.leads.find(lead =>
        (phoneKey && (lead.telefone || '').replace(/\D/g, '') === phoneKey) ||
        (companyKey && (lead.empresa || '').trim().toLowerCase() === companyKey)
      );
      if (relatedLead) {
        relatedLead.interactions = Array.isArray(relatedLead.interactions) ? relatedLead.interactions : [];
        relatedLead.interactions.push({
          id: `INT-${Date.now()}`,
          at: new Date().toISOString(),
          type: 'cotacao',
          note: `Cotação ${newQuote.id} salva no valor de ${formatMoney(newQuote.totalValue)}. O envio ao cliente ainda precisa ser confirmado.`
        });
        if (!relatedLead.nextAction) relatedLead.nextAction = 'Revisar a cotação e combinar o envio com o cliente.';
        saveLeadsToStorage();
      }
      showNotification('Cotação salva com sucesso!', 'success');
    } catch (e) {
      console.error(e);
    }
  }

  // =========================================================================
  // CONSULTOR INTELIGENTE DE SUPORTES & ÁRVORE DE DECISÃO
  // =========================================================================

  function initConsultantEngine() {
    renderConsultantEngine();

    const searchInput = document.getElementById('consultant-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        handleConsultantSearch(e.target.value.toLowerCase().trim());
      });
    }

    const librasSelect = document.getElementById('consultant-libras-select');
    if (librasSelect) {
      librasSelect.addEventListener('change', (e) => {
        state.consultant.libras = parseInt(e.target.value, 10);
        renderConsultantEngine();
      });
    }

    const includeDianteiraCheck = document.getElementById('consultant-include-dianteira');
    if (includeDianteiraCheck) {
      includeDianteiraCheck.addEventListener('change', (e) => {
        state.consultant.includeDianteira = e.target.checked;
        renderConsultantEngine();
      });
    }

    const btnInjectToQuote = document.getElementById('btn-inject-consultant-to-quote');
    if (btnInjectToQuote) {
      btnInjectToQuote.addEventListener('click', () => {
        injectConsultantVehicleIntoQuote();
      });
    }
  }

  function handleConsultantSearch(query) {
    if (!query) return;

    for (const rule of OG_DATA.vehicleConsultantRules) {
      if (rule.keywords.some(kw => query.includes(kw))) {
        state.consultant.selectedVehicleId = rule.id;
        break;
      }
    }

    if (query.includes('accelo')) {
      state.consultant.selectedVehicleId = '3_4';
      state.consultant.answers.wheel_size = '17';
      state.consultant.answers.brand = 'mb';
      state.consultant.targetVehicleName = 'Mercedes-Benz Accelo';
    } else if (query.includes('delivery')) {
      state.consultant.selectedVehicleId = '3_4';
      state.consultant.answers.wheel_size = '19';
      state.consultant.answers.brand = 'vw';
      state.consultant.targetVehicleName = 'VW Delivery 3/4';
    }

    if (query.includes('19') || query.includes('aro 19')) state.consultant.answers.wheel_size = '19';
    if (query.includes('17') || query.includes('aro 17')) state.consultant.answers.wheel_size = '17';
    if (query.includes('scania')) state.consultant.answers.brand = 'scania';
    if (query.includes('volvo')) state.consultant.answers.brand = 'volvo';
    if (query.includes('mercedes') || query.includes('mb') || query.includes('atego') || query.includes('axor') || query.includes('actros')) state.consultant.answers.brand = 'mb';
    if (query.includes('vw') || query.includes('volks')) state.consultant.answers.brand = 'vw';
    if (query.includes('2016') || query.includes('antigo')) state.consultant.answers.mb_year = 'lt2017';
    if (query.includes('2017') || query.includes('2018') || query.includes('2019') || query.includes('2020') || query.includes('2021') || query.includes('2022') || query.includes('2023') || query.includes('2024') || query.includes('2025')) state.consultant.answers.mb_year = 'ge2017';
    if (query.includes('ar') || query.includes('pneumat')) state.consultant.answers.scania_suspension = 'ar';
    if (query.includes('mola')) state.consultant.answers.scania_suspension = 'mola';
    if (query.includes('redução') || query.includes('reducao')) state.consultant.answers.has_reduction = 'sim';
    if (query.includes('6x4') || query.includes('tracado')) state.consultant.answers.traction_type = '6x4';
    if (query.includes('6x2') || query.includes('trucado')) state.consultant.answers.traction_type = '6x2';
    if (query.includes('bitruck') || query.includes('8x2')) state.consultant.answers.is_bitruck = '8x2';

    renderConsultantEngine();
  }

  function resolveVehicleSupports(vId, answers) {
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
        result.suporteDianteiro = wheel === '19' ? { code: 'EQ-1340', name: 'Suporte Dianteiro 3/4 Roda 19"', defined: true } : { code: 'EQ-1320', name: 'Suporte Dianteiro 3/4 Roda 17"', defined: true };
        if (truck34 === 'sim_vw') result.suporteTruck = { code: 'EQ-1155', name: 'Suporte Truck 3/4 VW', defined: true };
        else if (truck34 === 'sim_mb') result.suporteTruck = { code: 'EQ-1145', name: 'Suporte Truck 3/4 MB', defined: true };
        break;

      case 'toco_4x2':
        result.axlesCount = { dianteiro: 1, tracao: 1, truck: 0, carreta: 0 };
        result.suporteTracao = brand === 'scania' ? { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true } : { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal / MB 2017+', defined: true });
        break;

      case 'trucado_6x2_8x2':
        result.axlesCount = { dianteiro: isBitruck ? 2 : 1, tracao: 1, truck: 1, carreta: 0 };
        if (brand === 'scania') {
          result.suporteTracao = scaniaAr ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true } : (hasReducao ? { code: 'EQ-1330', name: 'Suporte Redução Scania', defined: true } : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true });
        } else if (brand === 'volvo' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1330', name: 'Suporte Redução Volvo', defined: true };
        } else if (brand === 'mb' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
        } else {
          result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        }
        result.suporteTruck = (brand === 'scania' && scaniaAr) ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true } : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
        break;

      case 'trucado_reboque':
        result.axlesCount = { dianteiro: 1, tracao: 1, truck: 1, carreta: 2 };
        result.suporteTracao = (brand === 'scania') ? (scaniaAr ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true } : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true }) : { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        result.suporteTruck = (brand === 'scania' && scaniaAr) ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true } : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
        result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Reboque (2 Eixos)', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
        break;

      case 'cavalo_toco_carreta3':
        result.axlesCount = { dianteiro: 1, tracao: 1, truck: 0, carreta: 3 };
        result.suporteTracao = (brand === 'scania') ? { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true } : { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Carreta (3 Eixos)', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
        break;

      case 'trucado_carreta3':
        result.axlesCount = { dianteiro: 1, tracao: 1, truck: 1, carreta: 3 };
        if (brand === 'scania') {
          result.suporteTracao = scaniaAr ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true } : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true };
        } else if (brand === 'mb' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
        } else {
          result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        }
        result.suporteTruck = (brand === 'scania' && scaniaAr) ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true } : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
        result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Carreta', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
        break;

      case 'bitrem_7eixos':
        result.axlesCount = { dianteiro: 1, tracao: traction6x4 ? 2 : 1, truck: traction6x4 ? 0 : 1, carreta: 4 };
        if (brand === 'scania') {
          result.suporteTracao = scaniaAr ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true } : (hasReducao ? { code: 'EQ-1330', name: 'Suporte Redução Scania', defined: true } : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true });
        } else if (brand === 'volvo' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1330', name: 'Suporte Redução Volvo', defined: true };
        } else if (brand === 'mb' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
        } else {
          result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        }
        if (!traction6x4) {
          result.suporteTruck = (brand === 'scania' && scaniaAr) ? { code: 'EQ-1390', name: 'Suporte Truck Scania Ar', defined: true } : { code: 'EQ-1135', name: 'Suporte Universal Truck', defined: true };
        }
        result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Bitrem (4 eixos)', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
        break;

      case 'rodotrem_9eixos':
        result.axlesCount = { dianteiro: 1, tracao: 2, truck: 0, carreta: 6 };
        if (brand === 'scania') {
          result.suporteTracao = scaniaAr ? { code: 'EQ-1390', name: 'Suporte Scania Ar', defined: true } : (hasReducao ? { code: 'EQ-1330', name: 'Suporte Redução Scania', defined: true } : { code: 'EQ-1190', name: 'Suporte Tração Scania', defined: true });
        } else if (brand === 'volvo' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1330', name: 'Suporte Redução Volvo', defined: true };
        } else if (brand === 'mb' && hasReducao) {
          result.suporteTracao = { code: 'EQ-1271', name: 'Suporte Tração MB c/ Redução', defined: true };
        } else {
          result.suporteTracao = { code: 'EQ-1145', name: 'Suporte Tração Universal', defined: true };
        }
        result.suporteCarreta = { code: 'EQ-1135', name: 'Suporte Universal Rodotrem (6 eixos)', defined: true };
        result.suporteDianteiro = (brand === 'scania' || brand === 'volvo') ? { code: 'EQ-1250', name: 'Suporte Dianteiro Scania/Volvo', defined: true } : (brand === 'mb' && mbYear === 'lt2017' ? { code: 'EQ-1300', name: 'Suporte Dianteiro MB <2017', defined: true } : { code: 'EQ-1251', name: 'Suporte Dianteiro Universal', defined: true });
        break;
    }

    return result;
  }

  function buildConsolidatedVehiclePieces(vId, answers, libras, includeDianteira) {
    const resolution = resolveVehicleSupports(vId, answers);
    const axles = resolution.axlesCount;
    const eqCode = `EQ-${libras}`;
    const eqDiantCode = `EQ-${libras}D`;

    const consolidatedMap = new Map();
    const addPiece = (code, qty) => {
      if (!code || qty <= 0) return;
      const current = consolidatedMap.get(code) || 0;
      consolidatedMap.set(code, current + qty);
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

    let resultList = [];
    consolidatedMap.forEach((qty, code) => {
      resultList.push({ code, qty, customPrice: null });
    });

    return { resultList, resolution };
  }

  function renderConsultantEngine() {
    const container = document.getElementById('consultant-questions-container');
    const resultsContainer = document.getElementById('consultant-resolution-container');
    const vehicleButtonsContainer = document.getElementById('consultant-vehicle-quick-buttons');
    if (!container || !resultsContainer) return;

    const currentRule = OG_DATA.vehicleConsultantRules.find(r => r.id === state.consultant.selectedVehicleId) || OG_DATA.vehicleConsultantRules[0];

    if (vehicleButtonsContainer) {
      vehicleButtonsContainer.innerHTML = '';
      OG_DATA.vehicleConsultantRules.forEach(rule => {
        const isSelected = rule.id === currentRule.id;
        const btn = document.createElement('button');
        btn.className = `px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${isSelected ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'}`;
        btn.innerHTML = `<span>🚛</span> <span>${rule.name}</span>`;
        btn.addEventListener('click', () => {
          state.consultant.selectedVehicleId = rule.id;
          state.consultant.targetVehicleName = rule.name;
          renderConsultantEngine();
        });
        vehicleButtonsContainer.appendChild(btn);
      });
    }

    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 mb-3';
    headerDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl">🚛</span>
          <div>
            <h4 class="font-bold text-sm text-slate-100">${currentRule.name}</h4>
            <span class="text-[11px] text-slate-400">Aplicações: <b>${currentRule.applications.join(', ')}</b></span>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">${currentRule.category}</span>
      </div>
    `;
    container.appendChild(headerDiv);

    currentRule.questions.forEach(q => {
      if (q.showIf) {
        const [k, v] = Object.entries(q.showIf)[0];
        if (state.consultant.answers[k] !== v) return;
      }

      const qDiv = document.createElement('div');
      qDiv.className = 'bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2';
      qDiv.innerHTML = `
        <div class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span class="text-amber-400">❓</span>
          <span>${q.question}</span>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          ${q.options.map(opt => {
            const isChecked = state.consultant.answers[q.id] === opt.value;
            return `
              <button type="button" data-qid="${q.id}" data-val="${opt.value}" class="btn-consultant-opt px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${isChecked ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700'}">
                ${opt.label}
              </button>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(qDiv);
    });

    container.querySelectorAll('.btn-consultant-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.getAttribute('data-qid');
        const val = btn.getAttribute('data-val');
        state.consultant.answers[qId] = val;
        renderConsultantEngine();
      });
    });

    const { resultList, resolution } = buildConsolidatedVehiclePieces(
      currentRule.id,
      state.consultant.answers,
      state.consultant.libras,
      state.consultant.includeDianteira
    );

    let supportsHtml = '';
    if (resolution.suporteTracao) {
      supportsHtml += `
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Suporte Tração</span>
            <span class="font-mono font-bold text-amber-400 text-xs">${resolution.suporteTracao.code}</span>
            <span class="text-[11px] text-slate-300 ml-1.5">${resolution.suporteTracao.name}</span>
          </div>
          <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">✅ Definido</span>
        </div>
      `;
    }

    if (resolution.suporteTruck) {
      supportsHtml += `
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Suporte Truck</span>
            <span class="font-mono font-bold text-amber-400 text-xs">${resolution.suporteTruck.code}</span>
            <span class="text-[11px] text-slate-300 ml-1.5">${resolution.suporteTruck.name}</span>
          </div>
          <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">✅ Definido</span>
        </div>
      `;
    }

    if (resolution.suporteCarreta) {
      supportsHtml += `
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Suporte Carretas / Reboques</span>
            <span class="font-mono font-bold text-amber-400 text-xs">${resolution.suporteCarreta.code}</span>
            <span class="text-[11px] text-slate-300 ml-1.5">${resolution.suporteCarreta.name}</span>
          </div>
          <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">✅ Definido</span>
        </div>
      `;
    }

    if (state.consultant.includeDianteira && resolution.suporteDianteiro) {
      supportsHtml += `
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Suporte Dianteiro</span>
            <span class="font-mono font-bold text-amber-400 text-xs">${resolution.suporteDianteiro.code}</span>
            <span class="text-[11px] text-slate-300 ml-1.5">${resolution.suporteDianteiro.name}</span>
          </div>
          <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">✅ Definido</span>
        </div>
      `;
    }

    let piecesConsolidatedHtml = resultList.map(item => {
      const catItem = OG_DATA.catalog.find(c => c.code === item.code) || { name: item.code };
      return `
        <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">${item.code}</span>
            <span class="text-slate-200">${catItem.name}</span>
          </div>
          <span class="font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded">${item.qty} un</span>
        </div>
      `;
    }).join('');

    resultsContainer.innerHTML = `
      <div class="space-y-3">
        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suportes Identificados com Precisão:</h4>
          <div class="space-y-1.5">
            ${supportsHtml}
          </div>
        </div>

        <div class="pt-2">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Peças Consolidadas para Este Veículo:</h4>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
            ${piecesConsolidatedHtml}
          </div>
        </div>
      </div>
    `;
    syncVehicleGallerySelection();
  }

  function injectConsultantVehicleIntoQuote() {
    const currentRule = OG_DATA.vehicleConsultantRules.find(r => r.id === state.consultant.selectedVehicleId) || OG_DATA.vehicleConsultantRules[0];
    const { resultList } = buildConsolidatedVehiclePieces(
      currentRule.id,
      state.consultant.answers,
      state.consultant.libras,
      state.consultant.includeDianteira
    );

    // Recolhe os anteriores
    state.vehicles.forEach(v => { v.collapsed = true; });

    let vehName = state.consultant.targetVehicleName || currentRule.name;
    if (currentRule.id === '3_4') {
      if (state.consultant.answers.brand === 'mb') vehName = 'Mercedes-Benz Accelo (3/4)';
      else if (state.consultant.answers.brand === 'vw') vehName = 'VW Delivery 3/4';
    }

    const newVeh = {
      id: 'veh_' + Date.now(),
      name: `${vehName} (${state.consultant.libras} LBS)`,
      vehicleTypeId: currentRule.id,
      libras: state.consultant.libras,
      includeDianteira: state.consultant.includeDianteira,
      qty: 1,
      collapsed: false,
      items: resultList
    };

    state.vehicles.push(newVeh);
    recalculateQuote();

    const assistContainer = document.getElementById('assist-vehicle-container');
    if (assistContainer) assistContainer.classList.add('hidden');

    switchTab('cotacao');
    showNotification(`Veículo "${newVeh.name}" adicionado à cotação com sucesso!`, 'success');
  }

  // =========================================================================
  // ENLACES DOS INPUTS DO CLIENTE E CONDIÇÕES
  // =========================================================================

  function initClientInputs() {
    const bindInput = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        state.client[key] = e.target.value;
        recalculateQuote();
      });
    };

    bindInput('client-name', 'nome');
    bindInput('client-company', 'empresa');
    bindInput('client-cnpj', 'cnpj');
    bindInput('client-ie', 'ie');
    bindInput('client-socio', 'socioAdmin');
    bindInput('client-phone', 'telefone');
    bindInput('client-city', 'cidadeUf');
    bindInput('client-tier', 'tier');
    bindInput('client-payment', 'paymentMethod');
    bindInput('client-parcelas', 'parcelasCount');
    bindInput('client-preco-pneu', 'precoPneu');
    bindInput('client-prazo-entrega', 'prazoEntrega');
    bindInput('client-frete-texto', 'freteTexto');
  }

  // =========================================================================
  // HISTÓRICO, CATÁLOGO, TRANSPORTADORAS E CRM
  // =========================================================================

  function renderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    if (state.history.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500">
          <div class="text-base font-semibold text-slate-400">Nenhuma cotação salva no histórico</div>
          <div class="text-xs text-slate-500 mt-1">Ao calcular uma proposta, clique em "Salvar" para guardar aqui.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    state.history.forEach((h, idx) => {
      const d = new Date(h.date);
      const dateFormatted = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const card = document.createElement('div');
      card.className = 'clean-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4';

      card.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-bold font-mono text-xs flex-shrink-0">
            ${h.id}
          </div>
          <div>
            <div class="font-bold text-slate-100">${h.clientName} ${h.clientCompany ? `<span class="text-xs font-normal text-slate-400">(${h.clientCompany})</span>` : ''}</div>
            <div class="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-2">
              <span>📦 ${h.totalPecas} peças</span> •
              <span>📅 ${dateFormatted}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div class="text-right">
            <div class="text-xs text-slate-400">Valor Total</div>
            <div class="text-lg font-bold text-amber-400">R$ ${h.totalValue.toFixed(2)}</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button data-load="${idx}" class="btn-load-hist px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition font-bold">
              Carregar
            </button>
            <button data-del="${idx}" class="btn-del-hist p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.btn-load-hist').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.getAttribute('data-load'), 10);
        const item = state.history[idx];
        if (item && item.payload) {
          state.client = item.payload.client || state.client;
          state.vehicles = item.payload.vehicles || [];
          state.extraItems = item.payload.extraItems || [];
          switchTab('cotacao');
          recalculateQuote();
          showNotification('Cotação recuperada com sucesso!', 'success');
        }
      });
    });

    container.querySelectorAll('.btn-del-hist').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.getAttribute('data-del'), 10);
        state.history.splice(idx, 1);
        localStorage.setItem('og_cotacoes_history', JSON.stringify(state.history));
        scheduleServerSync();
        renderHistory();
      });
    });
  }

  /**
   * Calcula o preço de um item do catálogo para uma tabela de preço (tier) específica.
   * Mapeia por categoria: equalizador, suporte, mangueira usam o valor da tabela.
   * Peças específicas (giratório, enchimento, anel) usam seu campo próprio.
   * Ferramentas e kits usam o preço base + acréscimo de tabela (ex: +12% sem IE).
   */
  function getItemPriceForTier(item, tierId) {
    const tier = OG_DATA.pricingTiers[tierId];
    if (!tier || tier.id === 'locacao') return item.priceBase || 0;

    if (item.category === 'equalizador') return tier.equalizador;
    if (item.category === 'suporte') return tier.suporte;
    if (item.category === 'mangueira') return tier.mangueira;

    if (item.category === 'peca') {
      if (item.code === 'EQ-512') return tier.bicoGiratorio;
      if (item.code === 'EQ-518') return tier.bicoEnchimento;
      if (item.code === 'EQ-529') return tier.anelVedacao;
      return item.priceBase;
    }

    // Ferramentas e kits: preço de tabela cheia, com acréscimo de tabela quando houver (ex: sem IE)
    const extra = tier.extraTaxPercent || 0;
    return (item.priceBase || 0) * (1 + extra / 100);
  }

  function openItemPricingModal(item) {
    const modal = document.getElementById('modal-item-pricing');
    if (!modal) return;

    document.getElementById('item-pricing-code').textContent = item.code;
    document.getElementById('item-pricing-name').textContent = item.name;
    document.getElementById('item-pricing-desc').textContent = item.desc || 'Consulte a equipe técnica para aplicação exata.';

    const tiersEl = document.getElementById('item-pricing-tiers');
    tiersEl.innerHTML = '';

    Object.values(OG_DATA.pricingTiers).forEach(tier => {
      if (tier.id === 'locacao') return; // locação é por plano mensal, não por peça avulsa
      const price = getItemPriceForTier(item, tier.id);
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5';
      row.innerHTML = `
        <div>
          <div class="text-xs font-bold text-slate-200">${tier.name}</div>
          <div class="text-[10px] text-slate-500">${tier.description}</div>
        </div>
        <div class="text-sm font-black text-amber-400 font-mono whitespace-nowrap ml-3">R$ ${(price || 0).toFixed(2)}</div>
      `;
      tiersEl.appendChild(row);
    });

    modal.classList.remove('hidden');
  }

  function initItemPricingModal() {
    const modal = document.getElementById('modal-item-pricing');
    const btnClose = document.getElementById('btn-close-modal-item-pricing');
    if (btnClose) btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }
  }

  function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    const searchInput = document.getElementById('catalog-search');
    const categoryFilter = document.getElementById('catalog-category-filter');
    if (!grid) return;

    function doRender() {
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const cat = categoryFilter ? categoryFilter.value : 'all';

      const filtered = OG_DATA.catalog.filter(item => {
        const matchesQuery = !query ||
          item.code.toLowerCase().includes(query) ||
          (item.internalCode && item.internalCode.toLowerCase().includes(query)) ||
          item.name.toLowerCase().includes(query) ||
          (item.desc && item.desc.toLowerCase().includes(query));

        const matchesCat = cat === 'all' || item.category === cat;
        return matchesQuery && matchesCat;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Nenhum item encontrado no catálogo.</div>`;
        return;
      }

      grid.innerHTML = '';
      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'clean-card p-4 flex flex-col justify-between cursor-pointer';
        card.title = 'Clique para ver o preço por tipo de cliente e aplicação';

        let badgeCat = 'bg-blue-500/10 text-blue-400 border-blue-500/25';
        if (item.category === 'equalizador') badgeCat = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
        if (item.category === 'suporte') badgeCat = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
        if (item.category === 'mangueira') badgeCat = 'bg-purple-500/10 text-purple-400 border-purple-500/25';
        if (item.category === 'kit' || item.category === 'ferramenta') badgeCat = 'bg-rose-500/10 text-rose-400 border-rose-500/25';

        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="font-mono font-bold text-sm bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                ${item.code}
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeCat}">
                ${item.category}
              </span>
            </div>
            <div class="font-bold text-slate-100 text-sm mb-1">${item.name}</div>
            <div class="text-xs text-slate-400 leading-relaxed mb-3">${item.desc || ''}</div>
          </div>
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span class="text-slate-500 block text-[10px] font-semibold">Cód OG</span>
              <span class="font-mono font-bold text-slate-200">${item.internalCode || '—'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] font-semibold">NCM</span>
              <span class="font-mono text-slate-300 font-medium">${item.ncm || '—'}</span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 block text-[10px] font-semibold">Preço Base</span>
              <span class="font-bold text-amber-400 text-sm">R$ ${(item.priceBase || 30.00).toFixed(2)}</span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => openItemPricingModal(item));
        grid.appendChild(card);
      });
    }

    if (searchInput) searchInput.oninput = doRender;
    if (categoryFilter) categoryFilter.onchange = doRender;
    doRender();
  }

  function renderTransporters() {
    const list = document.getElementById('transporters-list');
    const search = document.getElementById('transporter-search');
    if (!list) return;

    function doRender() {
      const q = (search ? search.value : '').toLowerCase().trim();
      const filtered = OG_DATA.transporters.filter(t => {
        return !q ||
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.coverage.toLowerCase().includes(q);
      });

      if (filtered.length === 0) {
        list.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500">Nenhuma transportadora encontrada.</div>`;
        return;
      }

      list.innerHTML = '';
      filtered.forEach(t => {
        const card = document.createElement('div');
        card.className = 'clean-card p-4 flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                Cód: ${t.code}
              </span>
              ${t.fast ? '<span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">Express / Frequente</span>' : ''}
            </div>
            <div class="font-bold text-slate-100 text-base mb-1">${t.name}</div>
            <div class="text-xs text-slate-400 mb-3">${t.coverage}</div>
          </div>
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] text-slate-500 block font-semibold">Telefone</span>
              <span class="text-sm font-bold text-slate-200 font-mono">${t.phone}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button data-transp-code="${t.code}" class="btn-transporter-quote-msg px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1" title="Gera mensagem de cotação com peso, volumes e dimensões">
                💬 Cotação
              </button>
              <a href="tel:${t.cleanPhone}" class="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1">
                Ligar
              </a>
            </div>
          </div>
        `;
        list.appendChild(card);
      });

      list.querySelectorAll('.btn-transporter-quote-msg').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = OG_DATA.transporters.find(x => x.code === btn.getAttribute('data-transp-code'));
          if (t) copyTransporterQuoteMessage(t);
        });
      });
    }

    if (search) search.oninput = doRender;
    doRender();
  }

  /**
   * Monta a mensagem de cotação de frete para uma transportadora específica.
   * Usa peso e quantidade de peças da cotação atual para estimar volumes e dimensões.
   * Essa mensagem NUNCA entra na proposta em PDF ou WhatsApp do cliente — é só para
   * o vendedor pedir o valor do frete para a transportadora.
   */
  function copyTransporterQuoteMessage(transporter) {
    const data = state.lastQuoteData || calculateCompleteQuote();
    const est = getFreightEstimate(data);
    const totalPecas = data.totalPecas || 0;

    const origemCidade = 'Maringá - PR';
    const destinoCidade = state.client.cidadeUf || '[cidade/UF do destinatário]';
    const nomeVendedor = state.client.vendedor || 'Olho de Gato';

    const msg =
`Olá, ${transporter.name}! Aqui é ${nomeVendedor}. Gostaria de fazer uma cotação de frete.

📍 Origem: ${origemCidade}
📍 Destino: ${destinoCidade}
📦 Volumes: ${est.volumes} (aprox. ${est.pesoPorVolume.toFixed(1)} kg cada)
⚖️ Peso total: ${est.pesoTotalKg.toFixed(1)} kg
📐 Dimensões por volume: ${est.dim.comprimento}x${est.dim.largura}x${est.dim.altura} cm
🔩 Itens: ${totalPecas} peças (equalizadores e acessórios)

Pode me passar o valor e o prazo de entrega, por favor?`;

    navigator.clipboard.writeText(msg).then(() => {
      showNotification(`Mensagem de cotação para ${transporter.name} copiada!`, 'success');
    }).catch(() => {
      showNotification('Não foi possível copiar automaticamente. Copie o texto manualmente.', 'warning');
    });
  }

  function renderSalesKnowledge() {
    const segmentsGrid = document.getElementById('sales-segments-grid');
    if (segmentsGrid && OG_DATA.segments) {
      segmentsGrid.innerHTML = '';
      OG_DATA.segments.forEach(seg => {
        const card = document.createElement('div');
        card.className = 'clean-card p-4 flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${seg.icon}</span>
              <span class="font-bold text-slate-100 text-sm">${seg.name}</span>
            </div>
            <div class="text-xs text-red-400/90 mb-2 font-medium">
              <span class="font-bold text-red-400">🚨 Dor:</span> ${seg.dor}
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 italic mb-3">
              <span class="font-bold text-amber-400 not-italic block mb-0.5">💬 Gancho:</span>
              "${seg.gancho}"
            </div>
          </div>
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-[10px] text-slate-400">Foco: <b>${seg.focoVenda}</b></span>
            <button data-seg="${seg.id}" class="btn-apply-seg px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition">
              Usar na Cotação
            </button>
          </div>
        `;
        segmentsGrid.appendChild(card);
      });

      segmentsGrid.querySelectorAll('.btn-apply-seg').forEach(btn => {
        btn.addEventListener('click', () => {
          const sId = btn.getAttribute('data-seg');
          state.client.segmentId = sId;
          switchTab('cotacao');
          recalculateQuote();
          showNotification('Segmento aplicado!', 'success');
        });
      });
    }

    initRoiCalculator();
  }

  function initRoiCalculator() {
    const inputTires = document.getElementById('roi-tires-count');
    const inputTirePrice = document.getElementById('roi-tire-price');
    const inputInvestment = document.getElementById('roi-investment');
    const resEconomyTiresMonthly = document.getElementById('roi-res-economy-tires-monthly');
    const resEconomyTires = document.getElementById('roi-res-economy-tires');
    const resDieselMonthly = document.getElementById('roi-res-diesel-monthly');
    const resDieselEconomy = document.getElementById('roi-res-diesel');
    const resTotalMonthly = document.getElementById('roi-res-total-monthly');
    const resTotalEconomy = document.getElementById('roi-res-total');
    const resPayback = document.getElementById('roi-res-payback');

    if (!inputTires || !inputTirePrice) return;

    function fmt(v) {
      return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function calcRoi() {
      const numPneus = parseInt(inputTires.value, 10) || 0;
      const precoPneu = parseFloat(inputTirePrice.value) || 0;
      const investimento = parseFloat(inputInvestment ? inputInvestment.value : '') || 0;

      const patrimonioPneus = numPneus * precoPneu;
      const vidaUtilComOgMeses = TIRE_BASE_LIFE_MONTHS * (1 + TIRE_LIFE_GAIN_RATE);
      const custoPneusAnualSemOg = patrimonioPneus * (12 / TIRE_BASE_LIFE_MONTHS);
      const custoPneusAnualComOg = patrimonioPneus * (12 / vidaUtilComOgMeses);
      const economiaPneusAnual = Math.max(0, custoPneusAnualSemOg - custoPneusAnualComOg);
      const economiaDieselAnual = numPneus * 450.00;
      const totalAnual = economiaPneusAnual + economiaDieselAnual;
      const totalMensal = totalAnual / 12;

      if (resEconomyTiresMonthly) resEconomyTiresMonthly.textContent = fmt(economiaPneusAnual / 12);
      if (resEconomyTires) resEconomyTires.textContent = fmt(economiaPneusAnual);
      if (resDieselMonthly) resDieselMonthly.textContent = fmt(economiaDieselAnual / 12);
      if (resDieselEconomy) resDieselEconomy.textContent = fmt(economiaDieselAnual);
      if (resTotalMonthly) resTotalMonthly.textContent = fmt(totalMensal);
      if (resTotalEconomy) resTotalEconomy.textContent = fmt(totalAnual);

      if (resPayback) {
        if (investimento > 0 && totalMensal > 0) {
          const mesesPayback = investimento / totalMensal;
          resPayback.textContent = mesesPayback < 1
            ? `${Math.round(mesesPayback * 30)} dias`
            : `${mesesPayback.toFixed(1)} meses`;
        } else {
          resPayback.textContent = '—';
        }
      }
    }

    inputTires.oninput = calcRoi;
    inputTirePrice.oninput = calcRoi;
    if (inputInvestment) inputInvestment.oninput = calcRoi;
    calcRoi();
  }

  // =========================================================================
  // BIBLIOTECA DE DORES E GANCHOS (editável, com itens padrão + do usuário)
  // =========================================================================

  function loadCustomDoresGanchos() {
    try {
      const saved = localStorage.getItem('og_dores_ganchos_custom');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomDoresGanchos(list) {
    try {
      localStorage.setItem('og_dores_ganchos_custom', JSON.stringify(list));
    } catch (e) {
      console.error('Erro ao salvar dores e ganchos', e);
    }
  }

  function renderDoresGanchosList() {
    const container = document.getElementById('dores-ganchos-list');
    if (!container) return;

    const padrao = (OG_DATA.segments || []).map(seg => ({
      dor: seg.dor,
      gancho: seg.gancho,
      origem: seg.name,
      custom: false
    }));
    const custom = loadCustomDoresGanchos().map(item => ({ ...item, custom: true }));
    const todos = [...padrao, ...custom];

    if (todos.length === 0) {
      container.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs">Nenhuma dor ou gancho cadastrado ainda.</div>`;
      return;
    }

    container.innerHTML = '';
    todos.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'bg-slate-900/80 border border-slate-800 rounded-lg p-3';
      row.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <div class="text-[10px] font-bold text-red-400 uppercase mb-0.5">🚨 Dor ${item.origem ? `· ${item.origem}` : ''}</div>
            <div class="text-xs text-slate-200 mb-2">${item.dor}</div>
            <div class="text-[10px] font-bold text-amber-400 uppercase mb-0.5">💬 Gancho</div>
            <div class="text-xs text-slate-300 italic">"${item.gancho}"</div>
          </div>
          <div class="flex flex-col gap-1 flex-shrink-0">
            <button data-copy-idx="${idx}" class="btn-copy-dor-gancho px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 whitespace-nowrap">Copiar</button>
            ${item.custom ? `<button data-remove-custom="${item.customId}" class="btn-remove-dor-gancho px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">Excluir</button>` : ''}
          </div>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.btn-copy-dor-gancho').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-copy-idx'), 10);
        const item = todos[idx];
        navigator.clipboard.writeText(`${item.dor}\n"${item.gancho}"`).then(() => {
          showNotification('Copiado!', 'success');
        });
      });
    });

    container.querySelectorAll('.btn-remove-dor-gancho').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-custom');
        const list = loadCustomDoresGanchos().filter(i => i.customId !== id);
        saveCustomDoresGanchos(list);
        renderDoresGanchosList();
        showNotification('Removido da lista.', 'success');
      });
    });
  }

  function initDoresGanchosModal() {
    const btnOpen = document.getElementById('btn-open-dores-ganchos');
    const modal = document.getElementById('modal-dores-ganchos');
    const btnClose = document.getElementById('btn-close-modal-dores-ganchos');
    const btnAdd = document.getElementById('btn-add-dor-gancho');
    const inputDor = document.getElementById('input-nova-dor');
    const inputGancho = document.getElementById('input-novo-gancho');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        renderDoresGanchosList();
        modal.classList.remove('hidden');
      });
    }
    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const dor = (inputDor.value || '').trim();
        const gancho = (inputGancho.value || '').trim();
        if (!dor || !gancho) {
          showNotification('Preencha a dor e o gancho antes de adicionar!', 'warning');
          return;
        }
        const list = loadCustomDoresGanchos();
        list.push({ dor, gancho, customId: 'cg_' + Date.now() });
        saveCustomDoresGanchos(list);
        inputDor.value = '';
        inputGancho.value = '';
        renderDoresGanchosList();
        showNotification('Dor e gancho adicionados à lista!', 'success');
      });
    }
  }

  // =========================================================================
  // MEU DIA — SECRETÁRIO, ASSISTENTE E TREINADOR COMERCIAL
  // =========================================================================
  let dayFilter = 'all';
  let quickLeadOrigin = 'crm';

  function normalizeLead(lead) {
    return OG_CRM_SERVICE.normalizeLead(lead);
  }

  function createQuickLeadId() {
    return `LEAD-${Date.now().toString(36).toUpperCase()}`;
  }

  function openQuickLead(origin = 'crm') {
    quickLeadOrigin = origin;
    const modal = document.getElementById('modal-quick-lead');
    const form = document.getElementById('quick-lead-form');
    if (!modal || !form) return;
    form.reset();
    document.getElementById('quick-lead-priority').value = 'media';
    document.getElementById('quick-lead-segment').value = 'transportadora';
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('quick-lead-company')?.focus(), 30);
  }

  function closeQuickLead() {
    document.getElementById('modal-quick-lead')?.classList.add('hidden');
  }

  function initQuickLead() {
    const segment = document.getElementById('quick-lead-segment');
    if (segment) segment.innerHTML = OG_DATA.segments.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.icon)} ${escapeHtml(item.name)}</option>`).join('');
    document.querySelectorAll('[data-quick-lead]').forEach(button => button.addEventListener('click', () => openQuickLead(button.dataset.quickLead)));
    document.getElementById('quick-lead-close')?.addEventListener('click', closeQuickLead);
    document.getElementById('quick-lead-cancel')?.addEventListener('click', closeQuickLead);
    document.getElementById('modal-quick-lead')?.addEventListener('click', event => { if (event.target.id === 'modal-quick-lead') closeQuickLead(); });
    document.getElementById('quick-lead-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const empresa = document.getElementById('quick-lead-company').value.trim();
      if (!empresa) return;
      const prospectInput = {
        empresa,
        nome: document.getElementById('quick-lead-contact').value.trim(),
        telefone: document.getElementById('quick-lead-phone').value,
        cidadeUf: document.getElementById('quick-lead-city').value.trim(),
        segmentId: document.getElementById('quick-lead-segment').value,
        priority: document.getElementById('quick-lead-priority').value,
        nextAction: document.getElementById('quick-lead-next-action').value.trim(),
        followUpAt: document.getElementById('quick-lead-follow-up').value
      };
      const duplicates = OG_CRM_SERVICE.findPossibleDuplicates(state.leads, prospectInput);
      if (duplicates.length && !window.confirm(`Possível duplicidade: ${duplicates[0].empresa || duplicates[0].nome}. Deseja cadastrar mesmo assim?`)) {
        state.selectedLeadId = duplicates[0].id;
        closeQuickLead();
        renderDayDashboard();
        return;
      }
      const lead = OG_CRM_SERVICE.createProspect(prospectInput, { id: createQuickLeadId() });
      state.leads.unshift(lead);
      state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, {
        id: `EVT-${Date.now().toString(36).toUpperCase()}`,
        type: 'client.created',
        at: new Date().toISOString(),
        clientId: lead.id,
        source: `quick-lead:${quickLeadOrigin}`
      });
      localStorage.setItem('og_operations_state', JSON.stringify(state.operations));
      state.selectedLeadId = lead.id;
      saveLeadsToStorage();
      renderDayDashboard();
      renderCrmModule();
      closeQuickLead();
      if (quickLeadOrigin === 'call-ai') {
        switchTab('call-ai');
        selectCallClient(lead.id);
      } else if (quickLeadOrigin === 'crm') {
        switchTab('crm');
      } else {
        switchTab('dia');
      }
      showNotification(`${empresa} foi adicionado ao sistema.`, 'success');
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function toLocalDateKey(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatFollowUp(value) {
    if (!value) return 'Sem data definida';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function getDayGroups() {
    const now = new Date();
    const today = toLocalDateKey(now);
    const active = state.leads.filter(lead => !['fechado'].includes(lead.status));
    return {
      all: active,
      overdue: active.filter(lead => lead.followUpAt && new Date(lead.followUpAt) < now && toLocalDateKey(lead.followUpAt) !== today),
      today: active.filter(lead => toLocalDateKey(lead.followUpAt) === today),
      priority: active.filter(lead => lead.priority === 'alta'),
      'no-action': active.filter(lead => !lead.nextAction.trim())
    };
  }

  function getOpportunityScore(lead) {
    let score = lead.priority === 'alta' ? 40 : lead.priority === 'media' ? 20 : 0;
    if (lead.followUpAt) {
      const distance = new Date(lead.followUpAt).getTime() - Date.now();
      if (distance < 0) score += 50;
      else if (distance < 86400000) score += 35;
    }
    if (!lead.nextAction) score += 18;
    if (lead.status === 'negociacao') score += 20;
    if (lead.status === 'proposta_enviada') score += 15;
    return score;
  }

  function getCoachContent(groups) {
    if (groups.overdue.length) return {
      title: 'Recupere os retornos vencidos',
      message: `${groups.overdue.length} oportunidade${groups.overdue.length > 1 ? 's estão' : ' está'} esperando uma ação. Comece confirmando se a prioridade do cliente continua a mesma.`,
      prompts: ['“O que mudou desde a nossa última conversa?”', '“Qual informação falta para avançarmos?”']
    };
    const missingDecision = state.leads.filter(lead => !lead.decisionMaker && !['novo', 'fechado'].includes(lead.status));
    if (missingDecision.length) return {
      title: 'Descubra quem participa da decisão',
      message: `${missingDecision.length} oportunidade${missingDecision.length > 1 ? 's ainda não têm' : ' ainda não tem'} decisor registrado. Isso costuma travar propostas.`,
      prompts: ['“Além de você, quem mais precisa avaliar esta solução?”', '“Como normalmente uma compra assim é aprovada?”']
    };
    const missingPain = state.leads.filter(lead => !lead.pain && !['novo', 'fechado'].includes(lead.status));
    if (missingPain.length) return {
      title: 'Aprofunde o diagnóstico',
      message: 'Há conversas em andamento sem uma dor confirmada. Use a próxima ligação para entender impacto, frequência e urgência.',
      prompts: ['“Como esse problema aparece hoje na operação?”', '“Quanto isso afeta disponibilidade, pneus ou manutenção?”']
    };
    return {
      title: 'Mantenha o ritmo comercial',
      message: 'Sua fila está organizada. Priorize conversas com data, registre o resultado e sempre combine o próximo passo.',
      prompts: ['Termine cada conversa com responsável e data.', 'Registre fatos confirmados separados de hipóteses.']
    };
  }

  function renderDayDashboard() {
    const list = document.getElementById('day-opportunity-list');
    if (!list) return;
    const groups = getDayGroups();
    document.getElementById('kpi-overdue').textContent = groups.overdue.length;
    document.getElementById('kpi-today').textContent = groups.today.length;
    document.getElementById('kpi-priority').textContent = groups.priority.length;
    document.getElementById('kpi-no-action').textContent = groups['no-action'].length;

    const selected = OG_SALES_DESK.selectQueue(state.leads, dayFilter, state.salesDeskSearch);
    document.querySelectorAll('.og-chip[data-day-filter]').forEach(button => {
      button.classList.toggle('active', button.dataset.dayFilter === dayFilter);
    });

    if (!selected.length) {
      list.innerHTML = '<div class="og-empty">Nenhuma oportunidade neste filtro. Abra o CRM para cadastrar ou completar um cliente.</div>';
    } else {
      if (!state.selectedLeadId || !state.leads.some(lead => lead.id === state.selectedLeadId)) state.selectedLeadId = selected[0]?.id || null;
      list.innerHTML = selected.slice(0, 30).map(lead => OG_UI_COMPONENTS.clientRow(lead, {
        selectedId: state.selectedLeadId,
        lastInteraction: OG_SALES_DESK.lastInteraction(lead),
        followUpLabel: formatFollowUp(lead.followUpAt)
      })).join('');
      list.querySelectorAll('[data-desk-select]').forEach(button => button.addEventListener('click', () => {
        state.selectedLeadId = button.dataset.deskSelect;
        renderDayDashboard();
      }));
      list.querySelectorAll('[data-desk-whatsapp]').forEach(button => button.addEventListener('click', event => {
        event.stopPropagation();
        const lead = OG_CRM_SERVICE.getLeadById(state.leads, button.dataset.deskWhatsapp);
        if (lead) openDeskWhatsApp(lead);
      }));
    }

    const coaching = getCoachContent(groups);
    document.getElementById('coach-title').textContent = coaching.title;
    document.getElementById('coach-message').textContent = coaching.message;
    document.getElementById('coach-prompts').innerHTML = coaching.prompts.map(item => `<div class="og-coach-prompt">${escapeHtml(item)}</div>`).join('');
    renderSalesDeskClient();
    updateDayClock();
  }

  function persistSalesDeskActivity(lead, interaction, activityType) {
    const now = interaction?.at || new Date().toISOString();
    state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, {
      id: interaction?.eventId || `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: activityType,
      at: now,
      clientId: lead.id,
      interactionId: interaction?.id || null
    });
    saveLeadsToStorage();
    saveOperationsToStorage();
  }

  function openDeskWhatsApp(lead, message = '') {
    let link;
    try { link = OG_WHATSAPP_SERVICE.buildLink(lead.telefone, message); }
    catch { return showNotification('Cadastre um telefone brasileiro válido para abrir o WhatsApp.', 'warning'); }
    const interaction = OG_INTERACTION_SERVICE.addInteraction(lead, { type: 'whatsapp_opened', note: message ? 'WhatsApp aberto com mensagem preparada.' : 'WhatsApp aberto pela Mesa de Vendas.', countAsContact: false });
    persistSalesDeskActivity(lead, interaction, 'whatsapp.opened');
    window.open(link, '_blank', 'noopener');
    renderDayDashboard();
  }

  function deskTemplateVariables(lead, template) {
    return {
      primeiro_nome: (lead.nome || '').split(/\s+/)[0] || 'tudo bem',
      empresa: lead.empresa || lead.nome || '',
      vendedor: state.client.vendedor || 'Lucas, da Olho de Gato',
      assunto: lead.nextAction || template.subject || 'a operação da sua frota'
    };
  }

  function openDeskMessageComposer(lead, templateId = 'follow_up') {
    const filled = OG_WHATSAPP_SERVICE.fillTemplate(templateId, deskTemplateVariables(lead, OG_WHATSAPP_SERVICE.getTemplate(templateId)));
    const overlay = document.createElement('div');
    overlay.className = 'sales-desk-modal';
    overlay.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="desk-message-title" class="clean-card sales-desk-dialog"><header><div><span class="og-kicker">MENSAGEM SEM IA</span><h2 id="desk-message-title">Revisar antes de abrir o WhatsApp</h2></div><button type="button" data-desk-close aria-label="Fechar">✕</button></header><label class="og-field"><span>Modelo</span><select data-desk-template>${OG_WHATSAPP_SERVICE.TEMPLATES.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === templateId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label><label class="og-field"><span>Mensagem editável</span><textarea rows="8" data-desk-message>${escapeHtml(filled.text)}</textarea></label>${filled.missing.length ? `<p class="sales-desk-warning">Revise os campos pendentes: ${escapeHtml(filled.missing.join(', '))}</p>` : ''}<footer><button type="button" data-desk-ai disabled title="Integração planejada para uma próxima tarefa">✨ Personalizar com IA · em breve</button><button type="button" data-desk-open class="og-button og-button-primary">Abrir WhatsApp</button></footer></section>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('[data-desk-close]').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelector('[data-desk-template]').addEventListener('change', event => {
      const next = OG_WHATSAPP_SERVICE.fillTemplate(event.target.value, deskTemplateVariables(lead, OG_WHATSAPP_SERVICE.getTemplate(event.target.value)));
      overlay.querySelector('[data-desk-message]').value = next.text;
    });
    overlay.querySelector('[data-desk-open]').addEventListener('click', () => {
      const message = overlay.querySelector('[data-desk-message]').value.trim();
      const prepared = OG_INTERACTION_SERVICE.addInteraction(lead, { type: 'message_prepared', note: `Mensagem preparada: ${overlay.querySelector('[data-desk-template]').selectedOptions[0].textContent}`, countAsContact: false });
      persistSalesDeskActivity(lead, prepared, 'message.prepared');
      close();
      openDeskWhatsApp(lead, message);
    });
  }

  function followUpValue(mode, specificValue = '') {
    if (mode === 'none') return '';
    if (mode === 'specific') return specificValue;
    const date = new Date();
    if (mode === 'tomorrow') date.setDate(date.getDate() + 1);
    date.setHours(mode === 'today' ? Math.max(date.getHours() + 1, 9) : 9, 0, 0, 0);
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function renderSalesDeskClient() {
    const root = document.getElementById('sales-desk-client');
    if (!root) return;
    const lead = OG_CRM_SERVICE.getLeadById(state.leads, state.selectedLeadId);
    if (!lead) {
      root.innerHTML = '<div class="sales-desk-empty-state"><span class="og-kicker">CLIENTE ATUAL</span><h2>Selecione uma conta</h2><p>Escolha alguém da fila ou cadastre um prospect para começar.</p><button type="button" class="og-button og-button-primary" data-quick-lead="dia">＋ Novo prospect</button></div>';
      root.querySelector('[data-quick-lead]')?.addEventListener('click', () => openQuickLead('dia'));
      return;
    }
    const recent = OG_SALES_DESK.lastInteraction(lead);
    root.innerHTML = `<header class="sales-desk-client-head"><div><span class="og-kicker">CLIENTE ATUAL</span><h2>${escapeHtml(lead.empresa || lead.nome)}</h2><p>${escapeHtml(lead.nome || 'Contato não informado')} · ${escapeHtml(formatPhone(lead.telefone))}</p></div><span class="sales-desk-status">${escapeHtml(lead.status || 'novo')}</span></header><div class="sales-desk-primary-actions"><button type="button" data-client-whatsapp>WhatsApp</button><a href="tel:${escapeHtml(lead.telefone || '')}" data-client-call>Ligar</a><button type="button" data-client-call-ai>Call AI</button><button type="button" data-client-crm>Ficha completa</button></div><section class="sales-desk-facts"><div><small>Próxima ação</small><strong>${escapeHtml(lead.nextAction || 'Não definida')}</strong><span>${escapeHtml(formatFollowUp(lead.followUpAt))}</span></div><div><small>Última interação</small><strong>${escapeHtml(recent?.result || recent?.type || 'Sem histórico')}</strong><span>${escapeHtml(recent?.note || 'Registre a primeira conversa')}</span></div></section><section class="sales-desk-register"><label class="og-field"><span>Resultado rápido</span><select id="desk-result">${Object.entries(OG_INTERACTION_SERVICE.RESULT_DEFINITIONS).map(([value, item]) => `<option value="${value}">${escapeHtml(item.label)}</option>`).join('')}</select></label><label class="og-field"><span>Nota rápida</span><textarea id="desk-note" rows="3" placeholder="O que aconteceu e o que ficou combinado?"></textarea></label><button type="button" id="desk-save-result" class="og-button og-button-primary">Registrar resultado e nota</button><div class="sales-desk-next"><label class="og-field"><span>Próxima ação</span><input id="desk-next-action" value="${escapeHtml(lead.nextAction || '')}" placeholder="Ex.: ligar para João"></label><label class="og-field"><span>Quando</span><select id="desk-follow-mode"><option value="today">Hoje</option><option value="tomorrow">Amanhã</option><option value="specific">Data específica</option><option value="none">Sem próxima ação</option></select></label><label class="og-field hidden" id="desk-specific-wrap"><span>Data específica</span><input id="desk-specific-date" type="datetime-local" value="${escapeHtml(lead.followUpAt || '')}"></label><button type="button" id="desk-save-next">Salvar próxima ação</button></div></section><details class="sales-desk-actions"><summary>Ações e comunicação</summary><div><button type="button" data-desk-template="nao_atendeu">Não atendeu</button><button type="button" data-desk-template="pos_ligacao">Pós-ligação</button><button type="button" data-desk-template="apresentacao">Enviar apresentação</button><button type="button" data-desk-template="orcamento">Enviar orçamento</button><button type="button" data-desk-template="follow_up">Follow-up</button><button type="button" data-future-action="Retomar negociação">Retomar negociação</button><button type="button" data-future-action="Pedir indicação">Pedir indicação</button><button type="button" data-future-action="E-mail">E-mail</button><button type="button" data-future-action="Proposta Premium">Proposta Premium</button></div></details><section class="sales-desk-history"><h3>Histórico recente</h3>${OG_UI_COMPONENTS.timeline(lead.interactions)}</section>`;
    root.querySelector('[data-client-whatsapp]').addEventListener('click', () => openDeskWhatsApp(lead));
    root.querySelector('[data-client-call-ai]').addEventListener('click', () => {
      state.callAI.context = OG_CALL_AI_CONTEXT.build(lead);
      state.callAI.selectedLeadId = lead.id;
      switchTab('call-ai');
      selectCallClient(lead.id);
    });
    root.querySelector('[data-client-crm]').addEventListener('click', () => { state.selectedLeadId = lead.id; switchTab('crm'); });
    root.querySelectorAll('[data-desk-template]').forEach(button => button.addEventListener('click', () => openDeskMessageComposer(lead, button.dataset.deskTemplate)));
    root.querySelectorAll('[data-future-action]').forEach(button => button.addEventListener('click', () => showNotification(`${button.dataset.futureAction}: entrada preparada para uma próxima tarefa.`, 'info')));
    const followMode = root.querySelector('#desk-follow-mode');
    followMode.addEventListener('change', () => root.querySelector('#desk-specific-wrap').classList.toggle('hidden', followMode.value !== 'specific'));
    root.querySelector('#desk-save-result').addEventListener('click', () => {
      const result = root.querySelector('#desk-result').value;
      const note = root.querySelector('#desk-note').value.trim();
      const interaction = OG_INTERACTION_SERVICE.recordResult(lead, result, note);
      persistSalesDeskActivity(lead, interaction, 'interaction.result_recorded');
      showNotification('Resultado registrado no histórico.', 'success');
      renderDayDashboard();
    });
    root.querySelector('#desk-save-next').addEventListener('click', () => {
      const mode = followMode.value;
      const action = mode === 'none' ? '' : root.querySelector('#desk-next-action').value.trim();
      const dueAt = followUpValue(mode, root.querySelector('#desk-specific-date').value);
      if (mode !== 'none' && !action) return showNotification('Informe a próxima ação.', 'info');
      if (mode === 'specific' && !dueAt) return showNotification('Informe a data específica.', 'info');
      const interaction = OG_INTERACTION_SERVICE.setNextAction(lead, action, dueAt);
      persistSalesDeskActivity(lead, interaction, 'task.next_action_set');
      showNotification('Próxima ação atualizada.', 'success');
      renderDayDashboard();
    });
  }

  function updateDayClock() {
    const clock = document.getElementById('day-clock');
    const block = document.getElementById('day-block');
    if (!clock || !block) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    let active = '';
    let label = 'Planejamento e preparação';
    if (minutes >= 540 && minutes < 660) { active = 'morning'; label = 'Bloco de prospecção'; }
    else if (minutes >= 660 && minutes < 720) { active = 'midday'; label = 'Revisão e organização'; }
    else if (minutes >= 780 && minutes < 1020) { active = 'afternoon'; label = 'Avanço de oportunidades'; }
    else if (minutes >= 1020 && minutes < 1050) { active = 'closing'; label = 'Fechamento do dia'; }
    clock.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    block.textContent = label;
    document.querySelectorAll('[data-routine]').forEach(item => item.classList.toggle('active', item.dataset.routine === active));
  }

  function initDayDashboard() {
    document.querySelectorAll('[data-day-filter]').forEach(button => button.addEventListener('click', () => {
      dayFilter = button.dataset.dayFilter;
      renderDayDashboard();
    }));
    const search = document.getElementById('sales-desk-search');
    let searchTimer = null;
    search?.addEventListener('input', event => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { state.salesDeskSearch = event.target.value; renderDayDashboard(); }, 160);
    });
    document.addEventListener('keydown', event => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (event.key === 'Escape') {
        document.querySelector('.sales-desk-modal')?.remove();
        closeQuickLead();
        return;
      }
      if (typing || state.currentTab !== 'dia') return;
      if (event.key === '/') { event.preventDefault(); search?.focus(); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); openQuickLead('dia'); }
      if (event.key.toLowerCase() === 'w') {
        const lead = OG_CRM_SERVICE.getLeadById(state.leads, state.selectedLeadId);
        if (lead) { event.preventDefault(); openDeskWhatsApp(lead); }
      }
      if (event.key.toLowerCase() === 'a') { event.preventDefault(); document.querySelector('.sales-desk-actions summary')?.click(); }
    });
    setInterval(updateDayClock, 30000);
  }

  function buildCommercialPanel(lead) {
    const interactions = lead.interactions.slice().reverse().slice(0, 8);
    return `
      <section class="border-t border-slate-800 pt-4 og-commercial-form" aria-label="Contexto comercial do cliente">
        <div><span class="og-kicker">COPILOTO COMERCIAL</span><h3 class="font-bold text-sm text-slate-100 mt-1">Contexto, retorno e registro</h3></div>
        <div class="og-commercial-grid">
          <div class="og-field"><label for="lead-priority">Prioridade</label><select id="lead-priority"><option value="alta" ${lead.priority === 'alta' ? 'selected' : ''}>Alta</option><option value="media" ${lead.priority === 'media' ? 'selected' : ''}>Média</option><option value="baixa" ${lead.priority === 'baixa' ? 'selected' : ''}>Baixa</option></select></div>
          <div class="og-field"><label for="lead-fleet-size">Tamanho da frota</label><input id="lead-fleet-size" type="number" min="0" value="${escapeHtml(lead.fleetSize || '')}" placeholder="Ex.: 42"></div>
          <div class="og-field og-field-full"><label for="lead-pain">Dor confirmada ou hipótese a validar</label><textarea id="lead-pain" rows="2" placeholder="Ex.: desgaste irregular; confirmar custo por km">${escapeHtml(lead.pain)}</textarea></div>
          <div class="og-field"><label for="lead-decision-maker">Decisor</label><input id="lead-decision-maker" value="${escapeHtml(lead.decisionMaker)}" placeholder="Nome ou função"></div>
          <div class="og-field"><label for="lead-follow-up">Próximo retorno</label><input id="lead-follow-up" type="datetime-local" value="${escapeHtml(lead.followUpAt)}"></div>
          <div class="og-field og-field-full"><label for="lead-next-action">Próxima ação</label><input id="lead-next-action" value="${escapeHtml(lead.nextAction)}" placeholder="Ex.: ligar para validar a frota e apresentar proposta"></div>
        </div>
        <button id="btn-save-commercial-context" class="w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold">Salvar contexto e retorno</button>
        <div class="og-field"><label for="lead-interaction-note">Nota rápida após conversa</label><textarea id="lead-interaction-note" rows="3" placeholder="O que o cliente confirmou? O que ficou combinado?"></textarea></div>
        <button id="btn-add-interaction" class="w-full px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Registrar conversa agora</button>
        <div><span class="og-kicker">HISTÓRICO RECENTE</span><div class="og-interaction-list mt-2">${interactions.length ? interactions.map(item => `<article class="og-interaction"><time>${escapeHtml(new Date(item.at).toLocaleString('pt-BR'))}</time><p>${escapeHtml(item.note)}</p></article>`).join('') : '<div class="text-xs text-slate-500">Nenhuma conversa registrada.</div>'}</div></div>
      </section>`;
  }

  function bindCommercialPanel(lead) {
    const saveButton = document.getElementById('btn-save-commercial-context');
    const addButton = document.getElementById('btn-add-interaction');
    if (saveButton) saveButton.addEventListener('click', () => {
      lead.priority = document.getElementById('lead-priority').value;
      lead.fleetSize = Math.max(0, Number(document.getElementById('lead-fleet-size').value) || 0);
      lead.pain = document.getElementById('lead-pain').value.trim();
      lead.decisionMaker = document.getElementById('lead-decision-maker').value.trim();
      lead.followUpAt = document.getElementById('lead-follow-up').value;
      lead.nextAction = document.getElementById('lead-next-action').value.trim();
      saveLeadsToStorage();
      renderLeadsTable();
      showNotification('Contexto e próximo retorno salvos.', 'success');
    });
    if (addButton) addButton.addEventListener('click', () => {
      const note = document.getElementById('lead-interaction-note').value.trim();
      if (!note) return showNotification('Escreva uma nota curta antes de registrar.', 'info');
      const now = new Date().toISOString();
      lead.interactions.push({ id: `INT-${Date.now()}`, at: now, type: 'conversa', note });
      state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, { id: newLibraryId('evt'), type: 'interaction.recorded', at: now, clientId: lead.id, interactionType: 'conversation' });
      lead.lastContactAt = now;
      if (lead.status === 'novo') lead.status = 'contatado';
      saveLeadsToStorage();
      saveOperationsToStorage();
      renderLeadsTable();
      renderLeadInspector();
      showNotification('Conversa registrada no histórico.', 'success');
    });
  }

  // =========================================================================
  // CRM, OCR E IMPORTAÇÃO DE LEADS
  // =========================================================================

  function initCrmEvents() {
    const filterSelect = document.getElementById('crm-status-filter');
    const searchInput = document.getElementById('crm-search-input');
    const btnImportModal = document.getElementById('btn-crm-import-modal');
    const modalImport = document.getElementById('modal-import-leads');
    const btnCloseModal = document.getElementById('btn-close-modal-import');
    const btnProcessImport = document.getElementById('btn-process-import');
    const textareaImport = document.getElementById('textarea-leads-import');
    const fileImportInput = document.getElementById('file-leads-import');
    const btnExportCsv = document.getElementById('btn-crm-export-csv');
    const btnClearAllLeads = document.getElementById('btn-crm-clear-all');
    const selectAllCheckbox = document.getElementById('crm-select-all-checkbox');
    const btnBatchDelete = document.getElementById('btn-batch-delete');
    const btnBatchCancel = document.getElementById('btn-batch-cancel');

    if (filterSelect) filterSelect.addEventListener('change', (e) => { state.leadFilterStatus = e.target.value; renderLeadsTable(); });
    if (searchInput) searchInput.addEventListener('input', (e) => { state.leadSearchQuery = e.target.value.toLowerCase().trim(); renderLeadsTable(); });
    if (btnImportModal && modalImport) btnImportModal.addEventListener('click', () => modalImport.classList.remove('hidden'));
    if (btnCloseModal && modalImport) btnCloseModal.addEventListener('click', () => modalImport.classList.add('hidden'));

    if (fileImportInput) {
      fileImportInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => { if (textareaImport) textareaImport.value = evt.target.result; };
        reader.readAsText(file);
      });
    }

    if (btnProcessImport && textareaImport) {
      btnProcessImport.addEventListener('click', () => {
        const rawText = textareaImport.value.trim();
        if (!rawText) return;
        const count = parseAndAddLeads(rawText);
        textareaImport.value = '';
        if (modalImport) modalImport.classList.add('hidden');
        saveLeadsToStorage();
        renderLeadsTable();
        showNotification(`${count} leads importados com sucesso!`, 'success');
      });
    }

    if (btnExportCsv) btnExportCsv.addEventListener('click', () => exportLeadsCsv());

    if (btnClearAllLeads) {
      btnClearAllLeads.addEventListener('click', () => {
        if (state.leads.length === 0) return;
        if (confirm('Deseja realmente limpar TODOS os leads?')) {
          state.leads = [];
          state.selectedLeadIds.clear();
          state.selectedLeadId = null;
          saveLeadsToStorage();
          renderLeadsTable();
          renderLeadInspector();
          showNotification('Todos os leads foram removidos.', 'info');
        }
      });
    }

    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const visibleLeads = getFilteredLeads();
        if (isChecked) {
          visibleLeads.forEach(l => state.selectedLeadIds.add(l.id));
        } else {
          state.selectedLeadIds.clear();
        }
        renderLeadsTable();
      });
    }

    if (btnBatchDelete) {
      btnBatchDelete.addEventListener('click', () => {
        const count = state.selectedLeadIds.size;
        if (count === 0) return;
        if (confirm(`Excluir os ${count} leads selecionados?`)) {
          state.leads = state.leads.filter(l => !state.selectedLeadIds.has(l.id));
          state.selectedLeadIds.clear();
          saveLeadsToStorage();
          renderLeadsTable();
          renderLeadInspector();
          showNotification(`${count} leads excluídos!`, 'success');
        }
      });
    }

    if (btnBatchCancel) {
      btnBatchCancel.addEventListener('click', () => {
        state.selectedLeadIds.clear();
        renderLeadsTable();
      });
    }

    initOcrEngine();
  }

  function getFilteredLeads() {
    return state.leads.filter(lead => {
      const matchesStatus = state.leadFilterStatus === 'all' || lead.status === state.leadFilterStatus;
      const q = state.leadSearchQuery;
      const matchesQuery = !q ||
        (lead.nome && lead.nome.toLowerCase().includes(q)) ||
        (lead.empresa && lead.empresa.toLowerCase().includes(q)) ||
        (lead.telefone && lead.telefone.includes(q)) ||
        (lead.cnpj && lead.cnpj.includes(q)) ||
        (lead.cidadeUf && lead.cidadeUf.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }

  function renderCrmModule() {
    renderLeadsTable();
    if (state.leads.length > 0 && !state.selectedLeadId) {
      state.selectedLeadId = state.leads[0].id;
    }
    renderLeadInspector();
  }

  function renderLeadsTable() {
    const tbody = document.getElementById('crm-leads-tbody');
    const badgeCount = document.getElementById('crm-total-count-badge');
    const selectAllCheckbox = document.getElementById('crm-select-all-checkbox');
    const batchToolbar = document.getElementById('crm-batch-toolbar');
    const batchSelectedCount = document.getElementById('batch-selected-count');
    if (!tbody) return;

    const filtered = getFilteredLeads();
    if (badgeCount) badgeCount.textContent = `${filtered.length} leads`;

    const selCount = state.selectedLeadIds.size;
    if (batchToolbar && batchSelectedCount) {
      if (selCount > 0) {
        batchToolbar.classList.add('active');
        batchSelectedCount.textContent = `${selCount} selecionado${selCount > 1 ? 's' : ''}`;
      } else {
        batchToolbar.classList.remove('active');
      }
    }

    if (selectAllCheckbox) {
      selectAllCheckbox.checked = filtered.length > 0 && filtered.every(l => state.selectedLeadIds.has(l.id));
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12 text-slate-500 text-xs">
            <div class="text-slate-400 font-semibold mb-1">Nenhum lead encontrado</div>
            <div>Cole contatos ou use a transcrição de imagem com OCR!</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    filtered.forEach(lead => {
      const tr = document.createElement('tr');
      const isSelected = lead.id === state.selectedLeadId;
      const isChecked = state.selectedLeadIds.has(lead.id);

      tr.className = `border-b border-slate-800/50 cursor-pointer transition text-xs ${isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'}`;

      const statusObj = OG_DATA.leadStatuses.find(s => s.id === lead.status) || OG_DATA.leadStatuses[0];
      const segObj = OG_DATA.segments.find(s => s.id === lead.segmentId) || { name: 'Geral', icon: '🚛' };

      tr.innerHTML = `
        <td class="py-3 px-3 w-10 text-center" onclick="event.stopPropagation()">
          <input type="checkbox" data-lead-id="${lead.id}" ${isChecked ? 'checked' : ''} class="lead-row-checkbox w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500">
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-100 text-sm">${lead.empresa || lead.nome || 'Sem identificação'}</div>
          <div class="text-[11px] text-slate-400">Contato: <b>${lead.nome || '—'}</b></div>
        </td>
        <td class="py-3 px-3">
          <span class="font-mono text-slate-200 font-bold">${formatPhone(lead.telefone)}</span>
          ${lead.cnpj ? `<span class="block text-[10px] text-slate-400 font-mono">CNPJ: ${lead.cnpj}</span>` : ''}
        </td>
        <td class="py-3 px-3">
          <span class="text-slate-300 font-medium">${lead.cidadeUf || '—'}</span>
          <span class="text-[10px] text-slate-400 block">${segObj.icon} ${segObj.name}</span>
        </td>
        <td class="py-3 px-3 text-center">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusObj.color}">
            ${statusObj.label}
          </span>
        </td>
        <td class="py-3 px-3 text-right">
          <button data-id="${lead.id}" class="btn-select-lead px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition">
            Abrir →
          </button>
        </td>
      `;

      const chk = tr.querySelector('.lead-row-checkbox');
      chk.addEventListener('change', (e) => {
        if (e.target.checked) state.selectedLeadIds.add(lead.id);
        else state.selectedLeadIds.delete(lead.id);
        renderLeadsTable();
      });

      tr.addEventListener('click', () => {
        state.selectedLeadId = lead.id;
        renderLeadsTable();
        renderLeadInspector();
      });

      tbody.appendChild(tr);
    });
  }

  function renderLeadInspector() {
    const inspector = document.getElementById('crm-lead-inspector');
    if (!inspector) return;

    const lead = state.leads.find(l => l.id === state.selectedLeadId);
    if (!lead) {
      inspector.innerHTML = `
        <div class="text-center py-16 text-slate-500 text-xs">
          <div class="text-sm font-semibold text-slate-400">Nenhum lead selecionado</div>
          <div class="text-slate-500 mt-1">Selecione um cliente na tabela para pesquisar dados, ligar ou disparar propostas.</div>
        </div>
      `;
      return;
    }

    const cleanPhone = (lead.telefone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone) : '';
    const cleanCnpj = (lead.cnpj || '').replace(/\D/g, '');

    inspector.innerHTML = `
      <div class="space-y-4">
        
        <div class="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-700">${lead.id}</span>
              <h3 class="font-bold text-base text-slate-100">${lead.empresa || lead.nome}</h3>
            </div>
            <div class="text-xs text-slate-400 mt-0.5">Contato: <b class="text-slate-200">${lead.nome}</b> • 📍 ${lead.cidadeUf || 'Não informado'}</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button id="btn-apply-lead-quote" title="Gerar cotação para este lead" class="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1">
              ⚡ Cotar Agora
            </button>
            <button id="btn-delete-lead-single" title="Excluir este lead" class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-300">
            <span class="flex items-center gap-1.5 text-amber-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Pesquisas Rápidas da Empresa
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1">
            <a href="${cleanCnpj ? `https://cnpja.com/consulta/${cleanCnpj}` : `https://www.google.com/search?q=cnpj+${encodeURIComponent(lead.empresa || lead.nome)}`}" target="_blank" class="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center">
              <span>🏛️ CNPJ</span>
            </a>
            <a href="https://www.google.com/search?q=${encodeURIComponent((lead.empresa || lead.nome) + ' ' + (lead.cidadeUf || ''))}" target="_blank" class="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center">
              <span>🌐 Google</span>
            </a>
            <a href="https://www.google.com/maps/search/${encodeURIComponent((lead.empresa || lead.nome) + ' ' + (lead.cidadeUf || ''))}" target="_blank" class="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center">
              <span>📍 Maps</span>
            </a>
          </div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-slate-300">
            <span class="flex items-center gap-1.5 text-emerald-400">Disparador WhatsApp</span>
            <div class="flex items-center gap-2">
              <a href="tel:${cleanPhone}" class="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition">📞 Ligar</a>
              <a href="https://api.whatsapp.com/send?phone=${formattedPhone}" target="_blank" class="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition">🟢 Whats</a>
            </div>
          </div>

          <textarea id="crm-msg-preview" rows="4" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"></textarea>

          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-fire-whatsapp" class="flex-1 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition">
              <span>Disparar WhatsApp</span>
            </button>
            <button id="btn-copy-crm-msg" class="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition">
              Copiar
            </button>
          </div>
        </div>

      </div>
    `;

    inspector.insertAdjacentHTML('beforeend', buildCommercialPanel(lead));
    bindCommercialPanel(lead);
    inspector.insertAdjacentHTML('beforeend', buildClientMaterialsPanel(lead, 'crm'));
    bindClientMaterialsPanel(inspector, lead);

    const previewTextarea = inspector.querySelector('#crm-msg-preview');
    if (previewTextarea) {
      previewTextarea.value = `🐾 *OLHO DE GATO — PROPOSTA OFICIAL*\nOlá ${lead.nome || 'Amigo'}, tudo bem?\nPreparamos a proposta para *${lead.empresa || 'sua frota'}* com frete e instalação inclusos.\nPodemos formalizar o envio dos kits hoje?`;
    }

    const fireWhatsappBtn = inspector.querySelector('#btn-fire-whatsapp');
    if (fireWhatsappBtn) {
      fireWhatsappBtn.addEventListener('click', () => {
        const text = previewTextarea ? previewTextarea.value : '';
        if (!formattedPhone) return alert('Telefone inválido.');
        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
        showNotification('WhatsApp aberto. Registre a conversa somente depois do contato.', 'info');
      });
    }

    const copyMsgBtn = inspector.querySelector('#btn-copy-crm-msg');
    if (copyMsgBtn) {
      copyMsgBtn.addEventListener('click', () => {
        const text = previewTextarea ? previewTextarea.value : '';
        navigator.clipboard.writeText(text).then(() => showNotification('Mensagem copiada!', 'success'));
      });
    }

    const applyQuoteBtn = inspector.querySelector('#btn-apply-lead-quote');
    if (applyQuoteBtn) {
      applyQuoteBtn.addEventListener('click', () => {
        state.client.nome = lead.nome || '';
        state.client.empresa = lead.empresa || '';
        state.client.cnpj = lead.cnpj || '';
        state.client.telefone = lead.telefone || '';
        state.client.cidadeUf = lead.cidadeUf || '';
        state.client.segmentId = lead.segmentId || 'transportadora';

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('client-name', state.client.nome);
        setVal('client-company', state.client.empresa);
        setVal('client-cnpj', state.client.cnpj);
        setVal('client-phone', state.client.telefone);
        setVal('client-city', state.client.cidadeUf);

        switchTab('cotacao');
        recalculateQuote();
        showNotification(`Dados de ${lead.empresa || lead.nome} aplicados!`, 'success');
      });
    }

    const deleteLeadBtn = inspector.querySelector('#btn-delete-lead-single');
    if (deleteLeadBtn) {
      deleteLeadBtn.addEventListener('click', () => {
        if (confirm(`Excluir o lead "${lead.empresa || lead.nome}"?`)) {
          state.leads = state.leads.filter(l => l.id !== lead.id);
          state.selectedLeadIds.delete(lead.id);
          state.selectedLeadId = state.leads[0]?.id || null;
          saveLeadsToStorage();
          renderLeadsTable();
          renderLeadInspector();
          showNotification('Lead excluído.', 'info');
        }
      });
    }
  }

  function initOcrEngine() {
    const ocrInputFile = document.getElementById('ocr-input-file');
    const ocrDropzone = document.getElementById('ocr-dropzone');
    const ocrPromptInput = document.getElementById('ocr-prompt-input');
    const ocrPreviewImg = document.getElementById('ocr-preview-img');
    const ocrImageContainer = document.getElementById('ocr-image-container');
    const btnExecuteOcr = document.getElementById('btn-execute-ocr');
    const ocrProgressContainer = document.getElementById('ocr-progress-container');
    const ocrProgressBar = document.getElementById('ocr-progress-bar');
    const ocrProgressText = document.getElementById('ocr-progress-text');
    const ocrResultContainer = document.getElementById('ocr-result-container');
    const ocrExtractedTextarea = document.getElementById('ocr-extracted-textarea');
    const btnImportOcrLeads = document.getElementById('btn-import-ocr-leads');
    const presetButtons = document.querySelectorAll('.btn-ocr-preset');

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.getAttribute('data-preset');
        const presetObj = OG_DATA.ocrPresets.find(p => p.id === presetId);
        if (presetObj && ocrPromptInput) {
          ocrPromptInput.value = presetObj.prompt;
          presetButtons.forEach(b => b.classList.remove('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40'));
          btn.classList.add('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
        }
      });
    });

    function handleImage(file) {
      if (!file || !file.type.startsWith('image/')) return alert('Selecione uma imagem válida.');
      const reader = new FileReader();
      reader.onload = (e) => {
        state.ocrImageBase64 = e.target.result;
        if (ocrPreviewImg && ocrImageContainer) {
          ocrPreviewImg.src = e.target.result;
          ocrImageContainer.classList.remove('hidden');
        }
      };
      reader.readAsDataURL(file);
    }

    if (ocrInputFile) ocrInputFile.addEventListener('change', (e) => handleImage(e.target.files[0]));

    if (ocrDropzone) {
      ocrDropzone.addEventListener('dragover', (e) => { e.preventDefault(); ocrDropzone.classList.add('dragover'); });
      ocrDropzone.addEventListener('dragleave', () => ocrDropzone.classList.remove('dragover'));
      ocrDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        ocrDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
      });
    }

    window.addEventListener('paste', (e) => {
      if (state.currentTab === 'crm' && e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            handleImage(items[i].getAsFile());
            showNotification('Imagem colada!', 'info');
            break;
          }
        }
      }
    });

    if (btnExecuteOcr) {
      btnExecuteOcr.addEventListener('click', async () => {
        if (!state.ocrImageBase64) return alert('Carregue uma imagem primeiro.');
        const promptText = (ocrPromptInput ? ocrPromptInput.value : '').trim();

        if (ocrProgressContainer) ocrProgressContainer.classList.remove('hidden');
        if (btnExecuteOcr) btnExecuteOcr.disabled = true;

        try {
          updateOcrProgress(15, 'Carregando motor OCR...');
          if (typeof Tesseract === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
          }

          updateOcrProgress(40, 'Reconhecendo texto na imagem...');
          const worker = await Tesseract.createWorker('por');
          const ret = await worker.recognize(state.ocrImageBase64);
          await worker.terminate();

          updateOcrProgress(80, 'Processando campos solicitados...');
          const processed = processOcrTextWithInstruction(ret.data.text, promptText);
          state.ocrExtractedText = processed;

          if (ocrExtractedTextarea) ocrExtractedTextarea.value = processed;
          if (ocrResultContainer) ocrResultContainer.classList.remove('hidden');
          updateOcrProgress(100, 'Concluído!');
          setTimeout(() => { if (ocrProgressContainer) ocrProgressContainer.classList.add('hidden'); }, 1200);
        } catch (err) {
          alert('Erro no OCR: ' + err.message);
          if (ocrProgressContainer) ocrProgressContainer.classList.add('hidden');
        } finally {
          if (btnExecuteOcr) btnExecuteOcr.disabled = false;
        }
      });
    }

    if (btnImportOcrLeads && ocrExtractedTextarea) {
      btnImportOcrLeads.addEventListener('click', () => {
        const text = ocrExtractedTextarea.value.trim();
        if (!text) return alert('Nenhum texto para importar.');
        const count = parseAndAddLeads(text);
        saveLeadsToStorage();
        renderLeadsTable();
        const modalImport = document.getElementById('modal-import-leads');
        if (modalImport) modalImport.classList.add('hidden');
        showNotification(`${count} leads transcritos e importados!`, 'success');
      });
    }

    function updateOcrProgress(percent, label) {
      if (ocrProgressBar) ocrProgressBar.style.width = `${percent}%`;
      if (ocrProgressText) ocrProgressText.textContent = label;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar script OCR'));
      document.head.appendChild(script);
    });
  }

  function processOcrTextWithInstruction(rawText, instruction) {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2);
    const lowerInst = instruction.toLowerCase();
    const isOnlyNameAndCode = lowerInst.includes('nome') && lowerInst.includes('código') && !lowerInst.includes('cnpj') && !lowerInst.includes('telefone');
    let results = [];

    lines.forEach(line => {
      if (line.includes('WhatsApp') || line.includes('Online') || line.startsWith('http')) return;
      const cnpjMatch = line.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
      const phoneMatch = line.match(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/);
      const eqCodeMatch = line.match(/EQ-?\d{3,4}[A-Z]?/i);
      const numCodeMatch = line.match(/\b\d{3,5}\b/);

      let cleanName = line
        .replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, '')
        .replace(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g, '')
        .replace(/EQ-?\d{3,4}[A-Z]?/gi, '')
        .replace(/[;,\-|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (isOnlyNameAndCode) {
        const foundCode = eqCodeMatch ? eqCodeMatch[0].toUpperCase() : (numCodeMatch ? numCodeMatch[0] : 'COD-' + Math.floor(100 + Math.random() * 900));
        if (cleanName.length > 2) results.push(`${cleanName}; Cód: ${foundCode}`);
      } else {
        let entryParts = [];
        if (cleanName) entryParts.push(cleanName);
        if (phoneMatch) entryParts.push(phoneMatch[0]);
        if (cnpjMatch) entryParts.push(cnpjMatch[0]);
        if (eqCodeMatch) entryParts.push(`Peça: ${eqCodeMatch[0].toUpperCase()}`);
        if (entryParts.length > 0) results.push(entryParts.join('; '));
      }
    });

    return results.length > 0 ? results.join('\n') : rawText;
  }

  function parseAndAddLeads(rawText) {
    const lines = rawText.split(/\r?\n/);
    let addedCount = 0;

    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('Nome,') || line.startsWith('Empresa,')) return;

      let parts = line.split(/[;,|\t]/);
      if (parts.length < 2) parts = line.split(/ - /);

      let nome = '';
      let empresa = '';
      let telefone = '';
      let cnpj = '';
      let cidadeUf = '';
      let segmento = 'transportadora';

      const cnpjMatch = line.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
      if (cnpjMatch) cnpj = cnpjMatch[0];

      const phoneMatch = line.match(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/);
      if (phoneMatch) telefone = phoneMatch[0].replace(/\D/g, '');

      if (parts.length >= 2) {
        nome = parts[0].trim();
        empresa = parts[1] ? parts[1].trim() : '';
        if (parts[2] && !telefone) telefone = parts[2].replace(/\D/g, '');
        if (parts[3]) cidadeUf = parts[3].trim();
      } else {
        nome = line.slice(0, 35);
      }

      state.leads.unshift(normalizeLead({
        id: 'LEAD-' + (state.leads.length + addedCount + 101),
        nome: nome || 'Contato',
        empresa: empresa || nome,
        telefone: telefone || '',
        cnpj: cnpj || '',
        cidadeUf: cidadeUf || '',
        segmentId: segmento,
        status: 'novo',
        observacoes: 'Cadastrado em ' + new Date().toLocaleDateString('pt-BR'),
        createdDate: new Date().toISOString()
      }));

      addedCount++;
    });

    return addedCount;
  }

  // =========================================================================
  // CALL AI — ASSISTENTE COMERCIAL DE LIGAÇÕES (MANUAL + SALES BRAIN LOCAL)
  // =========================================================================
  const callObjectives = {
    primeiro_contato: 'Primeiro contato', qualificacao: 'Qualificação', diagnostico: 'Diagnóstico',
    retorno: 'Retorno de contato anterior', followup_proposta: 'Follow-up de proposta',
    negociacao: 'Negociação', proximo_passo: 'Fechamento de próximo passo', pos_venda: 'Pós-venda',
    expansao: 'Expansão', indicacao: 'Pedido de indicação'
  };

  function normalizeCallSearch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function callLead() {
    return state.leads.find(lead => String(lead.id) === String(state.callAI.selectedLeadId)) || null;
  }

  function suggestCallObjective(lead) {
    if (!lead || lead.status === 'novo') return 'primeiro_contato';
    if (lead.status === 'proposta_enviada') return 'followup_proposta';
    if (lead.status === 'negociacao') return 'negociacao';
    if (lead.pain) return 'retorno';
    return 'diagnostico';
  }

  function formatCallDate(value) {
    if (!value) return 'Não informado';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function renderCallSearchResults(matches, activeIndex = 0) {
    const box = document.getElementById('call-ai-search-results');
    const input = document.getElementById('call-ai-client-search');
    if (!box || !input) return;
    if (!matches.length) {
      box.innerHTML = '<div class="call-ai-no-result">Nenhum cliente encontrado. Cadastre no CRM ou ajuste a pesquisa.</div>';
      box.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      return;
    }
    box.innerHTML = matches.map((lead, index) => `
      <button type="button" role="option" aria-selected="${index === activeIndex}" class="${index === activeIndex ? 'active' : ''}" data-call-client="${escapeHtml(lead.id)}">
        <strong>${escapeHtml(lead.empresa || lead.nome || 'Cliente sem nome')}</strong>
        <span>${escapeHtml(lead.nome || 'Contato não informado')} · ${escapeHtml(lead.cidadeUf || 'Local não informado')}</span>
        <small>${escapeHtml(lead.status || 'novo')} · último contato: ${escapeHtml(formatCallDate(lead.lastContactAt))} · ${escapeHtml(lead.nextAction || 'sem próxima ação')}</small>
      </button>`).join('');
    box.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
    box.querySelectorAll('[data-call-client]').forEach(button => button.addEventListener('click', () => selectCallClient(button.dataset.callClient)));
  }

  function selectCallClient(id) {
    const currentNotes = document.getElementById('call-ai-notes')?.value.trim();
    if (state.callAI.selectedLeadId && String(state.callAI.selectedLeadId) !== String(id) && currentNotes) {
      if (!window.confirm('Existem anotações não salvas desta conta. Deseja descartá-las e trocar de cliente?')) return;
    }
    const lead = state.leads.find(item => String(item.id) === String(id));
    if (!lead) return;
    state.callAI = { ...state.callAI, selectedLeadId: lead.id, objective: suggestCallObjective(lead), script: [], step: 0, completed: [], notes: '', signals: [], sources: [], sessionId: null };
    const objective = document.getElementById('call-ai-objective');
    if (objective) objective.value = state.callAI.objective;
    const input = document.getElementById('call-ai-client-search');
    if (input) input.value = lead.empresa || lead.nome || '';
    document.getElementById('call-ai-search-results')?.classList.add('hidden');
    input?.setAttribute('aria-expanded', 'false');
    document.getElementById('call-ai-prepare')?.removeAttribute('disabled');
    renderCallAIContext();
  }

  function factRow(label, value, status = 'confirmed', source = 'CRM') {
    return `<div class="call-ai-fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || 'Não informado')}</strong><small data-status="${status}">${status === 'confirmed' ? 'Confirmado' : status === 'hypothesis' ? 'Hipótese a validar' : 'Não informado'} · ${escapeHtml(source)}</small></div>`;
  }

  function renderCallAIContext() {
    const lead = callLead();
    const context = document.getElementById('call-ai-client-context');
    if (!context || !lead) return;
    const recent = lead.interactions?.slice().sort((a, b) => Date.parse(b.at || 0) - Date.parse(a.at || 0))[0];
    context.innerHTML = `
      <div class="call-ai-account"><strong>${escapeHtml(lead.empresa || lead.nome)}</strong><span>${escapeHtml(lead.nome || 'Contato não informado')} · ${escapeHtml(lead.cidadeUf || 'Local não informado')}</span></div>
      ${factRow('Segmento', lead.segmentId, lead.segmentId ? 'confirmed' : 'missing')}
      ${factRow('Frota', lead.fleetSize ? `${lead.fleetSize} veículos` : '', lead.fleetSize ? 'confirmed' : 'missing')}
      ${factRow('Decisor', lead.decisionMaker, lead.decisionMaker ? 'confirmed' : 'missing')}
      ${factRow('Dor', lead.pain, lead.pain ? 'confirmed' : 'hypothesis')}
      ${factRow('Situação', lead.status || 'novo')}
      ${factRow('Última interação', recent?.note || '', recent ? 'confirmed' : 'missing', recent ? formatCallDate(recent.at) : 'CRM')}
      ${factRow('Próxima ação', lead.nextAction, lead.nextAction ? 'confirmed' : 'missing')}
      ${buildClientMaterialsPanel(lead, 'call-ai')}`;
    bindClientMaterialsPanel(context, lead);
    document.getElementById('call-ai-session-account').textContent = lead.empresa || lead.nome;
  }

  function safeKnowledgeText(record) {
    const caution = /requer validação|premissa/i.test(record.status || '') || /não garantir|não prometer/i.test(record.text || '');
    return { text: record.text, caution };
  }

  function buildCallScript(lead, objective, knowledge) {
    const company = lead.empresa || 'a empresa';
    const contact = lead.nome || 'você';
    const knownPain = lead.pain?.trim();
    const decision = lead.decisionMaker?.trim();
    const lastAction = lead.nextAction?.trim();
    const knowledgePoint = knowledge.find(item => !safeKnowledgeText(item).caution) || knowledge[0];
    const solutionText = knowledgePoint
      ? `Pelo que você me contou, posso relacionar isso a ${knowledgePoint.title.toLowerCase()}. Quero validar a aplicação antes de falar em resultado.`
      : 'Posso explicar como o equalizador ajuda na inspeção e na equalização do rodado, depois de confirmar a aplicação correta.';
    const opening = objective === 'primeiro_contato'
      ? `Olá, ${contact}. Aqui é o Lucas, da Olho de Gato. Posso usar dois minutos para entender como a ${company} controla a calibragem e o desgaste dos pneus?`
      : `Olá, ${contact}. Aqui é o Lucas, da Olho de Gato. Estou retomando nosso contato sobre ${lastAction || knownPain || 'a operação da frota'}. Continua sendo um bom momento para conversarmos?`;
    return [
      { title: 'Abertura', speech: opening, question: 'Você consegue falar por dois minutos agora?', observe: 'Confirme disponibilidade e cargo. Não avance se a pessoa estiver sem tempo.', branches: ['Se sim: contextualize o motivo.', 'Se não: combine dia e horário exatos.'] },
      { title: 'Contextualização', speech: `Quero entender a realidade da ${company} antes de sugerir qualquer aplicação.`, question: lastAction ? `O que mudou desde que combinamos: “${lastAction}”?` : 'Como vocês fazem hoje a conferência de pressão nos rodados?', observe: 'Separe processo atual de opinião. Registre quem executa e com que frequência.', branches: ['Processo claro: aprofunde falhas e custo.', 'Processo informal: descubra frequência e responsável.'] },
      { title: 'Diagnóstico', speech: knownPain ? `Você já mencionou “${knownPain}”. Quero confirmar se isso continua acontecendo.` : 'Para eu não presumir o problema, preciso entender onde existe perda hoje.', question: knownPain ? 'Com que frequência isso acontece e em quais veículos?' : 'Qual problema com pneus ou calibragem mais incomoda a operação hoje?', observe: knownPain ? 'Valide uma informação já registrada; não a trate como atual sem confirmação.' : 'Busque situação, frequência e evidência.', branches: ['Dor confirmada: quantifique o impacto.', 'Sem dor clara: investigue rotina e exceções.'] },
      { title: 'Exploração do impacto', speech: 'Quero colocar esse problema em uma medida que faça sentido para vocês.', question: 'Quando isso acontece, qual é o impacto em pneu, combustível, manutenção ou disponibilidade?', observe: 'Peça números somente se o cliente souber. Não invente custo, economia ou urgência.', branches: ['Tem números: confirme período e fonte.', 'Não tem números: registre a lacuna para calcular depois.'] },
      { title: 'Conexão com a solução', speech: solutionText, question: 'Faz sentido avaliarmos a aplicação em um veículo ou conjunto específico?', observe: knowledgePoint ? `Fonte: ${knowledgePoint.id} · ${knowledgePoint.source} · ${knowledgePoint.status}` : 'Sales Brain indisponível; permaneça no diagnóstico.', branches: ['Faz sentido: defina veículo, eixo e pressão.', 'Dúvida técnica: leve para validação antes da proposta.'] },
      { title: 'Tratamento de objeção', speech: 'Entendi. Antes de responder, quero separar se a preocupação é investimento, aplicação ou prioridade.', question: 'Qual desses pontos pesa mais para você agora?', observe: 'Não rebata de imediato. Classifique a objeção e aprofunde uma vez.', branches: ['Preço: volte ao custo do problema sem prometer retorno.', 'Concorrente: investigue satisfação e diferença esperada.'] },
      { title: 'Próximo passo', speech: 'Para não deixar isso solto, proponho sairmos com uma ação simples e responsável definido.', question: decision ? `Além de ${decision}, quem precisa participar do próximo passo?` : 'Quem mais precisa participar da avaliação e qual é o próximo passo mais útil?', observe: 'Combine ação, responsável e data. Proposta sem diagnóstico não é avanço.', branches: ['Há decisor: agende a próxima conversa.', 'Falta informação: combine o envio ou levantamento.'] },
      { title: 'Encerramento', speech: 'Vou resumir para confirmar se entendi corretamente antes de encerrar.', question: 'O resumo está correto e podemos seguir com o próximo passo combinado?', observe: 'Repita apenas fatos confirmados. Depois encerre a sessão e revise antes de salvar.', branches: ['Confirmado: registre no CRM.', 'Correção: ajuste as anotações antes de salvar.'] }
    ];
  }

  async function prepareCallAIScript() {
    const lead = callLead();
    if (!lead) return showNotification('Selecione um cliente antes de preparar o roteiro.', 'info');
    state.callAI.objective = document.getElementById('call-ai-objective').value;
    const button = document.getElementById('call-ai-prepare');
    button.disabled = true;
    button.textContent = 'Preparando…';
    let results = [];
    try {
      const response = await apiFetch('/api/knowledge/search', {
        method: 'POST',
        body: JSON.stringify({ query: `${lead.segmentId} ${lead.pain} ${lead.status}`, objective: callObjectives[state.callAI.objective], tags: ['diagnóstico', 'objeções', 'abordagem'], limit: 6 })
      });
      if (response.ok) results = (await response.json()).results || [];
    } catch (error) {
      console.warn('Sales Brain indisponível', error);
    }
    state.callAI.sources = results;
    state.callAI.script = buildCallScript(lead, state.callAI.objective, results);
    state.callAI.step = 0;
    state.callAI.completed = [];
    state.callAI.sessionId = `CALL-${Date.now()}`;
    document.getElementById('call-ai-empty').classList.add('hidden');
    document.getElementById('call-ai-workspace').classList.remove('hidden');
    document.getElementById('call-ai-footer').classList.remove('hidden');
    document.getElementById('call-ai-session-state').textContent = `${callObjectives[state.callAI.objective]} · modo manual`;
    renderCallAIStep();
    renderCallAISources();
    button.disabled = false;
    button.textContent = 'Atualizar roteiro';
  }

  function saveCurrentCallSpeech() {
    if (!state.callAI.script.length) return;
    state.callAI.script[state.callAI.step].speech = document.getElementById('call-ai-speech')?.textContent.trim() || state.callAI.script[state.callAI.step].speech;
  }

  function renderCallAIStep() {
    const item = state.callAI.script[state.callAI.step];
    if (!item) return;
    document.getElementById('call-ai-step-label').textContent = `ETAPA ${state.callAI.step + 1} DE ${state.callAI.script.length}`;
    document.getElementById('call-ai-step-title').textContent = item.title;
    const speech = document.getElementById('call-ai-speech');
    speech.textContent = item.speech;
    speech.style.fontSize = `${state.callAI.fontSize}em`;
    document.getElementById('call-ai-question').textContent = item.question;
    document.getElementById('call-ai-observe').textContent = item.observe;
    document.getElementById('call-ai-branches').innerHTML = item.branches.map(branch => `<p>${escapeHtml(branch)}</p>`).join('');
    document.getElementById('call-ai-progress-bar').style.width = `${((state.callAI.step + 1) / state.callAI.script.length) * 100}%`;
    document.getElementById('call-ai-prev').disabled = state.callAI.step === 0;
    document.getElementById('call-ai-next').disabled = state.callAI.step === state.callAI.script.length - 1;
    const complete = state.callAI.completed.includes(state.callAI.step);
    document.getElementById('call-ai-complete').classList.toggle('done', complete);
    document.getElementById('call-ai-complete').textContent = complete ? '✓ Etapa concluída' : '✓ Marcar etapa';
  }

  function renderCallAISources() {
    const target = document.getElementById('call-ai-sources');
    if (!target) return;
    target.innerHTML = state.callAI.sources.length ? `<strong>Fontes consultadas</strong>${state.callAI.sources.map(item => {
      const caution = safeKnowledgeText(item).caution;
      return `<details><summary>${escapeHtml(item.id)} · ${escapeHtml(item.title)}</summary><p>${escapeHtml(item.text)}</p><small class="${caution ? 'caution' : ''}">${escapeHtml(item.status)} · ${escapeHtml(item.source)} · ${escapeHtml(item.locator)}</small></details>`;
    }).join('')}` : '<small>Sales Brain indisponível. O roteiro usa somente o CRM e perguntas seguras.</small>';
  }

  const callSignalResponses = {
    sem_tempo: ['Entendi. Vamos ser objetivos e combinar um horário melhor.', 'Qual dia e horário funciona para retomarmos por dez minutos?'],
    concorrente: ['Ótimo, então vocês já valorizam esse tipo de controle. Quero entender o que funciona e o que ainda poderia melhorar.', 'O que você mais gosta na solução atual e onde ela ainda deixa espaço para melhoria?'],
    caro: ['Entendi a preocupação com investimento. Antes de comparar preço, precisamos medir o custo do problema e confirmar a aplicação.', 'O valor preocupa mais pelo orçamento disponível ou porque o retorno ainda não ficou claro?'],
    outro_decisor: ['Perfeito. Faz sentido envolver essa pessoa para não perdermos informação.', 'Qual é o papel dela e qual seria a melhor forma de fazermos a próxima conversa juntos?'],
    proposta: ['Posso preparar uma proposta, mas quero garantir que ela reflita a aplicação correta.', 'Quais veículos, eixos e quantidades precisam entrar nesta primeira avaliação?'],
    material: ['Envio o material certo para o seu cenário, sem sobrecarregar você com informação.', 'Qual ponto você precisa mostrar internamente: aplicação, funcionamento ou justificativa financeira?'],
    sem_interesse: ['Entendi. Não quero insistir sem motivo.', 'É uma questão de momento, prioridade ou a solução não se encaixa na operação?']
  };

  function suggestCallAdaptation(signal) {
    const response = callSignalResponses[signal];
    if (!response) return;
    state.callAI.signals.push({ signal, at: new Date().toISOString() });
    const pending = document.getElementById('call-ai-suggestion-pending');
    pending.innerHTML = `<strong>Sugestão para o próximo momento</strong><p>${escapeHtml(response[0])}</p><p><b>Pergunta:</b> ${escapeHtml(response[1])}</p><button type="button" id="call-ai-apply-suggestion">Aplicar ao próximo bloco</button>`;
    pending.classList.remove('hidden');
    document.getElementById('call-ai-apply-suggestion').addEventListener('click', () => {
      const next = Math.min(state.callAI.step + 1, state.callAI.script.length - 1);
      state.callAI.script[next] = { ...state.callAI.script[next], speech: response[0], question: response[1] };
      pending.classList.add('hidden');
      showNotification('Sugestão aplicada ao próximo bloco.', 'success');
    });
  }

  function openCallAIReview() {
    saveCurrentCallSpeech();
    const lead = callLead();
    const notes = document.getElementById('call-ai-notes').value.trim();
    state.callAI.notes = notes;
    document.getElementById('call-ai-summary').value = notes || `Ligação com ${lead?.empresa || lead?.nome || 'cliente'} sobre ${callObjectives[state.callAI.objective]}.`;
    document.getElementById('call-ai-next-action').value = lead?.nextAction || '';
    document.getElementById('call-ai-follow-up').value = lead?.followUpAt || '';
    document.getElementById('call-ai-change-preview').innerHTML = `<strong>Prévia das alterações</strong><p>Histórico: será acrescentado somente após sua aprovação.</p><p>Próxima ação: <del>${escapeHtml(lead?.nextAction || 'não informada')}</del> → valor revisado acima.</p><p>Retorno: <del>${escapeHtml(formatCallDate(lead?.followUpAt))}</del> → data revisada acima.</p>`;
    document.getElementById('call-ai-review').classList.remove('hidden');
    document.getElementById('call-ai-review').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function saveCallAIReview() {
    const lead = callLead();
    if (!lead) return;
    const result = document.getElementById('call-ai-result').value;
    const summary = document.getElementById('call-ai-summary').value.trim();
    if (!result || !summary) return showNotification('Informe o resultado e revise o resumo.', 'info');
    const sessionId = state.callAI.sessionId;
    if (lead.interactions.some(item => item.sessionId === sessionId)) return showNotification('Esta sessão já foi registrada.', 'info');
    const now = new Date().toISOString();
    const previousStatus = lead.status;
    lead.interactions.push({ id: `INT-${Date.now()}`, sessionId, at: now, type: 'call_ai', objective: state.callAI.objective, result, note: summary, signals: state.callAI.signals.map(item => item.signal) });
    if (result !== 'sem_contato') lead.lastContactAt = now;
    lead.nextAction = document.getElementById('call-ai-next-action').value.trim();
    lead.followUpAt = document.getElementById('call-ai-follow-up').value;
    if (result === 'proposta') lead.status = 'proposta_enviada';
    else if (result === 'negociacao') lead.status = 'negociacao';
    else if (result === 'contato_realizado' && lead.status === 'novo') lead.status = 'contatado';
    state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, { id: newLibraryId('evt'), type: 'call.saved', at: now, clientId: lead.id, callSessionId: sessionId, result });
    if (lead.status !== previousStatus) state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, { id: newLibraryId('evt'), type: 'client.stage_changed', at: now, clientId: lead.id, fromStage: previousStatus, toStage: lead.status });
    saveLeadsToStorage();
    saveOperationsToStorage();
    renderLeadsTable();
    document.getElementById('call-ai-review').classList.add('hidden');
    document.getElementById('call-ai-session-state').textContent = 'Sessão salva no CRM';
    showNotification('Ligação registrada no CRM após sua aprovação.', 'success');
  }

  function setCallRecordingStatus(message, mode = 'idle') {
    const status = document.getElementById('call-ai-recording-status');
    if (!status) return;
    status.dataset.state = mode;
    status.innerHTML = `<span aria-hidden="true">●</span> ${escapeHtml(message)}`;
  }

  function supportedRecordingMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return candidates.find(type => window.MediaRecorder?.isTypeSupported(type)) || '';
  }

  function releaseCallRecordingStreams() {
    state.callAI.recording.streams.forEach(stream => stream.getTracks().forEach(track => track.stop()));
    state.callAI.recording.streams = [];
    if (state.callAI.recording.audioContext) {
      state.callAI.recording.audioContext.close().catch(() => {});
      state.callAI.recording.audioContext = null;
    }
  }

  async function startCallRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      return showNotification('Este navegador não oferece gravação de áudio.', 'info');
    }
    const mode = document.getElementById('call-ai-audio-source').value;
    const startButton = document.getElementById('call-ai-record-start');
    const pauseButton = document.getElementById('call-ai-record-pause');
    const stopButton = document.getElementById('call-ai-record-stop');
    startButton.disabled = true;
    setCallRecordingStatus('Aguardando sua permissão…', 'requesting');
    try {
      let recordingStream;
      const streams = [];
      state.callAI.recording.streams = streams;
      if (mode === 'computer') {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streams.push(displayStream);
        if (!displayStream.getAudioTracks().length) {
          displayStream.getTracks().forEach(track => track.stop());
          throw new Error('A janela foi compartilhada sem áudio. Marque “Compartilhar áudio” e tente novamente.');
        }
        const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        streams.push(microphoneStream);
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContextClass();
        const destination = context.createMediaStreamDestination();
        context.createMediaStreamSource(displayStream).connect(destination);
        context.createMediaStreamSource(microphoneStream).connect(destination);
        recordingStream = destination.stream;
        state.callAI.recording.audioContext = context;
        displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (state.callAI.recording.recorder?.state !== 'inactive') stopCallRecording();
        });
      } else {
        const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        streams.push(microphoneStream);
        recordingStream = microphoneStream;
      }
      const mimeType = supportedRecordingMimeType();
      const recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);
      state.callAI.recording.streams = streams;
      state.callAI.recording.chunks = [];
      state.callAI.recording.recorder = recorder;
      state.callAI.recording.startedAt = new Date();
      recorder.addEventListener('dataavailable', event => { if (event.data?.size) state.callAI.recording.chunks.push(event.data); });
      recorder.addEventListener('stop', () => {
        const blob = new Blob(state.callAI.recording.chunks, { type: recorder.mimeType || 'audio/webm' });
        if (state.callAI.recording.url) URL.revokeObjectURL(state.callAI.recording.url);
        const url = URL.createObjectURL(blob);
        state.callAI.recording.url = url;
        const lead = callLead();
        const playback = document.getElementById('call-ai-recording-playback');
        const download = document.getElementById('call-ai-recording-download');
        playback.src = url;
        download.href = url;
        download.download = `ligacao-og-${normalizeCallSearch(lead?.empresa || lead?.nome || 'cliente').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.webm`;
        document.getElementById('call-ai-recording-result').classList.remove('hidden');
        setCallRecordingStatus(`Gravação pronta · ${(blob.size / 1024 / 1024).toFixed(1)} MB`, 'ready');
        releaseCallRecordingStreams();
        startButton.disabled = false;
        startButton.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        stopButton.classList.add('hidden');
      });
      recorder.start(1000);
      setCallRecordingStatus(mode === 'computer' ? 'Gravando áudio do PC + microfone' : 'Gravando microfone', 'recording');
      startButton.classList.add('hidden');
      pauseButton.classList.remove('hidden');
      stopButton.classList.remove('hidden');
      pauseButton.textContent = 'Pausar';
    } catch (error) {
      releaseCallRecordingStreams();
      startButton.disabled = false;
      setCallRecordingStatus(error?.message || 'Permissão negada ou gravação cancelada.', 'error');
      showNotification(error?.message || 'Não foi possível iniciar a gravação.', 'info');
    }
  }

  function toggleCallRecordingPause() {
    const recorder = state.callAI.recording.recorder;
    const button = document.getElementById('call-ai-record-pause');
    if (!recorder || recorder.state === 'inactive') return;
    if (recorder.state === 'recording') {
      recorder.pause();
      button.textContent = 'Continuar';
      setCallRecordingStatus('Gravação pausada', 'paused');
    } else if (recorder.state === 'paused') {
      recorder.resume();
      button.textContent = 'Pausar';
      setCallRecordingStatus('Gravando chamada', 'recording');
    }
  }

  function stopCallRecording() {
    const recorder = state.callAI.recording.recorder;
    if (!recorder || recorder.state === 'inactive') return;
    setCallRecordingStatus('Finalizando arquivo…', 'processing');
    recorder.stop();
  }

  function initCallAI() {
    const input = document.getElementById('call-ai-client-search');
    const results = document.getElementById('call-ai-search-results');
    let matches = [];
    let activeIndex = 0;
    input?.addEventListener('input', () => {
      const query = normalizeCallSearch(input.value);
      const digits = String(input.value).replace(/\D/g, '');
      matches = query.length < 2 && digits.length < 3 ? [] : state.leads.filter(lead => {
        const text = normalizeCallSearch([lead.empresa, lead.nome, lead.cidadeUf, lead.status].join(' '));
        const leadDigits = `${lead.telefone || ''}${lead.cnpj || ''}`.replace(/\D/g, '');
        return (query && text.includes(query)) || (digits.length >= 3 && leadDigits.includes(digits));
      }).slice(0, 8);
      activeIndex = 0;
      renderCallSearchResults(matches, activeIndex);
    });
    input?.addEventListener('keydown', event => {
      if (event.key === 'Escape') { results.classList.add('hidden'); input.setAttribute('aria-expanded', 'false'); return; }
      if (!matches.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        renderCallSearchResults(matches, activeIndex);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        selectCallClient(matches[activeIndex].id);
      }
    });
    document.getElementById('call-ai-objective')?.addEventListener('change', event => { state.callAI.objective = event.target.value; });
    document.getElementById('call-ai-prepare')?.addEventListener('click', prepareCallAIScript);
    document.getElementById('call-ai-change-client')?.addEventListener('click', () => { input.focus(); input.select(); });
    document.getElementById('call-ai-prev')?.addEventListener('click', () => { saveCurrentCallSpeech(); state.callAI.step = Math.max(0, state.callAI.step - 1); renderCallAIStep(); });
    document.getElementById('call-ai-next')?.addEventListener('click', () => { saveCurrentCallSpeech(); state.callAI.step = Math.min(state.callAI.script.length - 1, state.callAI.step + 1); renderCallAIStep(); });
    document.getElementById('call-ai-complete')?.addEventListener('click', () => { const step = state.callAI.step; state.callAI.completed = state.callAI.completed.includes(step) ? state.callAI.completed.filter(item => item !== step) : [...state.callAI.completed, step]; renderCallAIStep(); });
    document.getElementById('call-ai-copy')?.addEventListener('click', async () => { await navigator.clipboard.writeText(document.getElementById('call-ai-speech').textContent); showNotification('Fala copiada.', 'success'); });
    document.getElementById('call-ai-font-down')?.addEventListener('click', () => { state.callAI.fontSize = Math.max(.8, state.callAI.fontSize - .1); renderCallAIStep(); });
    document.getElementById('call-ai-font-up')?.addEventListener('click', () => { state.callAI.fontSize = Math.min(1.8, state.callAI.fontSize + .1); renderCallAIStep(); });
    document.getElementById('call-ai-focus')?.addEventListener('click', () => document.body.classList.toggle('call-ai-focus-mode'));
    document.querySelectorAll('[data-call-signal]').forEach(button => button.addEventListener('click', () => suggestCallAdaptation(button.dataset.callSignal)));
    document.getElementById('call-ai-ask-now')?.addEventListener('click', () => { const item = state.callAI.script[state.callAI.step]; if (item) showNotification(item.question, 'info'); });
    document.getElementById('call-ai-adapt-notes')?.addEventListener('click', () => { const notes = document.getElementById('call-ai-notes').value.trim(); if (!notes) return showNotification('Escreva uma anotação antes de adaptar.', 'info'); suggestCallAdaptation(notes.toLowerCase().includes('caro') ? 'caro' : notes.toLowerCase().includes('proposta') ? 'proposta' : 'outro_decisor'); });
    document.getElementById('call-ai-end')?.addEventListener('click', openCallAIReview);
    document.getElementById('call-ai-review-close')?.addEventListener('click', () => document.getElementById('call-ai-review').classList.add('hidden'));
    document.getElementById('call-ai-save')?.addEventListener('click', saveCallAIReview);
    document.getElementById('call-ai-record-start')?.addEventListener('click', startCallRecording);
    document.getElementById('call-ai-record-pause')?.addEventListener('click', toggleCallRecordingPause);
    document.getElementById('call-ai-record-stop')?.addEventListener('click', stopCallRecording);
    document.getElementById('call-ai-discard')?.addEventListener('click', () => { if (window.confirm('Descartar esta sessão sem alterar o CRM?')) { document.getElementById('call-ai-review').classList.add('hidden'); state.callAI.script = []; document.getElementById('call-ai-workspace').classList.add('hidden'); document.getElementById('call-ai-footer').classList.add('hidden'); document.getElementById('call-ai-empty').classList.remove('hidden'); } });
    document.getElementById('call-ai-reset')?.addEventListener('click', () => { if (window.confirm('Reiniciar o roteiro e manter apenas a conta selecionada?')) prepareCallAIScript(); });
    apiFetch('/api/knowledge/status').then(response => response.json()).then(info => {
      const badge = document.getElementById('call-ai-knowledge-status');
      badge.dataset.mode = info.available ? 'ready' : 'missing';
      badge.textContent = info.available ? `Sales Brain v${info.version} · ${info.stats.indexedRecords} trechos privados` : 'Sales Brain ausente · modo CRM';
    }).catch(() => { const badge = document.getElementById('call-ai-knowledge-status'); badge.dataset.mode = 'missing'; badge.textContent = 'Sales Brain indisponível · modo CRM'; });
    window.addEventListener('beforeunload', releaseCallRecordingStreams);
  }

  function saveLeadsToStorage() {
    try {
      localStorage.setItem('og_leads_crm', JSON.stringify(state.leads));
      scheduleServerSync();
    } catch (e) {
      console.error(e);
    }
  }

  function saveOperationsToStorage() {
    state.operations.updatedAt = new Date().toISOString();
    localStorage.setItem('og_operations_state', JSON.stringify(state.operations));
    scheduleServerSync();
  }

  const LIBRARY_TYPE_LABELS = { video: 'Vídeo', image: 'Imagem', pdf: 'PDF', presentation: 'Apresentação', audio: 'Áudio', link: 'Link', script: 'Script', message: 'Mensagem' };
  const LIBRARY_STATUS_LABELS = { draft: 'Rascunho', approved: 'Aprovado', outdated: 'Desatualizado', archived: 'Arquivado' };
  const LIBRARY_TYPE_ICONS = { video: '▶', image: '▧', pdf: 'PDF', presentation: '▤', audio: '♪', link: '↗', script: '“”', message: '✉' };
  let libraryPreviewUrl = null;

  function parseLibraryTags(value) {
    return [...new Set(String(value || '').split(',').map(item => item.trim()).filter(Boolean))].slice(0, 30);
  }

  function newLibraryId(prefix = 'mat') {
    return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
  }

  function librarySearchText(material) {
    return [material.title, material.description, material.origin, ...(material.segmentIds || []), ...(material.salesStages || []), ...(material.painTags || []), ...(material.objectionTags || []), ...(material.decisionMakerRoles || []), ...(material.productIds || []), ...(material.vehicleTypeIds || [])].join(' ').toLocaleLowerCase('pt-BR');
  }

  function filteredMaterials() {
    const query = state.library.query.toLocaleLowerCase('pt-BR').trim();
    return [...state.operations.materials].filter(material => {
      if (state.library.type !== 'all' && material.mediaType !== state.library.type) return false;
      if (state.library.status === 'active' && material.status === 'archived') return false;
      if (state.library.status !== 'all' && state.library.status !== 'active' && material.status !== state.library.status) return false;
      if (state.library.audience !== 'all' && material.audience !== state.library.audience) return false;
      if (state.library.favoritesOnly && !material.favorite) return false;
      return !query || librarySearchText(material).includes(query);
    }).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || String(b.lastOpenedAt || b.updatedAt).localeCompare(String(a.lastOpenedAt || a.updatedAt)));
  }

  function materialPermissionLabel(material) {
    return material.audience === 'customer_authorized' ? '✓ Autorizado para cliente' : '🔒 Uso interno';
  }

  function safeLibraryUrl(value) {
    try {
      const url = new URL(value, location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  function renderMaterialLibrary() {
    const gallery = document.getElementById('library-gallery');
    if (!gallery) return;
    const materials = filteredMaterials();
    document.getElementById('library-results-count').textContent = `${materials.length} ${materials.length === 1 ? 'material' : 'materiais'} · ${state.operations.materials.length} no total`;
    if (!materials.length) {
      gallery.innerHTML = `<div class="library-empty"><span>🎞️</span><h3>${state.operations.materials.length ? 'Nenhum material neste filtro' : 'Sua biblioteca começa aqui'}</h3><p>${state.operations.materials.length ? 'Ajuste a busca ou os filtros para localizar outro conteúdo.' : 'Cadastre o primeiro vídeo, imagem, PDF, link, áudio, roteiro ou mensagem.'}</p><button type="button" data-library-empty-new class="og-button og-button-primary">Cadastrar material</button></div>`;
      gallery.querySelector('[data-library-empty-new]')?.addEventListener('click', openMaterialEditor);
      return;
    }
    gallery.innerHTML = materials.map(material => `
      <article class="library-card" data-material-id="${escapeHtml(material.id)}">
        <button type="button" class="library-favorite ${material.favorite ? 'active' : ''}" data-library-action="favorite" aria-label="${material.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${Boolean(material.favorite)}">★</button>
        <button type="button" class="library-card-main" data-library-action="preview">
          <span class="library-media-icon" data-type="${escapeHtml(material.mediaType)}">${escapeHtml(LIBRARY_TYPE_ICONS[material.mediaType] || '◇')}</span>
          <span class="library-card-copy"><small>${escapeHtml(LIBRARY_TYPE_LABELS[material.mediaType] || material.mediaType)} · v${escapeHtml(material.contentVersion || '1.0')}</small><strong>${escapeHtml(material.title)}</strong><span>${escapeHtml(material.description || 'Sem descrição')}</span></span>
        </button>
        <div class="library-card-meta"><span data-status="${escapeHtml(material.status)}">${escapeHtml(LIBRARY_STATUS_LABELS[material.status] || material.status)}</span><span data-audience="${escapeHtml(material.audience)}">${escapeHtml(materialPermissionLabel(material))}</span></div>
        <div class="library-card-tags">${[...(material.segmentIds || []), ...(material.painTags || []), ...(material.vehicleTypeIds || [])].slice(0, 4).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="library-card-actions"><button type="button" data-library-action="edit">Editar</button><button type="button" data-library-action="preview">Visualizar</button></div>
      </article>`).join('');
  }

  function openMaterialEditor(material = null) {
    const editor = document.getElementById('library-editor');
    editor.classList.remove('hidden');
    document.getElementById('library-editor-title').textContent = material ? 'Editar material' : 'Cadastrar material';
    document.getElementById('library-material-id').value = material?.id || '';
    document.getElementById('library-title-input').value = material?.title || '';
    document.getElementById('library-type').value = material?.mediaType || 'video';
    document.getElementById('library-status').value = material?.status || 'draft';
    document.getElementById('library-description').value = material?.description || '';
    document.getElementById('library-file').value = '';
    document.getElementById('library-link').value = material?.externalUrl || '';
    document.getElementById('library-content').value = material?.textContent || '';
    document.getElementById('library-audience').value = material?.audience || 'internal';
    document.getElementById('library-version').value = material?.contentVersion || '1.0';
    document.getElementById('library-segments').value = (material?.segmentIds || []).join(', ');
    document.getElementById('library-stages').value = (material?.salesStages || []).join(', ');
    document.getElementById('library-pains').value = (material?.painTags || []).join(', ');
    document.getElementById('library-objections').value = (material?.objectionTags || []).join(', ');
    document.getElementById('library-decision-makers').value = (material?.decisionMakerRoles || []).join(', ');
    document.getElementById('library-products').value = (material?.productIds || []).join(', ');
    document.getElementById('library-vehicles').value = (material?.vehicleTypeIds || []).join(', ');
    document.getElementById('library-origin').value = material?.origin || '';
    document.getElementById('library-consent').value = material?.consentRef || '';
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('library-title-input').focus({ preventScroll: true });
  }

  function closeMaterialEditor() { document.getElementById('library-editor')?.classList.add('hidden'); }

  async function saveMaterial(event) {
    event.preventDefault();
    const id = document.getElementById('library-material-id').value || newLibraryId();
    const existingIndex = state.operations.materials.findIndex(item => item.id === id);
    const existing = existingIndex >= 0 ? state.operations.materials[existingIndex] : null;
    const audience = document.getElementById('library-audience').value;
    const consentRef = document.getElementById('library-consent').value.trim();
    if (audience === 'customer_authorized' && !consentRef) return showNotification('Informe a referência da autorização antes de liberar para cliente.', 'warning');
    const file = document.getElementById('library-file').files[0];
    let localAsset = existing?.localAsset || null;
    if (file) {
      try { localAsset = await OG_MATERIAL_STORE.put(id, file); }
      catch { return showNotification('Não foi possível guardar o arquivo neste aparelho.', 'warning'); }
    }
    const now = new Date().toISOString();
    const material = {
      id, title: document.getElementById('library-title-input').value.trim(), mediaType: document.getElementById('library-type').value,
      description: document.getElementById('library-description').value.trim(), status: document.getElementById('library-status').value,
      audience, consentRef: consentRef || null, contentVersion: document.getElementById('library-version').value.trim() || '1.0',
      externalUrl: document.getElementById('library-link').value.trim(), textContent: document.getElementById('library-content').value.trim(),
      segmentIds: parseLibraryTags(document.getElementById('library-segments').value), salesStages: parseLibraryTags(document.getElementById('library-stages').value),
      painTags: parseLibraryTags(document.getElementById('library-pains').value), objectionTags: parseLibraryTags(document.getElementById('library-objections').value),
      decisionMakerRoles: parseLibraryTags(document.getElementById('library-decision-makers').value), productIds: parseLibraryTags(document.getElementById('library-products').value),
      vehicleTypeIds: parseLibraryTags(document.getElementById('library-vehicles').value), origin: document.getElementById('library-origin').value.trim() || 'Não informada',
      localAsset, favorite: Boolean(existing?.favorite), createdAt: existing?.createdAt || now, updatedAt: now, schemaVersion: 1
    };
    state.operations = OG_OPERATIONS_MODEL.upsertMaterial(state.operations, material);
    state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, { id: newLibraryId('evt'), type: existing ? 'material.updated' : 'material.created', at: now, materialId: id });
    saveOperationsToStorage();
    closeMaterialEditor();
    renderMaterialLibrary();
    renderOperationsFoundation();
    showNotification(existing ? 'Material atualizado.' : 'Material cadastrado na biblioteca.', 'success');
  }

  async function openMaterialPreview(material) {
    material.lastOpenedAt = new Date().toISOString();
    saveOperationsToStorage();
    if (libraryPreviewUrl) { URL.revokeObjectURL(libraryPreviewUrl); libraryPreviewUrl = null; }
    let asset = null;
    if (material.localAsset?.id) {
      try { asset = await OG_MATERIAL_STORE.get(material.localAsset.id); } catch { asset = null; }
      if (asset?.blob) libraryPreviewUrl = URL.createObjectURL(asset.blob);
    }
    const dialog = document.createElement('div');
    dialog.className = 'library-preview-backdrop';
    dialog.innerHTML = `<section class="library-preview" role="dialog" aria-modal="true" aria-labelledby="library-preview-title"><header><div><span class="og-kicker">${escapeHtml(LIBRARY_TYPE_LABELS[material.mediaType] || material.mediaType)}</span><h2 id="library-preview-title">${escapeHtml(material.title)}</h2></div><button type="button" data-library-close aria-label="Fechar prévia">✕</button></header><div class="library-preview-media">${renderMaterialAsset(material, asset)}</div><div class="library-preview-info"><p>${escapeHtml(material.description || 'Sem descrição')}</p><div class="library-card-meta"><span data-status="${escapeHtml(material.status)}">${escapeHtml(LIBRARY_STATUS_LABELS[material.status] || material.status)}</span><span data-audience="${escapeHtml(material.audience)}">${escapeHtml(materialPermissionLabel(material))}</span></div><small>Fonte: ${escapeHtml(material.origin || 'Não informada')} · versão ${escapeHtml(material.contentVersion || '1.0')}</small></div><footer><button type="button" data-library-close>Fechar</button>${material.audience === 'customer_authorized' ? '<button type="button" data-library-prepare class="og-button og-button-primary">Preparar para cliente</button>' : '<span class="library-internal-warning">Conteúdo interno: não compartilhar com cliente</span>'}</footer></section>`;
    document.body.appendChild(dialog);
    const close = () => { if (libraryPreviewUrl) URL.revokeObjectURL(libraryPreviewUrl); libraryPreviewUrl = null; dialog.remove(); };
    dialog.querySelectorAll('[data-library-close]').forEach(button => button.addEventListener('click', close));
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.querySelector('[data-library-prepare]')?.addEventListener('click', async () => {
      const text = [material.textContent, material.externalUrl].filter(Boolean).join('\n\n');
      if (!text) return showNotification('Este material não tem texto ou link para copiar.', 'info');
      await navigator.clipboard.writeText(text);
      showNotification('Conteúdo copiado para você revisar. Nenhum envio foi feito.', 'success');
    });
    dialog.querySelector('[data-library-close]')?.focus();
  }

  function renderMaterialAsset(material, asset) {
    if (libraryPreviewUrl && material.mediaType === 'image') return `<img src="${libraryPreviewUrl}" alt="Prévia de ${escapeHtml(material.title)}">`;
    if (libraryPreviewUrl && material.mediaType === 'video') return `<video src="${libraryPreviewUrl}" controls></video>`;
    if (libraryPreviewUrl && material.mediaType === 'audio') return `<audio src="${libraryPreviewUrl}" controls></audio>`;
    if (libraryPreviewUrl && material.mediaType === 'pdf') return `<iframe src="${libraryPreviewUrl}" title="PDF: ${escapeHtml(material.title)}"></iframe>`;
    const externalUrl = safeLibraryUrl(material.externalUrl);
    if (externalUrl) return `<a href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">Abrir referência externa ↗</a>`;
    if (material.textContent) return `<pre>${escapeHtml(material.textContent)}</pre>`;
    return `<div class="library-preview-missing"><span>${asset ? 'Formato sem prévia integrada' : 'Arquivo indisponível neste aparelho'}</span><small>Os metadados continuam preservados. Edite o material para anexar novamente.</small></div>`;
  }

  function initMaterialLibrary() {
    document.getElementById('library-new')?.addEventListener('click', () => openMaterialEditor());
    document.getElementById('library-editor-close')?.addEventListener('click', closeMaterialEditor);
    document.getElementById('library-form-cancel')?.addEventListener('click', closeMaterialEditor);
    document.getElementById('library-form')?.addEventListener('submit', saveMaterial);
    document.getElementById('library-search')?.addEventListener('input', event => { state.library.query = event.target.value; renderMaterialLibrary(); });
    document.getElementById('library-filter-type')?.addEventListener('change', event => { state.library.type = event.target.value; renderMaterialLibrary(); });
    document.getElementById('library-filter-status')?.addEventListener('change', event => { state.library.status = event.target.value; renderMaterialLibrary(); });
    document.getElementById('library-filter-audience')?.addEventListener('change', event => { state.library.audience = event.target.value; renderMaterialLibrary(); });
    document.getElementById('library-filter-favorites')?.addEventListener('click', event => { state.library.favoritesOnly = !state.library.favoritesOnly; event.currentTarget.setAttribute('aria-pressed', String(state.library.favoritesOnly)); event.currentTarget.classList.toggle('active', state.library.favoritesOnly); renderMaterialLibrary(); });
    document.getElementById('library-gallery')?.addEventListener('click', event => {
      const action = event.target.closest('[data-library-action]')?.dataset.libraryAction;
      const id = event.target.closest('[data-material-id]')?.dataset.materialId;
      const material = state.operations.materials.find(item => item.id === id);
      if (!action || !material) return;
      if (action === 'favorite') { material.favorite = !material.favorite; material.updatedAt = new Date().toISOString(); saveOperationsToStorage(); renderMaterialLibrary(); }
      if (action === 'edit') openMaterialEditor(material);
      if (action === 'preview') openMaterialPreview(material);
    });
    renderMaterialLibrary();
  }

  function materialRecommendations(lead) {
    return OG_SALES_MATERIALS.recommendMaterials(state.operations.materials, lead);
  }

  function buildClientMaterialsPanel(lead, surface) {
    const recommendations = materialRecommendations(lead);
    const packages = state.operations.materialPackages.filter(item => String(item.clientId) === String(lead.id));
    const shares = state.operations.materialShares.filter(item => String(item.clientId) === String(lead.id) && item.sentConfirmedByUser);
    return `<section class="client-materials" data-client-materials="${escapeHtml(surface)}">
      <div class="client-materials-head"><div><span class="og-kicker">MATERIAIS PARA ESTA CONTA</span><strong>${recommendations.length ? `${recommendations.length} recomendação${recommendations.length === 1 ? '' : 'ões'}` : 'Nenhuma correspondência ainda'}</strong></div><button type="button" data-build-material-package>Montar pacote</button></div>
      ${recommendations.length ? `<div class="client-material-recommendations">${recommendations.slice(0, 3).map(item => `<button type="button" data-preview-client-material="${escapeHtml(item.material.id)}"><b>${escapeHtml(item.material.title)}</b><span>Porque: ${escapeHtml(item.reasons.join(' · '))}</span></button>`).join('')}</div>` : '<p class="client-material-empty">Cadastre e aprove materiais com tags compatíveis na Biblioteca. O sistema não vai inventar uma recomendação.</p>'}
      <div class="client-material-stats"><span>${packages.length} pacote${packages.length === 1 ? '' : 's'} preparado${packages.length === 1 ? '' : 's'}</span><span>${shares.length} envio${shares.length === 1 ? '' : 's'} confirmado${shares.length === 1 ? '' : 's'}</span></div>
    </section>`;
  }

  function bindClientMaterialsPanel(root, lead) {
    root.querySelectorAll('[data-build-material-package]').forEach(button => button.addEventListener('click', () => openMaterialPackageBuilder(lead)));
    root.querySelectorAll('[data-preview-client-material]').forEach(button => button.addEventListener('click', () => {
      const material = state.operations.materials.find(item => item.id === button.dataset.previewClientMaterial);
      if (material) openMaterialPreview(material);
    }));
  }

  function openMaterialPackageBuilder(lead, existingPackage = null) {
    document.querySelector('.material-package-backdrop')?.remove();
    const recommendations = materialRecommendations(lead);
    const allowed = state.operations.materials.filter(item => item.status === 'approved' && item.audience === 'customer_authorized');
    const selected = new Set(existingPackage?.materialIds || recommendations.filter(item => item.score > 0).slice(0, 4).map(item => item.material.id));
    const dialog = document.createElement('div');
    dialog.className = 'material-package-backdrop';
    dialog.innerHTML = `<section class="material-package" role="dialog" aria-modal="true" aria-labelledby="material-package-title">
      <header><div><span class="og-kicker">PACOTE REVISÁVEL</span><h2 id="material-package-title">Materiais para ${escapeHtml(lead.empresa || lead.nome)}</h2><p>Revise cada item. Preparar ou abrir o WhatsApp não registra envio.</p></div><button type="button" data-package-close aria-label="Fechar">✕</button></header>
      <div class="material-package-body">
        <section><h3>Escolha os materiais</h3><div class="material-package-list">${allowed.length ? allowed.map(material => {
          const recommendation = recommendations.find(item => item.material.id === material.id);
          return `<label><input type="checkbox" value="${escapeHtml(material.id)}" ${selected.has(material.id) ? 'checked' : ''}><span><b>${escapeHtml(material.title)}</b><small>${escapeHtml(recommendation ? `Recomendado porque: ${recommendation.reasons.join(' · ')}` : 'Disponível e autorizado para cliente')}</small></span></label>`;
        }).join('') : '<div class="client-material-empty">Não há materiais aprovados e autorizados para cliente. Revise a Biblioteca primeiro.</div>'}</div></section>
        <section class="material-package-form"><h3>Mensagem e registro</h3><label><span>Título do pacote</span><input id="package-title-input" required value="${escapeHtml(existingPackage?.title || `Materiais para ${lead.empresa || lead.nome}`)}"></label><label><span>Mensagem de abertura</span><textarea id="package-message-input" rows="5">${escapeHtml(existingPackage?.messageDraft || `Olá ${lead.nome || ''}, separei estes materiais considerando o que conversamos sobre ${lead.pain || 'a operação da frota'}.`)}</textarea></label><label><span>Canal planejado</span><select id="package-channel"><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="meeting">Reunião</option><option value="other">Outro</option></select></label><label><span>Próxima ação após o envio</span><input id="package-next-action" value="${escapeHtml(lead.nextAction || 'Confirmar recebimento e tirar dúvidas')}"></label></section>
      </div>
      <footer><span>Somente a confirmação final cria um registro de envio.</span><div><button type="button" data-package-close>Cancelar</button><button type="button" data-package-save>Salvar rascunho</button><button type="button" data-package-prepare class="og-button og-button-primary">Revisar e preparar</button></div></footer>
    </section>`;
    document.body.appendChild(dialog);
    const close = () => dialog.remove();
    dialog.querySelectorAll('[data-package-close]').forEach(button => button.addEventListener('click', close));
    const readPackage = () => {
      const materialIds = [...dialog.querySelectorAll('.material-package-list input:checked')].map(input => input.value);
      if (!materialIds.length) { showNotification('Escolha pelo menos um material.', 'info'); return null; }
      const title = dialog.querySelector('#package-title-input').value.trim();
      if (!title) { showNotification('Informe um título para o pacote.', 'info'); return null; }
      const now = new Date().toISOString();
      return { id: existingPackage?.id || newLibraryId('pkg'), clientId: lead.id, title, materialIds, messageDraft: dialog.querySelector('#package-message-input').value.trim(), channel: dialog.querySelector('#package-channel').value, nextAction: dialog.querySelector('#package-next-action').value.trim(), status: 'draft', createdAt: existingPackage?.createdAt || now, updatedAt: now, schemaVersion: 1 };
    };
    const persist = packageRecord => {
      state.operations = OG_OPERATIONS_MODEL.upsertMaterialPackage(state.operations, packageRecord);
      saveOperationsToStorage();
      return packageRecord;
    };
    dialog.querySelector('[data-package-save]').addEventListener('click', () => {
      const packageRecord = readPackage(); if (!packageRecord) return;
      persist(packageRecord); close(); refreshClientMaterialSurfaces(lead); showNotification('Pacote salvo como rascunho.', 'success');
    });
    dialog.querySelector('[data-package-prepare]').addEventListener('click', () => {
      const packageRecord = readPackage(); if (!packageRecord) return;
      packageRecord.status = 'reviewed'; persist(packageRecord); close(); openMaterialPackageReview(lead, packageRecord);
    });
    dialog.querySelector('[data-package-close]')?.focus();
  }

  function openMaterialPackageReview(lead, packageRecord) {
    const materials = packageRecord.materialIds.map(id => state.operations.materials.find(item => item.id === id)).filter(Boolean);
    const packageText = OG_SALES_MATERIALS.composePackageText(packageRecord, state.operations.materials, lead);
    const dialog = document.createElement('div');
    dialog.className = 'material-package-backdrop';
    dialog.innerHTML = `<section class="material-package material-package-review" role="dialog" aria-modal="true" aria-labelledby="material-package-review-title"><header><div><span class="og-kicker">REVISÃO FINAL</span><h2 id="material-package-review-title">${escapeHtml(packageRecord.title)}</h2><p>Nenhum envio foi registrado. Confira o conteúdo antes de copiar ou abrir outro aplicativo.</p></div><button type="button" data-package-close aria-label="Fechar">✕</button></header><div class="material-package-review-grid"><div><h3>Conteúdo do pacote</h3>${materials.map(item => `<article><b>${escapeHtml(item.title)}</b><span>${escapeHtml(LIBRARY_TYPE_LABELS[item.mediaType] || item.mediaType)} · ${escapeHtml(materialPermissionLabel(item))}</span></article>`).join('')}</div><label><span>Mensagem completa</span><textarea id="package-review-text" rows="14">${escapeHtml(packageText)}</textarea></label></div><div class="material-share-confirm"><label><span>Resultado inicial</span><select id="package-share-result"><option value="aguardando_retorno">Aguardando retorno</option><option value="cliente_pediu">Solicitado pelo cliente</option><option value="apresentado_reuniao">Apresentado em reunião</option></select></label><label><span>Próxima ação</span><input id="package-share-next" value="${escapeHtml(packageRecord.nextAction || '')}"></label></div><footer><span>Copiar ou abrir o WhatsApp não confirma envio.</span><div><button type="button" data-package-edit>Voltar e editar</button><button type="button" data-package-copy>Copiar conteúdo</button><button type="button" data-package-whatsapp>Abrir WhatsApp</button><button type="button" data-package-confirm class="og-button og-button-primary">Confirmar que enviei</button></div></footer></section>`;
    document.body.appendChild(dialog);
    const close = () => dialog.remove();
    dialog.querySelector('[data-package-close]').addEventListener('click', close);
    dialog.querySelector('[data-package-edit]').addEventListener('click', () => { close(); openMaterialPackageBuilder(lead, packageRecord); });
    dialog.querySelector('[data-package-copy]').addEventListener('click', async () => { await navigator.clipboard.writeText(dialog.querySelector('#package-review-text').value); showNotification('Pacote copiado para revisão. Nenhum envio foi registrado.', 'success'); });
    dialog.querySelector('[data-package-whatsapp]').addEventListener('click', () => {
      const phone = String(lead.telefone || '').replace(/\D/g, '');
      const normalized = phone.startsWith('55') ? phone : `55${phone}`;
      if (!phone) return showNotification('Cliente sem telefone cadastrado.', 'info');
      window.open(`https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(dialog.querySelector('#package-review-text').value)}`, '_blank');
      showNotification('WhatsApp aberto. Confirme o envio somente depois de enviar.', 'info');
    });
    dialog.querySelector('[data-package-confirm]').addEventListener('click', () => confirmMaterialPackageShare(lead, packageRecord, dialog));
    dialog.querySelector('[data-package-close]').focus();
  }

  function confirmMaterialPackageShare(lead, packageRecord, dialog) {
    if (!window.confirm('Você confirma que este pacote foi realmente enviado ao cliente?')) return;
    const now = new Date().toISOString();
    const result = dialog.querySelector('#package-share-result').value;
    const nextAction = dialog.querySelector('#package-share-next').value.trim();
    packageRecord.status = 'ready'; packageRecord.sentConfirmedAt = now; packageRecord.updatedAt = now;
    state.operations = OG_OPERATIONS_MODEL.upsertMaterialPackage(state.operations, packageRecord);
    packageRecord.materialIds.forEach((materialId, index) => {
      state.operations = OG_OPERATIONS_MODEL.appendMaterialShare(state.operations, { id: `${packageRecord.id}_share_${index}`, materialId, clientId: lead.id, packageId: packageRecord.id, channel: packageRecord.channel, preparedAt: packageRecord.createdAt, sentAt: now, sentConfirmedByUser: true, commercialOutcome: result, nextAction, createdAt: now, updatedAt: now, schemaVersion: 1 });
    });
    state.operations = OG_OPERATIONS_MODEL.appendActivity(state.operations, { id: newLibraryId('evt'), type: 'material.share_confirmed', at: now, clientId: lead.id, packageId: packageRecord.id, materialCount: packageRecord.materialIds.length });
    lead.interactions = Array.isArray(lead.interactions) ? lead.interactions : [];
    lead.interactions.push({ id: newLibraryId('int'), at: now, type: 'material', note: `Envio confirmado: ${packageRecord.title} (${packageRecord.materialIds.length} materiais)`, packageId: packageRecord.id, result });
    if (nextAction) lead.nextAction = nextAction;
    saveOperationsToStorage(); saveLeadsToStorage(); dialog.remove(); refreshClientMaterialSurfaces(lead); renderOperationsFoundation();
    showNotification('Envio confirmado e registrado no histórico do cliente.', 'success');
  }

  function refreshClientMaterialSurfaces(lead) {
    if (String(state.selectedLeadId) === String(lead.id)) renderLeadInspector();
    if (String(state.callAI.selectedLeadId) === String(lead.id)) renderCallAIContext();
  }

  function renderOperationsFoundation() {
    const root = document.getElementById('operations-foundation');
    if (!root) return;
    const interactions = state.leads.reduce((total, lead) => total + (lead.interactions?.length || 0), 0);
    const summary = OG_OPERATIONS_MODEL.summarizeOperations(state.operations);
    const lastEvent = state.operations.activityEvents[0];
    const metrics = [
      ['Clientes', state.leads.length, 'Registro único compartilhado'],
      ['Conversas', interactions, 'Histórico confirmado no CRM'],
      ['Cotações salvas', state.history.length, 'Base atual do histórico'],
      ['Materiais', summary.counts.materials, 'Biblioteca comercial local-first']
    ];
    root.innerHTML = `
      <div class="operations-metrics">${metrics.map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(note)}</small></article>`).join('')}</div>
      <section class="operations-foundation-grid">
        <article class="clean-card operations-status-card"><span class="og-kicker">FUNDAÇÃO DE DADOS</span><h2>Schema operacional v${summary.schemaVersion}</h2><p>A base foi migrada de forma aditiva. Clientes e cotações continuam preservados, enquanto os novos módulos usam coleções versionadas.</p><div class="operations-status-line"><span class="operations-dot ready"></span><b>Migração validada</b></div><div class="operations-status-line"><span class="operations-dot ready"></span><b>Biblioteca e Performance ativas</b></div><div class="operations-status-line"><span class="operations-dot pending"></span><b>Vendas e comissões aguardam as próximas fases</b></div></article>
        <article class="clean-card operations-status-card"><span class="og-kicker">ATIVIDADE MAIS RECENTE</span><h2>${lastEvent ? escapeHtml(lastEvent.type) : 'Nenhum evento novo'}</h2><p>${lastEvent ? `${escapeHtml(lastEvent.clientId || '')} · ${escapeHtml(new Date(lastEvent.at).toLocaleString('pt-BR'))}` : 'Os novos cadastros e ações operacionais passarão a alimentar esta linha do tempo.'}</p><button type="button" data-operations-open-crm class="og-button og-button-primary">Abrir clientes</button></article>
      </section>`;
    root.querySelector('[data-operations-open-crm]')?.addEventListener('click', () => switchTab('crm'));
    renderPerformanceDashboard();
  }

  function performancePeriodRange(period = state.performance.period, reference = new Date()) {
    const end = new Date(reference);
    end.setHours(23, 59, 59, 999);
    if (period === 'all') return { from: new Date(0), to: end };
    if (period === '90days') return { from: new Date(end.getTime() - 89 * 86400000), to: end };
    if (period === 'previous') return { from: new Date(end.getFullYear(), end.getMonth() - 1, 1), to: new Date(end.getFullYear(), end.getMonth(), 0, 23, 59, 59, 999) };
    return { from: new Date(end.getFullYear(), end.getMonth(), 1), to: end };
  }

  function performanceFilters(range) {
    return { ...state.performance, from: range.from, to: range.to };
  }

  function formatMoneyCents(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0) / 100);
  }

  function performanceMetric(label, value, detail, formula, source, status = '') {
    return `<article class="performance-metric" data-status="${status}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small><details><summary>Como foi calculado</summary><p><b>Fórmula:</b> ${escapeHtml(formula)}</p><p><b>Fonte:</b> ${escapeHtml(source)}</p></details></article>`;
  }

  function renderPerformanceDashboard() {
    const root = document.getElementById('performance-dashboard');
    if (!root) return;
    const range = performancePeriodRange();
    const result = OG_PERFORMANCE.calculate({ leads: state.leads, operations: state.operations, history: state.history }, performanceFilters(range));
    const previousEnd = new Date(range.from.getTime() - 1);
    const previousStart = state.performance.period === 'month' ? new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1) : new Date(previousEnd.getTime() - Math.max(1, range.to - range.from));
    const previous = OG_PERFORMANCE.calculate({ leads: state.leads, operations: state.operations, history: state.history }, { ...performanceFilters({ from: previousStart, to: previousEnd }) });
    const delta = result.activity.total - previous.activity.total;
    const maxStage = Math.max(1, ...Object.values(result.stageCounts));
    const conversionText = result.conversion.value === null ? 'Dados insuficientes' : `${result.conversion.value.toFixed(1)}%`;
    root.innerHTML = `
      <section class="performance-summary" aria-label="Resumo do período">
        ${performanceMetric('Atividades confirmadas', String(result.activity.total), `${delta >= 0 ? '+' : ''}${delta} versus período anterior`, 'interações registradas + envios de material confirmados', 'Histórico CRM e MaterialShare')}
        ${performanceMetric('Oportunidades', String(result.commercial.opportunities), 'Clientes ativos no recorte atual', 'clientes filtrados, exceto perdidos/standby', 'CRM atual')}
        ${performanceMetric('Conversão do funil', conversionText, result.conversion.smallBase ? `Base pequena: ${result.conversion.denominator} oportunidades` : `${result.conversion.numerator} vendas em ${result.conversion.denominator} oportunidades`, 'clientes em Venda/Pós-venda ÷ oportunidades ativas', 'Status atual do CRM', result.conversion.value === null ? 'insufficient' : '')}
        ${performanceMetric('Vendas registradas', result.limitations.revenue ? 'Dados insuficientes' : String(result.commercial.sales), result.limitations.revenue ? 'Nenhuma entidade Sale registrada no período' : formatMoneyCents(result.commercial.revenueCents), 'contagem e soma de Sale.totalCents', 'Coleção operacional Sales', result.limitations.revenue ? 'insufficient' : '')}
      </section>
      <section class="performance-grid">
        <article class="clean-card performance-panel"><div class="performance-panel-head"><div><span class="og-kicker">FUNIL ATUAL</span><h2>Distribuição por etapa</h2></div><small>Fotografia do CRM; não altera etapas</small></div><div class="performance-funnel" role="img" aria-label="${escapeHtml(result.stages.map(stage => `${stage.label}: ${result.stageCounts[stage.id]}`).join('; '))}">${result.stages.map(stage => `<div><span>${escapeHtml(stage.label)}</span><b>${result.stageCounts[stage.id]}</b><i style="--stage-width:${(result.stageCounts[stage.id] / maxStage) * 100}%"></i></div>`).join('')}</div>${result.limitations.stageDuration ? '<p class="performance-limitation">Tempo por etapa ficará disponível após acumular eventos reais de mudança de etapa.</p>' : ''}</article>
        <article class="clean-card performance-panel"><div class="performance-panel-head"><div><span class="og-kicker">NEGÓCIOS PARADOS</span><h2>Sem contato há 14 dias ou mais</h2></div><small>${result.stalled.length} identificados</small></div><div class="performance-stalled">${result.stalled.length ? result.stalled.slice(0, 8).map(item => `<button type="button" data-performance-client="${escapeHtml(item.id)}"><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.nextAction || 'Próxima ação não definida')}</small></span><strong>${item.days === null ? 'Sem data' : `${item.days} dias`}</strong></button>`).join('') : '<div class="performance-empty">Nenhum negócio parado neste filtro.</div>'}</div></article>
      </section>
      <section class="clean-card performance-sources"><div><span class="og-kicker">QUALIDADE DOS DADOS</span><h2>O que sustenta este painel</h2></div><ul><li>${result.sources.clients} clientes filtrados</li><li>${result.sources.interactions} interações no período</li><li>${result.sources.confirmedShares} envios confirmados</li><li>${result.sources.sales} vendas registradas</li><li>${result.sources.commissions} comissões registradas</li></ul><p>WhatsApp aberto, conteúdo copiado e roteiro preparado não contam como contato, envio ou venda.</p></section>`;
    root.querySelectorAll('[data-performance-client]').forEach(button => button.addEventListener('click', () => { state.selectedLeadId = button.dataset.performanceClient; switchTab('crm'); renderLeadsTable(); renderLeadInspector(); }));
  }

  function fillPerformanceSelect(id, values, labeler = value => value) {
    const select = document.getElementById(id); if (!select) return;
    const current = select.value || 'all';
    select.innerHTML = `<option value="all">Todos</option>${values.filter(Boolean).sort().map(value => `<option value="${escapeHtml(value)}">${escapeHtml(labeler(value))}</option>`).join('')}`;
    select.value = values.includes(current) ? current : 'all';
  }

  function initPerformanceDashboard() {
    fillPerformanceSelect('performance-segment', [...new Set(state.leads.map(item => item.segmentId))], value => OG_DATA.segments.find(item => item.id === value)?.name || value);
    fillPerformanceSelect('performance-status', [...OG_PERFORMANCE.STAGES.map(item => item.id), 'perdido'], value => OG_PERFORMANCE.STAGES.find(item => item.id === value)?.label || (value === 'perdido' ? 'Perdido / Standby' : value));
    fillPerformanceSelect('performance-state', [...new Set(state.leads.map(item => OG_PERFORMANCE.stateFromCity(item.cidadeUf)))]) ;
    fillPerformanceSelect('performance-seller', [...new Set(state.leads.map(item => item.vendedor))]);
    fillPerformanceSelect('performance-origin', [...new Set(state.leads.map(item => item.origin || item.origem))]);
    ['period', 'segment', 'status', 'state', 'seller', 'origin'].forEach(key => document.getElementById(`performance-${key}`)?.addEventListener('change', event => { state.performance[key] = event.target.value; renderPerformanceDashboard(); }));
    renderPerformanceDashboard();
  }

  function syncVehicleGallerySelection() {
    const selected = state.consultant.selectedVehicleId;
    document.querySelectorAll('[data-og-vehicle]').forEach(item => {
      const active = item.dataset.ogVehicle === selected;
      item.classList.toggle('selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }

  function initPremiumExperience() {
    document.getElementById('btn-hero-start')?.addEventListener('click', () => {
      document.querySelector('[data-day-filter="priority"]')?.click();
      document.getElementById('day-opportunity-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('btn-hero-quote')?.addEventListener('click', () => switchTab('cotacao'));
    document.getElementById('btn-product-application')?.addEventListener('click', () => switchTab('guia'));

    document.querySelectorAll('[data-og-vehicle]').forEach(button => {
      button.addEventListener('click', () => {
        const selectedId = button.dataset.ogVehicle;
        const rule = OG_DATA.vehicleConsultantRules.find(item => item.id === selectedId);
        if (!rule) return;
        state.consultant.selectedVehicleId = rule.id;
        state.consultant.targetVehicleName = rule.name;
        renderConsultantEngine();
        document.getElementById('consultant-search-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    syncVehicleGallerySelection();
  }

  async function initUnifiedExperience() {
    const nav = document.createElement('nav');
    nav.className = 'og-mobile-nav';
    nav.setAttribute('aria-label', 'Navegação principal no celular');
    nav.innerHTML = `
      <button type="button" data-mobile-tab="dia" class="active"><span>◉</span><small>Meu Dia</small></button>
      <button type="button" data-mobile-tab="crm"><span>◎</span><small>Clientes</small></button>
      <button type="button" data-mobile-tab="call-ai"><span>🎧</span><small>Call AI</small></button>
      <button type="button" data-mobile-tab="cotacao"><span>＋</span><small>Cotação</small></button>
      <button type="button" data-mobile-tab="scripts"><span>💬</span><small>Vendas</small></button>
      <button type="button" data-mobile-tab="biblioteca"><span>🎞️</span><small>Biblioteca</small></button>
      <button type="button" data-mobile-tab="operacoes"><span>📊</span><small>Operações</small></button>
      <button type="button" data-mobile-tab="historico"><span>≡</span><small>Histórico</small></button>`;
    document.body.appendChild(nav);
    nav.querySelectorAll('button').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.mobileTab)));

    const status = document.createElement('div');
    status.id = 'og-sync-status';
    status.className = 'og-sync-status';
    status.textContent = 'Conectando…';
    document.body.appendChild(status);

    let installPrompt = null;
    const installButton = document.getElementById('btn-install-app');
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      installPrompt = event;
      installButton?.classList.remove('hidden');
    });
    installButton?.addEventListener('click', async () => {
      if (!installPrompt) return;
      await installPrompt.prompt();
      installPrompt = null;
      installButton.classList.add('hidden');
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    window.addEventListener('online', loadSharedState);
    const importedCount = await importLucas2026Leads();
    if (importedCount) {
      renderDayDashboard();
      if (state.currentTab === 'crm') renderCrmModule();
    }
    loadSharedState();
  }

  function exportLeadsCsv() {
    let csv = 'ID;Nome;Empresa;Telefone;CNPJ;Cidade_UF;Segmento;Status\n';
    state.leads.forEach(l => {
      csv += `"${l.id}";"${l.nome}";"${l.empresa}";"${l.telefone}";"${l.cnpj}";"${l.cidadeUf}";"${l.segmentId}";"${l.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_olho_de_gato_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  function formatPhone(phone) {
    if (!phone) return '—';
    const c = phone.replace(/\D/g, '');
    if (c.length === 11) return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
    if (c.length === 10) return `(${c.slice(0, 2)}) ${c.slice(2, 6)}-${c.slice(6)}`;
    return phone;
  }

  function showNotification(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/40 text-slate-100 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 transform transition-all duration-300 translate-y-4 opacity-0 text-sm';
    toast.innerHTML = `<span class="text-amber-400 font-bold">●</span><span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-4', 'opacity-0'), 10);
    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Inicializações
  initClientInputs();
  initMultiVehicleEngine();
  initQuoteImport();
  initConsultantEngine();
  initDayDashboard();
  initQuickLead();
  initCallAI();
  initMaterialLibrary();
  initPerformanceDashboard();
  initPremiumExperience();
  initCrmEvents();
  initItemPricingModal();
  initFreightQuoteInfoCard();
  initDoresGanchosModal();
  initUnifiedExperience();
  renderCatalog();
  renderTransporters();
  renderSalesKnowledge();
  renderOperationsFoundation();
  renderDayDashboard();
  recalculateQuote();
});
