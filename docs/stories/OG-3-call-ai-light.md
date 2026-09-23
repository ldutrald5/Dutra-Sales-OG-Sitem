# Story OG-3 — Call AI Light

## Objetivo

Transformar uma ligação comercial (transcrição ou anotações coladas) em informação estruturada, revisável pelo vendedor e reutilizável pelo CRM do Sistema OG — **sem** gravar áudio, **sem** speech-to-text e **sem** API de IA paga nesta versão.

## Fluxo

```text
LIGAÇÃO (externa)
    ↓
COLA TRANSCRIÇÃO / ANOTAÇÕES
    ↓
ANÁLISE HEURÍSTICA (rascunho local)
    ↓
REVISÃO HUMANA (obrigatória)
    ↓
SALVAR LIGAÇÃO
    ↓
ATUALIZAR CRM + INTERAÇÃO + PRÓXIMA AÇÃO
```

## Status

Ready for Review

## Limitações LIGHT

- Extração por regras/regex, não LLM
- Sem captura de chamada nem microfone
- Sem provedores pagos

Ver implementação em `apps/sistema-og/call-ai/`.
