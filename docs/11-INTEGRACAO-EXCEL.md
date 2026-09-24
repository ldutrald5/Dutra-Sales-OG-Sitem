# Integração Excel

## Conciliação segura

O CRM compara o arquivo selecionado com a base que está aberta no navegador. Cada diferença recebe uma decisão independente: manter o valor atual, usar o Excel, juntar textos protegidos ou ignorar. Novos clientes começam como “não importar”. Nada é aplicado antes da confirmação final.

Resumo de conversa e observações são campos protegidos. O sistema nunca os substitui silenciosamente. Uma aplicação confirmada cria eventos de auditoria com nome e hash do arquivo, linha de origem e lista de campos alterados. O arquivo Excel permanece somente leitura.

## Estado implementado

A primeira fatia é somente leitura. Na tela CRM, o vendedor escolhe um arquivo `.xlsx`; o navegador valida as quatro abas esperadas, lê `📋 CRM` a partir do cabeçalho da linha 7 e compara cada registro com `state.leads`. Nenhum dado é persistido.

O preview classifica cada linha como `NEW`, `UNCHANGED`, `SAFE_UPDATE`, `CONFLICT` ou `INVALID`. A correspondência usa código externo, documento, telefone e por último nome mais cidade como sugestão de baixa confiança. Observações diferentes geram conflito obrigatório.

## Contrato protegido

- Fórmulas: `📋 CRM!Q:Q` e painéis calculados de `🚀 HOJE`.
- Manual: `📋 CRM!P:P` e observações de contatos.
- Derivado: última interação e quantidade de contatos.
- Estrutura: tabelas, mesclagens, validações, formatação condicional e estilos.

Esta fase não importa, exporta nem altera workbooks. A exportação futura deve copiar o modelo e escrever somente nas células autorizadas após preview.

## Caracterização disponível

O modelo de Pós-Vendas foi conferido diretamente em modo somente leitura: possui 15 abas, incluindo os meses de novembro de 2025 a dezembro de 2026 e `Planilha15`. Em `Setembro - 2026`, `L2` mantém `SUM(K7:K80)` e `E3` mantém `SUM(L7:L80)`.

O arquivo real do CRM não estava disponível no workspace durante esta implementação. O leitor foi testado com uma fixture estrutural sintética baseada no mapeamento fornecido; a validação com o workbook real permanece obrigatória antes de habilitar persistência.

## Próxima fase

Validar o preview com o arquivo CRM real, registrar fingerprint e anomalias, e então implementar decisões campo a campo. Persistência deve continuar desabilitada até essa validação.
