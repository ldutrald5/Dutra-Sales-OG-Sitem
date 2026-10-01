# DUTRA OG — Technical Rules Index

## Escopo e autoridade

Este arquivo documenta regras **presentes no runtime** para facilitar retrieval. Ele não substitui o motor nem certifica aplicação física.

Fonte atual:

- `preview-v2/technical-application-core-v3.js`;
- `preview-v2/test-technical-parity.mjs`.

Status das regras abaixo: **CONFIRMED IN CODE / FIELD-VALIDATION AS APPLICABLE**.

Quando este arquivo divergir do código testado, código/teste vence e o drift deve ser corrigido.

## Códigos usados pelo motor

| Contexto no motor | Código |
|---|---|
| Tração universal | EQ-1145 |
| Tração 3/4 | EQ-1155 |
| Dianteira 3/4 aro 19 | EQ-1340 |
| Dianteira 3/4 aro 17 | EQ-1320 |
| Scania tração convencional | EQ-1190 |
| Scania suspensão a ar | EQ-1390 |
| Scania/Volvo com redução, conforme regra | EQ-1330 |
| Mercedes com redução | EQ-1271 |
| Truck/carreta/reboque universal, conforme regra | EQ-1135 |
| Dianteira Scania/Volvo | EQ-1250 |
| Dianteira MB < 2017 | EQ-1300 |
| Dianteira universal / MB 2017+ | EQ-1251 |
| Mangueira interna traseira | EQ-1040 |
| Mangueira externa traseira | EQ-1043 |
| Mangueira dianteira | EQ-1041 |

## Equalizadores

O builder consolidado forma o código traseiro como:

`EQ-{libras}`

e dianteiro como:

`EQ-{libras}D`.

A UI atual trabalha explicitamente com faixas como 110/115/120 PSI, mas preço/compatibilidade comercial precisa vir da base atual, não deste documento.

## Configurações cobertas no motor extraído

- `3_4`;
- `toco_4x2`;
- `trucado_6x2_8x2`;
- `trucado_reboque`;
- `cavalo_toco_carreta3`;
- `trucado_carreta3`;
- `bitrem_7eixos`;
- `rodotrem_9eixos`.

## Quantidade

Para tração/truck/carreta, o motor usa dois conjuntos por eixo atendido e inclui:

- equalizador;
- suporte da posição;
- EQ-1040;
- EQ-1043.

Quando dianteira está habilitada:

- dois conjuntos por eixo dianteiro;
- equalizador D;
- suporte dianteiro;
- EQ-1041.

## Regra crítica

Se a entrada não estiver coberta/confirmada pelo motor:

```text
STATUS = VALIDAR
```

Nunca criar suporte por analogia ou por linguagem natural.

## Mudança de regra

Qualquer mudança deve atualizar/rodar:

- `test-technical-quote.mjs`;
- `test-technical-parity.mjs`;
- `test-technical-center-ui.mjs`.

Claims de economia, garantia, vida útil e benefícios físicos continuam dependendo de fonte oficial em `knowledge/PRODUTO-OG.md`.
