# Story OG 3 Call AI Assistente Comercial

## Status

Ready for Review

## Objetivo

Permitir que Lucas pesquise uma conta real, prepare e conduza uma ligação B2B com contexto do CRM e conhecimento comercial rastreável, mantendo controle explícito sobre áudio, custos e alterações no histórico.

## Critérios de aceite

- [x] Buscar clientes por empresa, contato, telefone ou CNPJ sem chamar IA.
- [x] Ignorar acentos e formatação na pesquisa e limitar a oito resultados.
- [x] Sugerir objetivo conforme a etapa e permitir alteração manual.
- [x] Exibir contexto confirmado, hipótese e dado ausente com origem.
- [x] Consultar somente trechos pertinentes do Sales Brain ao preparar o roteiro.
- [x] Preservar ID, arquivo, localização, status, confiança e versão das fontes.
- [x] Apresentar teleprompter em oito etapas com fala, pergunta, observação e caminhos.
- [x] Navegar, copiar, editar e ajustar fonte sem nova consulta ao servidor.
- [x] Adaptar objeções apenas sob ação explícita e aplicar somente ao próximo bloco.
- [x] Funcionar sem áudio e indicar claramente que o modo manual está ativo.
- [x] Revisar resumo, resultado, próxima ação e data antes de alterar o CRM.
- [x] Impedir duplicação da mesma sessão pelo identificador `sessionId`.
- [x] Manter fontes privadas e dados reais fora do GitHub.

## Implementação

- Interface integrada como aba do Sistema OG em desktop e mobile.
- Índice privado em `.data/knowledge/index.json`, gerado dos arquivos fornecidos.
- API local de status e busca no `server.mjs`.
- Roteiro determinístico com fallback seguro quando a base estiver ausente.
- Revisão editável e gravação idempotente no histórico do cliente.
- Áudio e transcrição permanecem desativados nesta etapa porque não há provedor configurado nem autorização de microfone.

## Validação

- JSONL: 13 registros, 0 erros e esquema consistente.
- DOCX: 168 blocos, 17 tabelas e 3 repetições de referências de fonte.
- Índice final: 127 trechos, 0 erros e 5 alertas de cautela.
- API local: status, busca relevante e arquivos críticos responderam HTTP 200.
- Navegador: busca por HERTEX, objetivo Negociação, roteiro específico, objeção de preço e revisão antes do CRM verificados.
- Fechamento da revisão não alterou o CRM durante o teste manual.

## File List

- `apps/sistema-og/index.html`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/app.js`
- `apps/sistema-og/server.mjs`
- `apps/sistema-og/service-worker.js`
- `apps/sistema-og/README.md`
- `scripts/import_og_sales_brain.py`
- `scripts/inspect_og_sales_brain.py`
- `docs/stories/OG-3-call-ai-assistente-comercial.md`
