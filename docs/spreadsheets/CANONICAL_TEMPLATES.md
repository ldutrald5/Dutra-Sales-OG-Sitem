# Templates canônicos de planilhas — DUTRA OS

Data de captura: **2026-09-27**

Este documento registra os dois modelos privados que o DUTRA OS deve reconhecer como referência oficial de compatibilidade. Os binários **não são versionados no Git** porque contêm dados comerciais reais. A identificação usa nome, estrutura e SHA-256 do artefato capturado.

A fonte operacional após uma importação confirmada é o **DUTRA OS**. As planilhas permanecem como formatos compatíveis de entrada, saída, conferência e backup independente.

## 1. CRM Master — `CRM OG dr`

Artefato capturado: `CRM OG dr.ods`  
Alias conhecido no OneDrive: `CRM OG dr.xlsx`  
SHA-256 capturado: `8292ca9a25a1e0637afb6e981364c8305023bf4ed8bee543dd98f9254ae34e5c`

### Papel

Este é o **template canônico de backup/exportação do CRM**. A exportação deve preservar a identidade visual preta/amarela, fórmulas, tabelas, validações, mesclagens, formatação condicional e campos manuais protegidos.

Abas esperadas:

- `🚀 HOJE`
- `📋 CRM`
- `📥 LISTA`
- `👥 CONTATOS`

Estruturas esperadas no artefato capturado:

- `ActivityTable`
- `CRMTable`
- `HistoryTable`
- `ListaContatosTable`
- `ContatosTable`

Identidade visual registrada:

- amarelo principal: `#F5C518`
- preto principal: `#171717`

### Contrato

- O arquivo original nunca é alterado.
- `Exportar CRM Master` gera uma **cópia versionada**.
- O formato preferido de saída é `.xlsx`, mesmo quando a referência capturada estiver em `.ods`.
- `📋 CRM!Q:Q` e painéis calculados são `FORMULA_PROTECTED`.
- `📋 CRM!P:P` e observações humanas são `MANUAL_PROTECTED`.
- Tabelas, estilos, mesclagens, validações e regras condicionais são `STRUCTURE_PROTECTED`.
- Mudança de fingerprint exige preview/revisão antes de gravar.

## 2. Vendas e Comissões — `POS VENDAS LucasD Setembro26.xlsx`

SHA-256 capturado: `c5d48d28920e85237570a0a09af2124741234ee52a5180614388acc5691897b6`

Este é o **template canônico de vendas, faturamento e comissão**.

O arquivo real foi conferido em modo somente leitura em 2026-09-27. Ele possui 15 abas: meses de novembro de 2025 a dezembro de 2026 mais `Planilha15`.

### Entradas autorizáveis

- D — Data da última compra
- E — Data da venda
- H — Pedido
- I — Código
- J — Cliente
- K — Valor da venda
- M — Observações, sempre com política manual explícita

### Fórmulas protegidas

- F — Dias
- G — %
- L — Valor da comissão
- `E3` — comissão total
- `K1` e `K2` — progresso contra Super Meta / Meta
- `L2` — faturamento atual

A janela operacional atual é `7:80`. Exceder a capacidade exige decisão explícita; nunca truncar silenciosamente.

A competência deve ser determinada prioritariamente por **Data da venda**. O nome da aba é evidência secundária, porque o arquivo real contém divergências históricas entre mês da aba e dados lançados.

## 3. Regra para agentes e implementação

Antes de alterar importação/exportação de planilhas:

1. ler `docs/11-INTEGRACAO-EXCEL.md`;
2. ler `docs/spreadsheets/canonical-templates.json`;
3. comparar o arquivo apresentado com nome + estrutura + fingerprint;
4. nunca publicar dados reais dos workbooks no Git, logs ou fixtures públicas;
5. trabalhar sobre cópia do modelo;
6. executar preview antes de persistir/importar/exportar;
7. preservar campos manuais e fórmulas;
8. manter importação idempotente e exportação round-trip verificável.

Os hashes acima identificam **os artefatos capturados nesta data**. Uma edição legítima posterior do modelo muda o hash; isso não significa automaticamente que o arquivo é inválido. Nesse caso, comparar estrutura e registrar uma nova versão do fingerprint após revisão.
