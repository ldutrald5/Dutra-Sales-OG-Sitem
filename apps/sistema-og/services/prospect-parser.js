(function attachProspectParser(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PROSPECT_PARSER = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createProspectParser() {
  'use strict';
  const digits = value => String(value || '').replace(/\D/g, '');
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const cnpjFormat = value => { const d = digits(value); return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : ''; };
  const cpfFormat = value => { const d = digits(value); return d.length === 11 ? d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : ''; };

  function extractDocuments(text) {
    const labeledCnpj = text.match(/cnpj\s*[:#-]?\s*([\d.\/-]{14,18})/i);
    const labeledCpf = text.match(/cpf\s*[:#-]?\s*([\d.-]{11,14})/i);
    const groups = [...text.matchAll(/(?<!\d)(\d[\d.\/-]{9,17}\d)(?!\d)/g)].map(match => ({ raw: match[0], d: digits(match[0]) }));
    const cnpj = digits(labeledCnpj?.[1] || groups.find(item => item.d.length === 14)?.raw);
    const cpf = digits(labeledCpf?.[1] || '');
    return { cnpj: cnpj.length === 14 ? cnpj : '', cpf: cpf.length === 11 ? cpf : '' };
  }

  function parseLine(raw, index = 0) {
    const source = clean(raw);
    const documents = extractDocuments(source);
    const labeledCode = source.match(/(?:c[oó]d(?:igo)?|id)\s*[:#-]?\s*([a-z0-9-]{3,20})/i)?.[1] || '';
    const phoneCandidates = [...source.matchAll(/(?<!\d)(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]*)?9?\d{4}[\s.-]*\d{4}(?!\d)/g)]
      .map(match => ({ raw: match[0], d: digits(match[0]) }))
      .filter(item => item.d.length >= 10 && item.d.length <= 13 && item.d !== documents.cnpj && item.d !== documents.cpf);
    const phone = phoneCandidates[0]?.d || '';
    const delimiter = raw.includes('\t') ? '\t' : raw.includes('|') ? '|' : raw.includes(';') ? ';' : raw.includes(',') ? ',' : null;
    let parts = delimiter ? raw.split(delimiter).map(clean).filter(Boolean) : [];
    const isData = part => {
      const d = digits(part);
      return (phone && d === phone) || (documents.cnpj && d === documents.cnpj) || (documents.cpf && d === documents.cpf) || /(?:cnpj|cpf|c[oó]d(?:igo)?)/i.test(part);
    };
    let code = labeledCode;
    if (!code && parts.length > 1 && /^\d{4,9}$/.test(parts[0]) && digits(parts[0]) !== phone) code = parts.shift();
    const textParts = parts.filter(part => !isData(part));
    let empresa = clean(textParts[0] || source
      .replace(/(?:cnpj|cpf|c[oó]d(?:igo)?|id)\s*[:#-]?\s*[\w.\/-]+/gi, '')
      .replace(phoneCandidates[0]?.raw || /$^/, '')
      .replace(/[|;,]+.*$/, ''));
    let contato = clean(textParts[1] || '');
    let observacao = clean(textParts.slice(2).join(' · '));
    if (!delimiter && empresa === source) {
      empresa = clean(source.replace(phoneCandidates[0]?.raw || /$^/, '').replace(documents.cnpj || /$^/, '').replace(documents.cpf || /$^/, '').replace(labeledCode || /$^/, ''));
    }
    empresa = empresa.replace(/^[|,;\s-]+|[|,;\s-]+$/g, '');
    const uncertain = !empresa || (!delimiter && !/(?:cnpj|cpf|c[oó]d(?:igo)?)/i.test(source)) || (textParts.length > 1 && !contato);
    return { id: `preview-${index}`, raw: source, empresa, contato, telefone: phone, cnpj: documents.cnpj, cpf: documents.cpf, codigo: clean(code), observacao, confidence: uncertain ? 'review' : 'ready', duplicateStatus: 'NEW', duplicateId: '' };
  }

  function parseBulk(text) { return String(text || '').split(/\r?\n/).map(clean).filter(Boolean).map(parseLine); }

  function parseNaturalCommand(text, now = new Date()) {
    const row = parseLine(text, 0);
    const lower = String(text || '').toLowerCase();
    const result = lower.includes('não atendeu') ? 'nao_atendeu' : lower.includes('pediu apresentação') ? 'enviar_apresentacao' : lower.includes('orçamento') ? 'enviar_orcamento' : lower.includes('falei') ? 'atendeu' : '';
    const contact = text.match(/(?:falei com|contato)\s+([\p{L}]+(?:\s+[\p{L}]+)?)/iu)?.[1] || row.contato;
    const action = result === 'enviar_apresentacao' ? 'Enviar apresentação' : result === 'enviar_orcamento' ? 'Preparar orçamento' : lower.includes('retornar') ? 'Retornar contato' : '';
    let followUpAt = '';
    if (/amanh[ãa]/i.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); followUpAt = d.toISOString().slice(0, 16); }
    return { commandText: text, company: row.empresa, contact, result, suggestedAction: action, followUpAt, confidence: row.confidence === 'ready' && result ? 'high' : 'review' };
  }

  return { digits, cnpjFormat, cpfFormat, parseLine, parseBulk, parseNaturalCommand };
}));
