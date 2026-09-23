(function initCallModel(global) {
  const ARRAY_FIELDS = ['pains', 'objections', 'competitors', 'buyingSignals', 'commitments', 'valuesMentioned'];

  function lines(value) {
    if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
    return String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  }

  function normalizeCall(call = {}) {
    const normalized = {
      id: String(call.id || `CALL-${Date.now()}`),
      leadId: String(call.leadId || ''),
      startedAt: typeof call.startedAt === 'string' ? call.startedAt : '',
      duration: String(call.duration || ''),
      transcript: String(call.transcript || ''),
      summary: String(call.summary || ''),
      pains: lines(call.pains),
      objections: lines(call.objections),
      decisionMaker: String(call.decisionMaker || ''),
      fleetSize: Number.isFinite(Number(call.fleetSize)) ? Number(call.fleetSize) : 0,
      competitors: lines(call.competitors),
      buyingSignals: lines(call.buyingSignals),
      commitments: lines(call.commitments),
      valuesMentioned: lines(call.valuesMentioned),
      nextAction: String(call.nextAction || ''),
      followUpAt: typeof call.followUpAt === 'string' ? call.followUpAt : '',
      status: String(call.status || 'draft'),
      createdAt: typeof call.createdAt === 'string' ? call.createdAt : new Date().toISOString(),
      updatedAt: typeof call.updatedAt === 'string' ? call.updatedAt : new Date().toISOString(),
      analysisMode: String(call.analysisMode || 'manual')
    };
    for (const field of ARRAY_FIELDS) normalized[field] = lines(normalized[field]);
    return normalized;
  }

  global.OGCallModel = { ARRAY_FIELDS, normalizeCall, lines };
})(window);
