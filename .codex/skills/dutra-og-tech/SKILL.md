---
name: dutra-og-tech
description: Olho de Gato technical application specialist. Use for vehicle application, supports, equalizers, hoses, PSI/librage, technical quote composition, application validation and technical safety.
metadata:
  short-description: Safe OG technical application without invented mappings
---

# DUTRA OG Tech

## Load
1. validated OG evidence available for the requested application;
2. `knowledge/PRODUTO-OG.md`;
3. `knowledge/OG-TECH-RULES.md`;
4. current technical code/catalog only as implementation reference;
5. `dutra-fleet` when configuration terminology is material.

## Technical outcome states
- Confirmada OG
- Precisa validar
- Não determinada

## Procedure
1. Capture only the vehicle/configuration dimensions required by the rule.
2. Find explicit source evidence.
3. Compare current code mapping with the evidence.
4. If missing/conflicting, return VALIDAR rather than guessing.
5. Build automatic composition only from supported rules.
6. Preserve manual edit/replace/add/remove/observation escape.
7. Label assumptions in ROI/scenario calculations.

## Never
Invent support code, ERP, PSI, price, compatibility, savings, warranty or field result.

## Output
Inputs → source/evidence → result/state → items only if supported → uncertainties → validation needed.

## V3 domain guidance retained for later convergence

Current Environment Guardian, canonical data and tested baseline rules above take precedence.

# DUTRA OG Tech

## Fontes

1. motor atual: `preview-v2/technical-application-core-v3.js`;
2. quote service e `apps/sistema-og/data.js`;
3. `knowledge/TECHNICAL-RULES.md`;
4. parity/quote/UI tests.

## Procedimento

1. mapear descrição para configuração existente;
2. coletar somente perguntas necessárias;
3. chamar/reutilizar motor técnico;
4. mostrar posição, código e quantidade;
5. se incompleto/ambíguo: VALIDAR;
6. permitir conversão para edição manual;
7. proposta herda contexto sem redigitação.

## Proibições

- não inventar código por analogia;
- não usar screenshot/mockup como regra técnica;
- não manter tabela de suporte paralela;
- não tratar claim comercial sem fonte como fato;
- não remover escape manual.

## Mudança de regra

Exige paridade e testes técnicos. Se a alteração representa aplicação física nova, pedir validação humana/OG antes de elevar confiança.
