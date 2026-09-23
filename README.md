# Dutra Sales OG · Sistema OG

**Operação comercial Olho de Gato** — CRM, rotina, cotação e consultoria de aplicação para frotas.

Repositório: [ldutrald5/Dutra-Sales-OG-Sitem](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem)

## O que é

Aplicativo **local-first** (PWA) para o vendedor:

| Módulo | Função |
|--------|--------|
| **Meu Dia** | Fila, follow-ups, prioridades |
| **CRM** | Leads, decisor, dor, frota, interações |
| **Cotação** | Multi-veículos, peças, propostas |
| **Consultor** | Orientação por tipo de caminhão |
| **Histórico** | Propostas e ligações |

O sistema é local-first, instalável como PWA e mantém o núcleo comercial funcional sem uma chave de IA.

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

Celular (mesma Wi-Fi): use o endereço de rede mostrado no terminal. A versão HTTPS é publicada separadamente pelo Cloudflare.

## Stories

| Story | Tema | Status |
|-------|------|--------|
| OG-1 | Copiloto comercial | Implementado |
| OG-2 | Modernização visual | Implementado |
| OG-3 | Call AI Light | Planejado |

## Estrutura

`apps/sistema-og/` — aplicativo · `docs/stories/` — stories AIOX · `.codex/` — agentes e skills

`.env` e `.data/` não vão para o Git.
