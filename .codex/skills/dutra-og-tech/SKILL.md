---
name: dutra-og-tech
description: Regras de aplicação técnica Olho de Gato no DUTRA OS. Use para veículos, eixos, suportes, equalizadores, mangueiras, PSI, quantidades e validação técnica.
---
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
