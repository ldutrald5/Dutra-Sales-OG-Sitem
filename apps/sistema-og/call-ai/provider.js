(function initCallProvider(global) {
  function firstMatch(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return '';
  }

  function collectMatches(text, patterns) {
    return patterns.map(pattern => text.match(pattern)?.[1]?.trim()).filter(Boolean);
  }

  class CallAnalysisProvider {
    analyze() {
      throw new Error('CallAnalysisProvider.analyze deve ser implementado por um provider.');
    }
  }

  class LocalHeuristicProvider extends CallAnalysisProvider {
    analyze(input = {}) {
      const transcript = String(input.transcript || '').trim();
      const text = transcript.toLowerCase();
      const summary = transcript ? transcript.split(/\r?\n/).filter(Boolean).slice(0, 3).join(' ').slice(0, 480) : '';
      const fleetSize = firstMatch(text, [
        /(?:frota|tem|possui|conta com)\s*(?:de|com)?\s*(\d{1,5})\s*(?:caminh(?:ões|oes)|veículos|veiculos|carros|unidades)?/
      ]);
      const decisionMaker = firstMatch(transcript, [
        /(?:decisor|responsável|responsavel|dono|diretor|gerente)\s*(?:é|e|:)\s*([^,.;\n]+)/i
      ]);
      const followUpAt = firstMatch(transcript, [
        /(?:retorno|follow[- ]?up|ligar|falar novamente)\s*(?:em|no dia|dia|:)\s*([0-9]{1,2}[\/-][0-9]{1,2}(?:[\/-][0-9]{2,4})?)/i
      ]);
      const pains = collectMatches(text, [
        /(?:dor|problema|dificuldade|reclamação|reclamacao)\s*(?:é|e|:)\s*([^.;\n]+)/,
        /(?:desgaste|custo|manutenção|manutencao|pneu[s]?)\s*([^.;\n]+)/
      ]);
      const objections = collectMatches(text, [
        /(?:objeção|objecao|receio|preocupação|preocupacao)\s*(?:é|e|:)\s*([^.;\n]+)/,
        /(?:caro|preço|preco|prazo|concorrente)\s*([^.;\n]+)/
      ]);
      const competitors = collectMatches(text, [
        /(?:usa|utiliza|concorrente|marca atual)\s*(?:é|e|:)?\s*([^.;\n]+)/
      ]);
      const valuesMentioned = Array.from(transcript.matchAll(/(?:r\$|rs\$?)\s*[\d.,]+/gi), match => match[0]);
      const buyingSignals = [];
      if (/(?:quer|gostou|interess|vamos avançar|vamos avancar|pode enviar|proposta)/.test(text)) buyingSignals.push('Interesse ou avanço mencionado');
      if (/(?:quando|prazo|urgente|este mês|este mes|ainda hoje)/.test(text)) buyingSignals.push('Urgência ou prazo mencionado');
      const commitments = collectMatches(transcript, [
        /(?:combinado|combinamos|vou enviar|vai enviar|ficou de|compromisso)\s*(?:que|:)?\s*([^.;\n]+)/i
      ]);
      return {
        transcript,
        summary,
        pains,
        objections,
        decisionMaker,
        fleetSize: fleetSize ? Number(fleetSize) : 0,
        competitors,
        buyingSignals,
        commitments,
        valuesMentioned,
        nextAction: commitments[0] || (buyingSignals.length ? 'Confirmar próximo passo com o cliente' : ''),
        followUpAt,
        status: 'draft',
        analysisMode: 'heuristic-local',
        heuristicNote: 'Rascunho gerado por regras locais. Revise todos os campos antes de salvar.'
      };
    }
  }

  global.OGCallAnalysisProvider = CallAnalysisProvider;
  global.LocalHeuristicProvider = LocalHeuristicProvider;
})(window);
