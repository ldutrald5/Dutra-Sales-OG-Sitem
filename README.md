# Dutra Sales OG · Sistema OG

**Operação comercial Olho de Gato** — equalizadores de pressão para frota.

Repositório: [ldutrald5/Dutra-Sales-OG-Sitem](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem)

## O que é

Aplicativo **local-first** (PWA) para o vendedor:

| Módulo | Função |
|--------|--------|
| **Meu Dia** | Fila, follow-ups, prioridades |
| **CRM** | Leads, decisor, dor, frota, interações |
| **Cotação** | Multi-veículos, peças, propostas |
| **Call AI** | Transcrição → rascunho → revisão → CRM |
| **Consultor** | Orientação por tipo de caminhão |
| **Histórico** | Propostas e ligações |

Call AI: heurística local · Ollama (Qwen) · OpenAI (chave só no servidor).

## Rodar (exibição)

### Windows
1. Abra a pasta do projeto (Drive ou clone Git).
2. Node.js 24+ instalado.
3. Dois cliques em **INICIAR-SISTEMA-OG.cmd**.
4. Abra **http://127.0.0.1:4321**

### Terminal
```bash
npm install
npm run og:start
```

Celular (mesma Wi-Fi): IP mostrado no terminal, ou `/celular`.

## Call AI (opcional)

```bash
ollama pull qwen2.5:7b
```

`.env` na raiz:
```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
# OPENAI_API_KEY=sk-...
```

## Stories

| Story | Tema | Status |
|-------|------|--------|
| OG-1 | Copiloto comercial | Implementado |
| OG-2 | Modernização visual | Implementado |
| OG-3 | Call AI Light | Implementado |

## Estrutura

`apps/sistema-og/` — app · `call-ai/` — provedores · `docs/stories/` — AIOX

`.env` e `.data/` não vão para o Git.
