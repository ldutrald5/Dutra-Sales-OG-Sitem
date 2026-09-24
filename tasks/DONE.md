# Entregas existentes

Este registro descreve capacidades já presentes no código. Não substitui testes de aceite nem implica que os módulos estejam completos.

| Referência | Entrega comprovável | Evidência principal |
|---|---|---|
| OG-1 | Copiloto comercial integrado ao CRM leve | `docs/stories/OG-1-copiloto-comercial-integrado.md` |
| OG-2 | Identidade visual e interface premium responsiva | `docs/stories/OG-2-modernizacao-visual-sistema-og.md` |
| OG-3/4 | Call AI manual e gravação local por ação explícita | `docs/stories/OG-3-call-ai-assistente-comercial.md`, `apps/sistema-og/app.js` |
| OG-11/12 | Envelope operacional v1 e migração aditiva | `apps/sistema-og/operations-model.js` |
| OG-13 | Fundação de navegação, componentes e testes | `docs/stories/OG-13-fundacao-navegacao-componentes-testes.md` |
| OG-15 | Biblioteca Comercial local-first | `material-store.js`, `docs/stories/OG-15-biblioteca-comercial-local-first.md` |
| OG-16 | Pacotes de materiais ligados a CRM/Call AI | `sales-materials.js`, `docs/stories/OG-16-crm-call-ai-pacotes-materiais.md` |
| OG-17 | Performance e funil baseados em eventos reais | `performance-engine.js`, `docs/stories/OG-17-performance-funil-eventos-reais.md` |
| Infra | PWA offline, servidor local e opção Cloudflare | `service-worker.js`, `server.mjs`, `cloudflare/worker.mjs` |

## TASK-001 — Mesa de Vendas: estrutura base

- **Data:** 2026-09-24.
- **Mudança observável:** fila pesquisável, cliente ativo no mesmo espaço, WhatsApp em um clique, cinco templates editáveis sem IA, resultado e nota rápidos, próxima ação, atalhos e entrada do Call AI com contexto compacto.
- **Compatibilidade:** `state.leads`, IDs, histórico, localStorage e sincronização existentes foram preservados; `/mobile` foi congelado sem remoção.
- **Arquivos principais:** `modules/sales-desk.js`, `services/*`, `components/ui-components.js`, `index.html`, `app.js` e `styles.css`.
- **Validação:** `npm run og:sales-desk:test` e `npm run validate`.
- **Limites:** confirmação real de envio, e-mail, IA de personalização e Proposta Premium permanecem para tarefas próprias.

## TASK-002 — Motor de Prospecção e Caixa de Entrada

- **Data:** 2026-09-24.
- **Mudança observável:** colagem de listas, parser local, preview editável, duplicidade, importação em lote, fila de novos prospects, modo sequencial, pular/adiar, salvar e próximo, métricas da sessão, recomendação por regras, feedback e Command Center.
- **Compatibilidade:** prospects usam `state.leads`; importar não registra contato nem oportunidade.
- **Validação:** `npm run og:prospecting:test` e `npm run validate`.

## TASK-008 — Central Call AI

- **Data:** 2026-09-24.
- **Mudança observável:** Central contextual com 11 modos comerciais, visual compacto/expandido, resposta estruturada, pós-ligação revisável, feedback e ações confirmadas; a conta ativa acompanha Mesa e Prospecção sem vazamento.
- **Arquitetura:** contexto mínimo e orçamento central, seletor de conhecimento por intenção, prompts centralizados e `ai-service` independente de fornecedor com cache, métricas e fallback local.
- **Custo:** abrir Mesa, selecionar conta, abrir Call AI e usar template continuam com zero chamadas; somente gerar orientação ou personalizar solicita inteligência.
- **Validação:** `npm run og:call-ai:test` e `npm run validate`.

## Convenção para novas conclusões

Ao concluir uma TASK, registrar ID, data, mudança observável, arquivos principais, testes executados e limitações remanescentes. Mover o status em `TODO.md` sem apagar o histórico do objetivo original.
