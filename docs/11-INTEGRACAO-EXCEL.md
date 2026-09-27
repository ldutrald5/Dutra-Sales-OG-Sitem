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

## Templates canônicos validados

Em 2026-09-27 os dois workbooks reais foram identificados como referências oficiais de compatibilidade. Os binários permanecem privados e fora do Git; fingerprints e contratos ficam em `docs/spreadsheets/canonical-templates.json`.

### CRM Master

- Nome canônico: `CRM OG dr`.
- Artefato capturado: `CRM OG dr.ods`.
- Alias conhecido: `CRM OG dr.xlsx`.
- Abas reais confirmadas: `🚀 HOJE`, `📋 CRM`, `📥 LISTA`, `👥 CONTATOS`.
- Estruturas confirmadas: `ActivityTable`, `CRMTable`, `HistoryTable`, `ListaContatosTable`, `ContatosTable`.
- Identidade visual: amarelo `#F5C518` + preto `#171717`.
- Papel: template canônico de backup/exportação do CRM.

A validação anterior baseada apenas em fixture sintética está superada pelo artefato real capturado. Isso **não** habilita importação destrutiva automaticamente; apenas elimina a incerteza sobre qual modelo é oficial.

### Vendas e comissões

- Nome canônico: `POS VENDAS LucasD Setembro26.xlsx`.
- 15 abas confirmadas: novembro/2025 a dezembro/2026 + `Planilha15`.
- Colunas de entrada: D, E, H, I, J, K e M.
- Colunas calculadas/protegidas: F, G e L.
- Fórmulas de resumo protegidas: `E3`, `K1`, `K2`, `L2`.
- Faixa operacional: linhas 7 a 80.
- Competência: usar `Data da venda` como evidência principal, não confiar cegamente no nome da aba.

## Regra de exportação

A experiência alvo passa a usar dois comandos explícitos:

- `Exportar CRM Master` → cópia versionada do `CRM OG dr`, preservando o visual preto/amarelo e estruturas protegidas.
- `Exportar Vendas/Comissões` → cópia versionada do modelo de Pós-Vendas, preservando fórmulas e layout mensal.

Nenhum exportador pode editar o original. O arquivo gerado deve ser validado antes de oferecer `Abrir` e `Baixar`.

## Próxima fase

Usar os fingerprints reais como baseline para implementar a exportação sobre cópia do modelo e, depois, a importação transacional. A persistência no DUTRA OS continua sendo independente do Excel; a planilha é backup/interoperação, não banco primário.
