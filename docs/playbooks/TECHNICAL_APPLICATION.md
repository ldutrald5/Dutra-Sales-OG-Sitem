# DUTRA OS — Playbook de Aplicação Técnica

## Objetivo

Transformar configuração de veículo em suporte, equalizador, mangueiras, quantidades e orçamento sem criar um segundo motor técnico.

## Fonte operacional

Primária no shell V3:

- `preview-v2/technical-application-core-v3.js`;
- `preview-v2/technical-quote-service-v3.js`;
- `apps/sistema-og/data.js` para base/consultor;
- testes de paridade e UI.

`knowledge/TECHNICAL-RULES.md` é índice humano; não substitui o código.

## Fluxo

```text
VEÍCULO
→ PERGUNTAS DINÂMICAS
→ EIXOS
→ SUPORTES
→ EQUALIZADORES/MANGUEIRAS
→ QUANTIDADES
→ VALIDAÇÃO
→ ORÇAMENTO
```

## Modos

### Assistido

Usar quando a configuração está coberta pelo motor.

### Manual

Sempre disponível para exceções comerciais/técnicas reais.

O vendedor pode:

- editar quantidade;
- alterar preço;
- substituir/remover item;
- adicionar peça/ferramenta;
- criar item livre;
- registrar observação;
- usar cálculo assistido como base e sobrescrever.

## Regra crítica

Se a combinação não estiver determinada com segurança:

```text
STATUS = VALIDAR
```

Nunca inferir silenciosamente código de suporte.

## Busca

Busca pode entender linguagem natural/fuzzy, mas o resultado da busca é apenas seleção de configuração. Fuzzy matching não autoriza fuzzy technical mapping.

## Single-engine rule

Não manter duas tabelas de decisão concorrentes. Ao tocar em `supportDecision`, `technicalPositions`, `resolveVehicleSupports` ou `buildConsolidatedVehiclePieces`, verificar paridade e migrar para o motor compartilhado em vez de adicionar outra condição na UI.

## Multi-Veículos

Estado alvo:

1. calcular cada configuração pelo mesmo motor;
2. preservar origem por veículo;
3. consolidar códigos iguais;
4. permitir expansão por origem;
5. aplicar override manual sem destruir cálculo-base;
6. proposta herda a configuração sem redigitação.

## Validação

Antes de liberar alteração técnica:

- rodar `test-technical-quote.mjs`;
- rodar `test-technical-parity.mjs`;
- rodar `test-technical-center-ui.mjs`;
- validar manualmente uma aplicação conhecida quando a regra física tiver sido alterada.
