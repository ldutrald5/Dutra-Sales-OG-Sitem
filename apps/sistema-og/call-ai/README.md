# Call AI Light

Módulo local-first do Sistema OG para transformar transcrições ou anotações em um rascunho comercial revisável.

- `call-model.js`: normalização aditiva de `lead.calls[]`.
- `provider.js`: `CallAnalysisProvider` e `LocalHeuristicProvider`, sem rede e sem API paga.
- `call-ui.js`: formulário de análise, revisão, descarte e histórico.
- `call-ui.css`: estilos específicos que reutilizam os tokens visuais existentes.

Analisar não persiste dados. O CRM só salva após revisão humana explícita.
