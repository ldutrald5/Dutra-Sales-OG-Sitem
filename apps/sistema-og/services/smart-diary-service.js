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

  function resolveRelativeDate(relativeDateText, baseDate) {
    if (!relativeDateText || !baseDate) return null;
    const base = new Date(baseDate);
    if (Number.isNaN(base.getTime())) return null;
    const key = clean(relativeDateText).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const target = new Date(base);
    target.setSeconds(0, 0);
    if (key === 'hoje') return target.toISOString();
    if (key === 'amanha') { target.setDate(target.getDate() + 1); return target.toISOString(); }
    const weekdays = { domingo:0, segunda:1, 'segunda-feira':1, terca:2, 'terca-feira':2, quarta:3, 'quarta-feira':3, quinta:4, 'quinta-feira':4, sexta:5, 'sexta-feira':5, sabado:6 };
    if (!(key in weekdays)) return null;
    let delta = (weekdays[key] - target.getDay() + 7) % 7;
    if (delta === 0) delta = 7;
    target.setDate(target.getDate() + delta);
    return target.toISOString();
  }

  function timeFromText(value) {
    const text = clean(value).toLowerCase();
    const hhmm = text.match(/(?:às|as|depois das|ap[oó]s as|ap[oó]s às)\s*(\d{1,2})(?::(\d{2}))?\s*h?/i);
    if (!hhmm) return null;
    const hour = Number(hhmm[1]);
    const minute = Number(hhmm[2] || 0);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
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
      const relativeDateText = clean(returnMatch[1]);
      const resolved = resolveRelativeDate(relativeDateText, options.baseDate);
      const time = timeFromText(returnMatch[0]);
      let suggestedFollowUpAt = resolved;
      if (suggestedFollowUpAt && time) {
        const date = new Date(suggestedFollowUpAt);
        date.setHours(time.hour, time.minute, 0, 0);
        suggestedFollowUpAt = date.toISOString();
      }
      candidates.push(candidate('commitmentMentioned', clean(returnMatch[0]), 'medium', evidence(text, returnMatch), {
        requiresConfirmation: true,
        relativeDateText,
        suggestedFollowUpAt,
        suggestedAction: /ligar|retorno|retornar/i.test(returnMatch[0]) ? 'Retomar contato' : 'Falar com o cliente',
        note: options.baseDate
          ? 'Data sugerida a partir da data-base informada; exige confirmação humana.'
          : 'Data relativa não é resolvida sem data-base explícita e revisão humana.'
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

  return Object.freeze({ preview, resolveRelativeDate });
}));
