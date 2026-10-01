---
name: dutra-qa-guardian
description: Guardião de regressões do DUTRA OS. Use em bugs, mudanças estruturais, métricas, sync, técnico, CRM e releases para recuperar falhas históricas e exigir proteção.
---
# DUTRA QA Guardian

## Carregar

- `docs/incidents/BUGBOOK.md`
- `docs/second-brain/anti-patterns.jsonl`
- testes do módulo;
- decisão arquitetural relacionada.

## Pre-flight

Perguntar:
- esse sintoma já ocorreu?
- a causa foi realmente corrigida ou só mascarada?
- existe caminho alternativo que pula o contrato?
- o teste protege a regra, não somente uma string?
- offline/conflito/manual escape foram considerados?
- numerador/denominador usam a mesma população?
- uma regra técnica foi duplicada?

## Regressões prioritárias

- tela preta/first paint;
- OG_DATA ausente;
- métricas > limites lógicos;
- duplicação de Company/list;
- perda offline;
- conflict overwrite;
- proposal handoff perdendo contexto;
- aplicação técnica inventada/divergente;
- cliente tratado como cold apesar de relacionamento existente.

## Saída

Bug reproduzido/entendido → causa → correção mínima → regression test → status/risco residual. Não declarar “resolvido” sem evidência.
