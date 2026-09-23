# OG-13 — Fundação: navegação, componentes compartilhados e testes fundamentais

## Status

In Progress — destino Operações e regressão fundamental entregues; componentes compartilhados e acessibilidade ampla pendentes

## História

**Como** vendedor usando computador e celular,  
**quero** uma base de navegação consistente e componentes reutilizáveis,  
**para que** os novos módulos possam ser adicionados sem deixar o sistema pesado, confuso ou incompatível com o PWA atual.

## Resultado esperado

Preparar a estrutura visual e os contratos de interface da Fase 1, preservando os fluxos existentes. As áreas futuras podem aparecer como rotas ou entradas claramente marcadas como indisponíveis/planejadas, sem dados fictícios nem controles que prometam funções inexistentes.

## Requisitos rastreáveis

| ID | Requisito | Origem |
|---|---|---|
| FR-F1-13 | Criar uma arquitetura de navegação capaz de receber Biblioteca, Performance e áreas operacionais futuras. | Missão Fase 1 e §§4, 7 |
| FR-F1-14 | Definir componentes compartilhados para cards, filtros, estados vazios, status, prévia, seleção e feedback. | Missão §§4.3, 7, 18 |
| FR-F1-15 | Manter os fluxos existentes de Meu Dia, CRM, Call AI, Cotação e ROI funcionais. | Missão §§3, 22; OG-10 |
| FR-F1-16 | Exibir estados honestos para dado insuficiente, conteúdo em rascunho e dependência de material oficial. | Missão §§7, 9, 10, 16, 25 |
| NFR-F1-06 | Layout responsivo, operável por toque e teclado, sem rolagem horizontal indevida. | Missão §§17, 18, 22 |
| NFR-F1-07 | Componentes devem preservar contraste, foco visível e semântica acessível. | Missão §18 e testes visuais §22 |
| NFR-F1-08 | Falta de rede ou de mídia não impede funções locais já disponíveis. | Local-first/PWA; OG-2 NFR-3 |
| CON-F1-05 | Não incluir gráficos ou indicadores simulados como se fossem dados reais. | Missão §7.1 |
| CON-F1-06 | Não criar autenticação fictícia. | Missão §13 |

## Escopo

### Incluído

- Mapa de navegação futuro e hierarquia de informações.
- Componentes base reutilizáveis dentro do padrão atual do aplicativo.
- Estados vazio, carregando, erro, rascunho, bloqueado e dados insuficientes.
- Entrada da área **Performance** e da **Biblioteca Comercial** somente quando houver destino funcional ou estado planejado inequívoco.
- Estratégia de responsividade e acessibilidade.
- Testes fundamentais de regressão, navegação e PWA.
- Atualização segura do cache do service worker quando houver alteração de assets.

### Fora do escopo

- Funcionalidades completas das fases 2–9.
- Dashboard com métricas.
- Upload de materiais.
- Exportação de documentos.
- Login e permissões reais.
- Novo design system paralelo ao existente.

## Critérios de aceite

- [ ] O mapa de navegação distingue tarefas diárias, clientes, conteúdo, operação e administração.
- [ ] Desktop e celular oferecem acesso às funções atuais sem aumentar desnecessariamente a profundidade de navegação.
- [ ] Componentes base possuem estados padrão documentados e exemplos sem dados reais.
- [x] Estados indisponíveis informam por que a função ainda não está ativa e qual entrada oficial falta quando aplicável.
- [x] Nenhum controle visual inicia gravação, envio, alteração de CRM ou geração de documento sem ação explícita.
- [x] Meu Dia, CRM, Call AI, Cotação e ROI continuam executáveis após a fundação.
- [x] Não há números de venda, conversão, comissão ou atividade inventados.
- [ ] Navegação e controles principais funcionam por teclado e toque.
- [ ] Foco é visível, textos têm contraste adequado e estados não dependem apenas de cor.
- [ ] Não ocorre rolagem horizontal indevida nos breakpoints de celular definidos pelo projeto.
- [x] O PWA continua carregando a interface local disponível e o cache é versionado quando necessário.
- [x] Testes fundamentais cobrem navegação da fundação, ausência de dados e preservação dos fluxos existentes.

## Tarefas e subtarefas

- [ ] **1. Auditar a navegação atual**
  - [ ] Mapear destinos, atalhos e duplicações.
  - [ ] Identificar limites de desktop e celular.
  - [ ] Preservar seletores/eventos usados pelos testes atuais.
- [ ] **2. Definir arquitetura de informação**
  - [ ] Agrupar funções sem esconder Meu Dia e próxima ação.
  - [ ] Posicionar Biblioteca e Performance no mapa futuro.
  - [ ] Documentar regras de expansão do menu.
- [ ] **3. Consolidar componentes base**
  - [ ] Card, badge/status, filtro, pesquisa e seleção.
  - [ ] Estado vazio, rascunho, bloqueado, erro e dados insuficientes.
  - [ ] Modal/painel responsivo, prévia e confirmação explícita.
- [ ] **4. Validar acessibilidade e responsividade**
  - [ ] Teclado, foco, semântica e contraste.
  - [ ] Desktop, tablet e celular.
  - [ ] Textos e nomes extensos.
- [ ] **5. Criar regressão fundamental**
  - [ ] Fluxos já implementados.
  - [ ] Estados sem dados.
  - [ ] PWA e service worker.
  - [ ] Ausência de ações automáticas.

## Dependências

- OG-11 para contratos de dados e status.
- OG-12 para integrar componentes à persistência migrada.
- Design system existente em `docs/design/`.
- Fluxos implementados nas OG-1, OG-2, OG-3 e OG-10.

## Validação prevista

- `npm run og:check`
- `npm run og:call-ai:test`
- `npm run og:product:test`
- `npm run aiox:config-check`
- Quality gates de `AGENTS.md` quando scripts correspondentes existirem.
- Testes visuais em desktop, tablet e celular.

## File List

Lista prevista; manter somente os arquivos realmente alterados ao concluir:

- `docs/stories/OG-13-fundacao-navegacao-componentes-testes.md`
- `docs/architecture/sistema-og-information-architecture.md`
- `docs/design/sistema-og-design-system.md`
- `apps/sistema-og/index.html`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/app.js`
- `apps/sistema-og/service-worker.js`
- `scripts/test_operations_foundation.mjs`
- `scripts/test_product_evolution.mjs`

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 0.1 | Story criada a partir da Fase 1 da missão operacional | @po/@sm |
| 2026-09-23 | 0.2 | Fundacão visual de Operações, correção da barra móvel e regressão automatizada entregues | Codex |
