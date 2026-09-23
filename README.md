# Dutra Sales OG

Sistema comercial da operação de vendas **Olho de Gato** (equalizadores de pressão / frota).

Monorepo **AIOX** com o aplicativo **Sistema OG** em `apps/sistema-og/`.

## Principais áreas (implementado)

- CRM e gestão de leads
- Meu Dia (fila, follow-ups, prioridades)
- Cotação multi-veículos e peças
- Consultor técnico por tipo de caminhão
- Scripts / biblioteca de vendas
- Transportadoras homologadas
- Histórico de propostas
- Copiloto comercial (secretário + alertas a partir dos dados)
- PWA (instalável) e layout mobile
- Sincronização PC ↔ celular na mesma rede (servidor local + merge)
- Scripts de atalho Windows e Cloudflare Tunnel (opcional)

## Em evolução (roadmap)

Preparação da linha **DUTRA SALES AI** (Call AI e inteligência comercial).
Detalhes: [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md) e stories em `docs/stories/`.

| Story | Tema | Status |
|-------|------|--------|
| OG-1 | Copiloto Comercial | Implementado (review) |
| OG-2 | Modernização visual | Implementado (review) |
| OG-3+ | Call AI, áudio, sales intelligence… | Planejado |

## Requisitos

- **Node.js** 24.x
- **npm** 11+

## Instalação

```bash
git clone https://github.com/ldutrald5/Dutra-Sales-OG-Sitem.git
cd Dutra-Sales-OG-Sitem
npm install
```

Copie `.env.example` → `.env` apenas se for usar integrações AIOX/LLM (o Sistema OG roda **sem** chave para uso comercial local).

## Iniciar o Sistema OG

```bash
npm run og:start
```

Abra: [http://127.0.0.1:4321](http://127.0.0.1:4321)

No Windows (pasta do projeto):

- `INICIAR-SISTEMA-OG.cmd` — sobe o servidor e abre como app
- `CRIAR-ATALHO-SISTEMA-OG.cmd` — atalho na área de trabalho

Celular na **mesma Wi‑Fi**: use o botão **Celular** no app ou a URL que o terminal mostrar (`http://IP:4321`).

## Validação

```bash
npm run og:check
```

## Scripts úteis

| Comando | Função |
|---------|--------|
| `npm run og:start` | Servidor local do Sistema OG |
| `npm run og:css` | Rebuild do CSS Tailwind (utilities) |
| `npm run og:check` | Verificação sintática JS |
| `npm run og:tunnel` | Quick Tunnel Cloudflare (se `cloudflared` instalado) |
| `npm run og:cloud:deploy` | Deploy Worker (requer conta/KV configurados) |

## Estrutura

```text
/
├── AGENTS.md              # Regras para agentes de IA
├── package.json
├── apps/sistema-og/       # Aplicativo comercial (frontend + server.mjs)
├── docs/                  # Stories, arquitetura, design, contexto
├── cloudflare/            # Worker + tunnel
├── scripts/               # Utilitários Windows/build
└── .aiox-core/            # Framework AIOX
```

## Fontes de verdade

| Onde | Papel |
|------|--------|
| **GitHub** (este repo) | Código oficial |
| **Google Drive** | Backup / assets auxiliares |
| **PC local** | Desenvolvimento e uso diário do vendedor |

## Segurança

- Não commite `.env`, tokens ou `apps/sistema-og/.data/` (estado CRM local).
- Dados de clientes ficam no aparelho / servidor local; não vão para o Git.

## Licença / uso

Projeto privado da operação comercial Olho de Gato / Dutra Sales.
