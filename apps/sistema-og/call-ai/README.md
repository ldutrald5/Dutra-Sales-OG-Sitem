# Call AI Light

- `provider.js` — `OGCallAnalysis` + `LocalHeuristicProvider`
- `call-ai.js` — UI + modelo `normalizeCall`

Bridge do CRM: `window.OGCallAIBridge` (definido em `app.js`).

Fluxo: analisar → rascunho editável → salvar ligação (human-in-the-loop).
