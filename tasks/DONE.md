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

## Integração Excel — primeira fatia somente leitura

- **Data:** 2026-09-24.
- **Mudança observável:** botão `Excel · Preview` no CRM, validação do modelo, leitura de registros e classificação contra a base atual sem persistência.
- **Proteções:** nenhuma escrita no workbook ou CRM; fórmulas, observações e estrutura são classificadas como protegidas.
- **Validação:** fixture estrutural do CRM, preservação de códigos/telefones textuais, conflito de observação e caracterização direta do Pós-Vendas.
- **Próximo passo:** validar com o arquivo CRM real antes de criar importação transacional.

## Integração Excel — conciliação campo a campo

- **Data:** 2026-09-24.
- **Mudança observável:** o preview agora compara cada campo com o cliente atual e permite manter o Sistema, usar o Excel, juntar textos protegidos ou ignorar a diferença.
- **Proteções:** a decisão padrão preserva o Sistema; resumo e observações exigem escolha humana; a aplicação ocorre somente após confirmação e registra arquivo, hash, linha e campos alterados.
- **Base analisada:** 30 clientes compartilhados, sem inclusões, exclusões ou duplicidades frente ao cadastro inicial; mudanças técnicas encontradas somente em `updatedAt` e inicialização de `calls`.
- **Validação:** criação, preservação, mesclagem de observações, atualização seletiva e suíte completa em `npm run validate`.

## TASK-009 — Central de Comunicação e OG Sales Brain

- **Data:** 2026-09-24.
- **Mudança observável:** Central contextual para WhatsApp e e-mail, templates versionados, editor, cópia, abertura do WhatsApp, rascunho e personalização opcional pelo mesmo motor do Call AI.
- **Sales Brain:** 13 IDs do JSONL preservados e governança normalizada; DOCX registrado somente como manual humano.
- **Segurança:** alegações pendentes/premissas são qualificadas, conhecimento usado fica rastreável e nenhuma abertura é marcada como envio.
- **Validação:** `npm run og:communication:test` e `npm run validate`.

## Continuidade de dados — sete proteções

- **Data:** 2026-09-24.
- **Implementado:** contrato para endereço permanente com KV, sincronização com conflito e merge, backups do servidor, dez snapshots automáticos no aparelho, exportação JSON, restauração não destrutiva e painel de sugestões.
- **Validação:** `npm run og:data-safety:test` e `npm run validate`.
- **Ativação externa pendente:** autenticar a conta Cloudflare, criar o KV e cadastrar o segredo de acesso.

Ao concluir uma TASK, registrar ID, data, mudança observável, arquivos principais, testes executados e limitações remanescentes. Mover o status em `TODO.md` sem apagar o histórico do objetivo original.

## TASK-007 — Painel lateral do cliente

- **Data:** 2026-09-27.
- **Mudança observável:** existe uma única ficha lateral do cliente, reutilizada por todas as superfícies comerciais que exibem ou selecionam uma conta. Meu Dia, CRM, Prospecção, Call AI, Comunicação, Cotação, Histórico, Performance/Operações, Command Center e reconciliação oferecem acesso direto à mesma ficha; o vendedor pode editar empresa, contato, Código OG, telefones extras, e-mail, CNPJ, cidade/UF, segmento, status, prioridade, decisor, frota, dor, objeções, próxima ação, observações e indicações sem criar uma segunda cópia do cliente.
- **Semântica do Código OG:** `internalCode` é código de cadastro no sistema da empresa e não significa compra; o DUTRA OS não gera código fictício e bloqueia duplicidade.
- **Busca:** Código OG passa a localizar a conta em CRM, Meu Dia e Call AI.
- **Continuidade:** histórico, Company 360 e materiais continuam acessíveis dentro da ficha; `lead.id`, sincronização e backups existentes foram preservados. A regra transversal é: **se uma superfície mostra um cliente identificado, ela deve oferecer acesso à ficha mestre sem obrigar navegação de ida e volta ao CRM.**
- **UX:** CRM foi simplificado para lista pesquisável + ficha lateral; ferramentas de importação foram rebaixadas para menu secundário; no celular a lista vira cartões e a ficha ocupa a tela com foco preso, Escape e alvos de toque mínimos.
- **Auditoria:** alterações registram `client.profile.updated`; mudança de código registra `client.og_code.updated`.
- **Validação:** `npm run og:client-sheet:test`, `npm run validate`, security/audit/release gate em CI.
- **Arquivos principais:** `apps/sistema-og/app.js`, `index.html`, `styles.css`, `services/crm-service.js`, `modules/sales-desk.js`, `scripts/test_client_sheet.mjs`.



## Templates canônicos de planilhas — captura real

- **Data:** 2026-09-27.
- **CRM oficial:** `CRM OG dr` foi confirmado pelo arquivo real anexado; abas `🚀 HOJE`, `📋 CRM`, `📥 LISTA` e `👥 CONTATOS`; identidade preta/amarela registrada. A incerteza anterior baseada em fixture sintética foi encerrada.
- **Vendas oficial:** `POS VENDAS LucasD Setembro26.xlsx` foi conferido diretamente; 15 abas, entradas D/E/H/I/J/K/M, fórmulas protegidas F/G/L e resumos E3/K1/K2/L2.
- **Governança:** os workbooks reais contêm dados comerciais e não são commitados. Nomes, fingerprints SHA-256, estrutura e contratos ficam em `docs/spreadsheets/canonical-templates.json`.
- **Papel dos arquivos:** formatos canônicos de importação/exportação e backup independente; o DUTRA OS permanece como fonte operacional após importação confirmada.
- **Próximo passo:** implementar `Exportar CRM Master` e `Exportar Vendas/Comissões` sempre sobre cópia versionada, preservando fórmulas, estilos e campos manuais.
