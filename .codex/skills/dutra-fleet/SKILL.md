---
name: dutra-fleet
description: Contexto de caminhões/conjuntos usado pelo DUTRA OS para interpretar configuração, eixos e perguntas técnicas sem substituir o motor de aplicação.
---
# DUTRA Fleet

## Carregar

- `knowledge/FLEET-CONTEXT.md`
- `docs/playbooks/TECHNICAL_APPLICATION.md`
- `dutra-og-tech` quando houver código/peça.

## Função

Traduzir linguagem operacional em campos estruturados: tipo de conjunto, 4x2/6x2/6x4/8x2, posição de eixo, marca, redução, suspensão, aro, PSI e dianteira.

## Regra

Esta Skill explica e pergunta; não escolhe suporte fora do motor técnico.

Se a descrição humana puder significar mais de uma configuração, pedir o discriminador necessário ou retornar VALIDAR.

## Saída

Configuração estruturada + lacunas a confirmar, pronta para o motor técnico.
