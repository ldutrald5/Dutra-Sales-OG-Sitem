(function attachSmartDiary(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SMART_DIARY = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSmartDiary() {
  'use strict';

  function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
  function evidence(text, match) {
    const value = clean(match?.[0]);
    if (!value) return null;
    const start = text.toLowerCase().indexOf(value.toLowerCase());
    return Object.freeze({ quote: value, start: Math.max(0, start), end: start < 0 ? null : start + value.length });
  }
  function candidate(field, value, confidence, sourceEvidence, meta = {}) {
    return Object.freeze({ field, value, confidence, evidence: sourceEvidence, ...meta });
  }

  function preview(input, options = {}) {
    const text = clean(input);
    if (!text) throw new Error('Diário exige texto ou transcrição');
    const candidates = [];
    const lower = text.toLowerCase();

    const fleet = text.match(/(?:tem|possui|frota (?:de|com))\s+(\d{1,4})\s+(?:caminh(?:ão|ões)|ve[ií]culos?|conjuntos?)/i);
    if (fleet) candidates.push(candidate('fleetSizeMentioned', Number(fleet[1]), 'medium', evidence(text, fleet), { requiresConfirmation: true }));

    const test = text.match(/(?:testando|teste (?:em|com))\s+(?:em\s+)?(\d{1,4})\s+(?:caminh(?:ão|ões)|ve[ií]culos?|conjuntos?)/i);
    if (test) candidates.push(candidate('testFleetMentioned', Number(test[1]), 'medium', evidence(text, test), { requiresConfirmation: true }));

    const painPatterns = [
      /(?:problema|dor)(?: principal)? (?:é|e|com)\s+([^,.!?;]+)/i,
      /(?:sofre|sofrendo) com\s+([^,.!?;]+)/i
    ];
    for (const pattern of painPatterns) {
      const match = text.match(pattern);
      if (match) {
        candidates.push(candidate('painMentioned', clean(match[1]), 'medium', evidence(text, match), { requiresConfirmation: true }));
        break;
      }
    }

    const returnMatch = text.match(/(?:pediu|combinou|marcou|quer|retornar?|retorno|ligar|falar)(?: para| pra| de)?\s*(?:eu\s+)?(?:retornar?|retorno|ligar|falar)?\s*(hoje|amanh[ãa]|segunda(?:-feira)?|terça(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sábado|sabado|domingo)(?:\s+([^,.!?;]+))?/i);
    if (returnMatch) {
      candidates.push(candidate('commitmentMentioned', clean(returnMatch[0]), 'medium', evidence(text, returnMatch), {
        requiresConfirmation: true,
        relativeDateText: clean(returnMatch[1]),
        note: 'Data relativa não é resolvida sem data-base explícita e revisão humana.'
      }));
    }

    const partner = text.match(/(?:falar|conversar|ver|alinhar) com (?:o |a )?(sócio|socio|dono|diretor|gerente|gestor)/i);
    if (partner) candidates.push(candidate('decisionProcessMentioned', clean(partner[1]), 'low', evidence(text, partner), {
      requiresConfirmation: true,
      note: 'Menção de cargo/pessoa não confirma decisor.'
    }));

    return Object.freeze({
      version: 'DIARY-01-preview-v1',
      originalText: text,
      candidates: Object.freeze(candidates),
      warnings: Object.freeze([
        'Preview não altera o CRM.',
        'Frota, dor, decisor, compromisso e datas exigem confirmação.',
        ...(lower.includes('gostou') || lower.includes('interessado') ? ['Interesse ou satisfação mencionados não significam venda.'] : [])
      ]),
      baseDate: options.baseDate || null
    });
  }

  return Object.freeze({ preview });
}));
