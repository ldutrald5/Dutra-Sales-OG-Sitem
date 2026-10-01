# Conhecimento de produto OG

## Uso deste arquivo

Registrar somente informações oficiais e rastreáveis sobre produtos Olho de Gato. Cada entrada deve informar fonte, data de verificação e responsável pela validação.

## Catálogo e aplicações

- Produtos e códigos: [CONHECIMENTO PENDENTE]
- Tipos de veículo, eixo e roda compatíveis: [CONHECIMENTO PENDENTE]
- Suportes, mangueiras e quantidades por aplicação: [CONHECIMENTO PENDENTE]
- Regras para caminhão, cavalo, carreta, ônibus, micro-ônibus e van: [CONHECIMENTO PENDENTE]

## Alegações comerciais protegidas

- Benefícios comprovados: [CONHECIMENTO PENDENTE]
- Vida útil e condições da premissa: [CONHECIMENTO PENDENTE]
- Garantias: [CONHECIMENTO PENDENTE]
- Preços, descontos, prazos e impostos: [CONHECIMENTO PENDENTE]
- Resultados e cases autorizados: [CONHECIMENTO PENDENTE]

## Formato de registro

```text
Afirmação:
Fonte:
Documento/URL:
Data de verificação:
Validador:
Escopo e exceções:
Status: confirmado | precisa revisão | obsoleto
```

Não converter hipótese, fala informal ou cálculo de cenário em fato de produto.


## Separação entre regra de runtime e claim oficial

O DUTRA OS já possui mapeamentos técnicos executáveis no motor. Eles são indexados em `knowledge/TECHNICAL-RULES.md` com proveniência de código/teste.

Isso **não** promove automaticamente esses mapeamentos a documentação oficial de produto nem valida claims físicos/comerciais. Para uso em proposta técnica oficial, treinamento de instalação ou material externo, preservar a distinção:

- **runtime-confirmed:** regra atualmente usada/testada pelo software;
- **official-confirmed:** validada por fonte OG responsável;
- **needs-validation:** existe no histórico/código, mas requer validação física/comercial adicional.

Nunca preencher alegações de economia, garantia, vida útil ou compatibilidade fora do motor apenas com memória de conversa.
