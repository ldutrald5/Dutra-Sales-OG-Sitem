# ADR 00R — Contenção XLSX

`xlsx@0.18.5` possui vulnerabilidades conhecidas sem correção publicada no npm. O projeto também mantinha a mesma biblioteca vendorizada, duplicando a superfície.

Decisão: remover a dependência npm e carregar o bundle legado somente em Web Worker durante escolha explícita de arquivo `.xlsx`. O fluxo limita arquivo a 5 MB, 16 abas, 5.000 linhas por aba, 100.000 células, 10.000 caracteres por célula e 8 segundos. Fórmulas e estilos não são processados para a aplicação; o worker retorna apenas matrizes de texto sanitizadas.

Risco residual: o parser legado ainda processa bytes não confiáveis dentro do worker. O isolamento reduz impacto e bloqueia uso geral, mas não equivale a uma biblioteca corrigida. A substituição por um parser mantido permanece recomendada, condicionada a testes de compatibilidade com o modelo OG.

Rollback: restaurar `spreadsheet-import-service.js`, o script do `index.html` e a dependência do lockfile no commit anterior. Nenhum arquivo de cliente é persistido pelo novo parser.
