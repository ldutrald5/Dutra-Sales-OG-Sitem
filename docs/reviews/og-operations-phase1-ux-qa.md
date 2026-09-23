# Auditoria UX/QA — Fase 1 de Operações do Sistema OG

**Data:** 23/09/2026  
**Escopo:** auditoria somente leitura da aplicação atual em `apps/sistema-og`, com foco em navegação, componentes compartilhados, celular, acessibilidade, regressão e critérios de teste para a fundação da Central de Performance & Operações.  
**Referência:** WCAG 2.1 AA e o design system em `docs/design/sistema-og-design-system.md`.

## Resumo executivo

**Atualização da entrega:** o bloqueador P0 abaixo foi resolvido no recorte funcional da Fase 1. A navegação móvel passou a usar quatro colunas em duas linhas previsíveis, com 136 px reservados no rodapé, incluindo o novo destino Operações. Os achados P1, P2 e P3 permanecem no backlog e não são declarados como concluídos.

A base visual está madura: identidade OG consistente, hierarquia forte no Meu Dia, estados vazios orientativos, foco visível global e adaptação específica para o Call AI. A interface já comunica prioridade e próxima ação com clareza.

Antes de adicionar Biblioteca, Performance, Documentos e Comissões, a Fase 1 deve corrigir quatro riscos estruturais: navegação que não escala, barra móvel com seis itens em uma grade de cinco colunas, modais sem comportamento acessível consistente e tabelas/linhas do CRM dependentes de clique. Sem isso, cada novo módulo aumenta a dificuldade de descoberta e o custo de regressão.

### Classificação

| Nível | Quantidade | Significado |
|---|---:|---|
| P0 — bloqueador | 1 | Pode impedir navegação confiável no celular |
| P1 — alto | 5 | Afeta tarefas centrais, teclado ou leitores de tela |
| P2 — médio | 6 | Aumenta esforço, inconsistência ou risco de regressão |
| P3 — melhoria | 3 | Polimento recomendado após a fundação |

## O que funciona bem

- O Meu Dia apresenta uma ordem visual clara: orientação, ações principais, rotina, indicadores e fila.
- A identidade usa amarelo para ação, verde para sucesso e vermelho para risco, acompanhados por texto.
- O CSS possui foco global visível em `button`, `a`, `input`, `select` e `textarea`.
- Existe tratamento de `prefers-reduced-motion`.
- Imagens editoriais relevantes têm texto alternativo; imagens abaixo da primeira dobra usam carregamento tardio.
- A navegação móvel usa `aria-current="page"` e o Call AI já usa `aria-expanded`, `role="option"` e navegação por setas na busca.
- Cadastro rápido reutiliza o mesmo modal e o mesmo CRM em Meu Dia, CRM e Call AI, um bom precedente para componentes compartilhados.
- A gravação do Call AI depende de ação explícita e possui estados textuais de permissão, gravação, pausa, processamento, erro e conclusão.

## Achados prioritários

### P0. A navegação móvel possui seis botões em uma grade declarada com cinco colunas

**Evidência:** `initUnifiedExperience()` cria Meu Dia, Clientes, Call AI, Cotação, Vendas e Histórico. Em `styles.css`, `.og-mobile-nav` usa `grid-template-columns: repeat(5, 1fr)` e o `body` reserva apenas cerca de 78 px no rodapé.

**Impacto:** o sexto item cai em uma segunda linha, a barra cresce além do espaço reservado e pode cobrir conteúdo, botões fixos ou o status de sincronização. O comportamento varia com largura, zoom e área segura do aparelho.

**Recomendação:** definir uma arquitetura móvel com no máximo cinco destinos primários e um item **Mais**, ou adotar uma barra de cinco colunas com menu complementar. Calcular o espaçamento inferior a partir da altura real da barra. A nova área Performance deve entrar nessa arquitetura, não ser apenas o sétimo botão.

**Critério de aceite:** em 320, 360, 390 e 430 px, todos os destinos ficam acessíveis, nenhuma ação é encoberta e a barra ocupa uma única região previsível.

### P1. A navegação desktop já está saturada e esconde destinos à direita

**Evidência visual:** em 1270 px, a barra superior mostra até Vitrine; Transportadoras, Central de Vendas e Histórico ficam fora da primeira área visível. O contêiner usa rolagem horizontal com scrollbar escondida.

**Impacto:** usuários podem não descobrir módulos existentes. Biblioteca e Performance ampliariam o problema.

**Recomendação:** consolidar destinos em grupos previsíveis:

- **Trabalho:** Meu Dia, Clientes, Call AI.
- **Vendas:** Cotação, Central de Vendas, Biblioteca.
- **Operação:** Transportadoras, Catálogo, Suportes.
- **Gestão:** Performance, Histórico, Documentos.

No desktop, usar navegação lateral recolhível ou barra principal com menu **Mais**. Manter o destino ativo visível e persistir o último módulo.

### P1. Abas visuais não implementam o padrão semântico de abas nem rotas recuperáveis

**Evidência:** os botões `.nav-tab` alternam classes e `hidden`; não existe `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls` ou navegação pelas setas. O módulo atual também não é refletido em URL/hash.

**Impacto:** leitores de tela não recebem a relação aba/painel; atualizar a página sempre retorna a Meu Dia; links internos não podem abrir diretamente um cliente ou módulo. Isso será especialmente custoso para documentos, vendas e dashboards filtrados.

**Recomendação:** escolher uma das soluções de forma consistente:

1. Tratar destinos como navegação de aplicação com links/rotas e `aria-current`; ou
2. Implementar integralmente o padrão ARIA de abas, incluindo setas, `tabindex` e relações entre aba e painel.

Para a expansão operacional, rotas/hash são preferíveis porque permitem URLs recuperáveis e estado de navegação.

### P1. Três modais não têm semântica de diálogo e nenhum modal gerencia foco completamente

**Evidência:** importação de leads, preço de item, dores/ganchos e importação de cotação são apenas `div` fixas. Somente cadastro rápido possui `role="dialog"`, `aria-modal="true"` e `aria-labelledby`. As rotinas de abertura/fechamento não bloqueiam o foco no modal, não fecham globalmente com Escape e não devolvem foco ao acionador.

**Impacto:** teclado e leitor de tela podem continuar navegando pelo conteúdo atrás do modal. Ao fechar, o usuário perde o ponto de contexto.

**Recomendação:** criar um único componente/controlador de diálogo com:

- `role="dialog"`, `aria-modal="true"`, título e descrição associados;
- foco inicial intencional;
- contenção de Tab/Shift+Tab;
- Escape para fechar quando seguro;
- retorno de foco ao botão que abriu;
- bloqueio de rolagem do fundo;
- confirmação própria para ações destrutivas.

### P1. Campos visualmente rotulados não possuem associação programática consistente

**Evidência:** muitos `label` antecedem inputs/selects, mas não usam `for`; outros controles dependem apenas de placeholder ou `title`. A prévia OCR (`ocr-preview-img`) também não define `alt` quando recebe uma imagem.

**Impacto:** leitores de tela podem anunciar “edit text” sem contexto; clicar no rótulo não foca o campo; placeholders deixam de servir como instrução após digitação.

**Recomendação:** adicionar `for`/`id` em todos os pares, `aria-describedby` para ajuda/erro, nomes acessíveis para botões apenas com ícone e `alt` dinâmico para a prévia OCR. Incluir um teste automatizado que falhe quando um controle de formulário visível não possuir nome acessível.

### P1. Linhas clicáveis do CRM não são operáveis por teclado

**Evidência:** o `tr` recebe listener de clique para abrir o inspetor, mas não é link nem botão e não possui `tabindex` ou tratamento de Enter/Espaço.

**Impacto:** quem usa teclado não consegue abrir a ficha do cliente pela tabela.

**Recomendação:** colocar o nome da empresa em um `<button>` ou link real dentro da célula. Evitar tornar a linha inteira um pseudo-controle. Preservar seleção por checkbox sem acionar a abertura.

### P2. Touch targets estão inconsistentes com o próprio design system

**Evidência:** o design system exige 44 × 44 px. No celular existe regra global de 42 px; opções de veículo têm 36 px e controles da gravação do Call AI, 32 px.

**Impacto:** maior chance de toque errado em uso durante ligação ou deslocamento.

**Recomendação:** aplicar 44 px aos controles de ação e navegação. Chips estritamente auxiliares podem manter aparência compacta com área clicável interna ampliada.

### P2. A tabela do CRM preserva largura mínima de 720 px no celular

**Evidência:** a media query móvel força `table { min-width: 720px; }` e depende de rolagem horizontal.

**Impacto:** leitura e ação exigem movimentos laterais repetidos; informações essenciais e ações ficam separadas. Performance, Comissões e Documentos multiplicariam tabelas semelhantes.

**Recomendação:** criar um componente responsivo compartilhado:

- tabela no desktop;
- cards ou linhas empilhadas no celular;
- colunas secundárias em detalhes expansíveis;
- ação principal sempre visível;
- cabeçalho fixo apenas quando necessário.

### P2. Estados de filtro não são anunciados de maneira uniforme

**Evidência:** chips de Meu Dia recebem classe `active`, mas não há `aria-pressed`; somente a seleção de veículos sincroniza `aria-pressed`.

**Impacto:** tecnologias assistivas não identificam qual filtro está ativo.

**Recomendação:** usar botões toggle com `aria-pressed`, ou um grupo de radios quando apenas um filtro puder ficar ativo. O estado visual e o estado acessível devem vir da mesma função compartilhada.

### P2. Mudança de módulo não reposiciona o foco no desktop

**Evidência:** `switchTab()` apenas mostra o painel e, no celular, rola ao topo. Não move o foco para o título do novo conteúdo nem anuncia a mudança.

**Impacto:** usuários de teclado/leitor de tela permanecem no botão de navegação sem confirmação clara sobre o novo conteúdo.

**Recomendação:** após mudança iniciada pelo usuário, focar o `h1` do painel com `tabindex="-1"` ou anunciar o título em região adequada. Evitar movimento de foco durante restauração silenciosa de estado.

### P2. Status dinâmicos precisam de estratégia única de anúncio

**Evidência:** o toast recebe `aria-live="polite"`, mas status de sincronização, OCR, gravação e resultados atualizam texto sem região viva consistente.

**Impacto:** mudanças importantes podem não ser percebidas por leitores de tela.

**Recomendação:** criar componentes compartilhados de status:

- `role="status"`/`aria-live="polite"` para sucesso e progresso;
- `role="alert"` apenas para erros que exigem atenção;
- textos curtos e sem repetição;
- estado visual acompanhado por texto.

### P2. A hierarquia de títulos não é garantida em todos os módulos dinâmicos

**Evidência:** Meu Dia e Call AI possuem `h1`, mas vários módulos começam com `h2` e cards dinâmicos podem introduzir títulos sem uma raiz de página clara.

**Impacto:** navegação por cabeçalhos fica inconsistente e a adição de Performance pode aprofundar a estrutura incorreta.

**Recomendação:** cada módulo visível deve ter um único `h1`; seções internas usam `h2`; cards usam `h3`. Painéis ocultos devem permanecer ocultos também da árvore acessível, como já ocorre com `hidden`.

### P2. Sobreposição de elementos fixos pode aumentar com novos módulos

**Evidência:** navegação móvel, status de sincronização, barra de ações em lote e rodapé sticky do Call AI usam camadas e offsets independentes.

**Impacto:** combinações como seleção em lote + status offline + navegação podem encobrir ações, especialmente com teclado virtual.

**Recomendação:** definir tokens de altura/camada e uma única “zona fixa inferior”. Barras contextuais devem posicionar-se acima da navegação usando o mesmo token e respeitar `safe-area-inset-bottom`.

### P3. Textos operacionais usam tamanhos muito pequenos

**Evidência:** diversos elementos usam 9–11 px e o Call AI chega a `.55rem`–`.68rem`.

**Impacto:** legibilidade baixa em telas pequenas, zoom e ambientes externos.

**Recomendação:** texto operacional mínimo de 12 px; conteúdo principal de 14–16 px; 10–11 px apenas para metadado não essencial.

### P3. Emojis e SVGs precisam de uma regra semântica uniforme

**Evidência:** alguns emojis têm `aria-hidden`, outros fazem parte do nome do botão; SVGs decorativos não usam sempre `aria-hidden="true"`.

**Impacto:** leitores de tela podem anunciar nomes ruidosos ou inconsistentes.

**Recomendação:** esconder ícones decorativos e manter o texto como nome acessível. Ícones informativos precisam de rótulo explícito.

### P3. O hover global dos cards pode sugerir interação em superfícies estáticas

**Evidência:** `.clean-card:hover` eleva e realça todas as superfícies, mesmo quando não clicáveis.

**Impacto:** reduz a clareza do que é acionável.

**Recomendação:** reservar hover/elevation para links e botões; cards estáticos mantêm superfície estável.

## Componentes compartilhados recomendados para a Fase 1

| Componente | Responsabilidade | Uso inicial |
|---|---|---|
| `AppNavigation` | grupos, estado ativo, desktop/mobile e menu Mais | todos os módulos |
| `PageHeader` | `h1`, descrição, ação primária e breadcrumbs opcionais | CRM, Biblioteca, Performance |
| `Dialog` | foco, Escape, retorno, título e descrição | cadastro, importações, modelos |
| `FormField` | label, ajuda, obrigatório, erro e nome acessível | cadastro, vendas, comissões |
| `StatusMessage` | progresso, sucesso, alerta e anúncio acessível | sincronização, OCR, documentos |
| `FilterBar` | pesquisa, filtros, estado ativo e limpar filtros | CRM, Biblioteca, Performance |
| `ResponsiveDataView` | tabela desktop e cards móveis | clientes, vendas, comissões |
| `EmptyState` | explicação, ação principal e próxima etapa | novos módulos sem dados |
| `ConfirmAction` | confirmação contextual de ações destrutivas | exclusão, descarte, substituição |
| `PeriodSelector` | período atual, anterior e intervalo customizado | dashboards e relatórios |

## Riscos de regressão na expansão operacional

1. **Cadastro duplicado:** novos formulários criarem clientes fora de `state.leads`/registro único.
2. **Navegação invisível:** novos módulos serem adicionados como mais botões na barra atual.
3. **Dados silenciosamente zerados:** dashboards tratarem ausência de histórico como zero real.
4. **Valores incoerentes:** venda, cotação, documento e comissão recalcularem totais separadamente.
5. **Migração destrutiva:** mudança de schema sobrescrever `localStorage` ou estado compartilhado.
6. **Conflito entre aparelhos:** celular e desktop atualizarem o mesmo registro sem versão/data de modificação.
7. **Cache antigo do PWA:** service worker servir HTML/JS de versões diferentes após deploy.
8. **PDF divergente:** prévia e arquivo exportado usarem dados ou arredondamentos diferentes.
9. **Filtros sem fonte única:** KPI, gráfico e tabela apresentarem totais diferentes para o mesmo período.
10. **Privacidade:** screenshots, gravações ou documentos reais entrarem no Git ou em fixtures.
11. **Performance:** renderização integral de históricos, materiais e vendas degradar aparelhos móveis.
12. **Camadas fixas:** novas barras contextuais cobrirem Call AI, navegação ou teclado virtual.

## Critérios de teste da Fase 1

### Navegação

- Cada módulo é acessível pelo desktop e pelo celular.
- O módulo ativo permanece visível e é anunciado com `aria-current` ou semântica de abas completa.
- Atualizar a página restaura o módulo/rota esperado.
- Voltar/avançar do navegador funciona sem perder dados não salvos silenciosamente.
- Todos os destinos continuam acessíveis em 200% de zoom e 320 px de largura.
- Adicionar Biblioteca e Performance não cria rolagem oculta sem indicação.

### Teclado e foco

- Toda ação pode ser concluída com Tab, Shift+Tab, Enter, Espaço e Escape.
- O foco possui indicador visível e não fica atrás de barras fixas.
- Ao abrir um diálogo, o foco entra nele e não escapa.
- Ao fechar, o foco retorna ao acionador.
- Linhas de cliente, filtros, cards de KPI e controles do Call AI são acionáveis por teclado.
- Não existem focos em conteúdo oculto.

### Leitor de tela

- Cada módulo tem um `h1` único e landmarks coerentes.
- Todos os campos têm nome acessível e erros associados.
- Filtros anunciam selecionado/não selecionado.
- Progresso, sucesso, falha e sincronização são anunciados sem repetição excessiva.
- Ícones decorativos não poluem nomes acessíveis.
- Tabelas usam cabeçalhos e escopo adequados; a alternativa móvel mantém as relações entre rótulo e valor.

### Responsividade

- Validar 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768 e 1440×900.
- Nenhum botão importante fica coberto pela navegação, status, toolbar ou teclado virtual.
- Alvos de toque principais medem ao menos 44 × 44 px.
- Tabelas possuem alternativa utilizável em celular.
- Textos longos de empresa, CNPJ, ação e documento não rompem cards.
- Zoom de 200% não causa perda de conteúdo ou funcionalidade.

### Dados e estados

- Loading, vazio, parcial, erro e sucesso existem para cada módulo.
- “Sem dados” não é exibido como “zero” em indicadores.
- Datas e valores usam a mesma regra em card, tabela, gráfico, PDF e Excel.
- Uma nova entidade inclui `id`, origem, data de criação, data de alteração e versão de schema.
- Migração é aditiva, idempotente e mantém cópia anterior.
- Conflitos de sincronização não sobrescrevem alterações sem aviso.

### PWA e regressão

- Atualização do service worker não mistura versões de assets.
- Fluxos críticos funcionam offline quando prometido; ações que exigem servidor explicam a indisponibilidade.
- Instalação, abertura por ícone e retomada preservam navegação e dados.
- Nenhuma chave, gravação, PDF real, planilha real ou `.data` entra no repositório.
- Os testes atuais continuam passando: `og:check`, `og:call-ai:test`, `og:product:test` e `aiox:config-check`.

## Quality gates recomendados

1. **Lint estrutural de acessibilidade:** campos sem nome, imagens sem `alt`, botões sem nome e diálogos sem título.
2. **Teste de navegação:** destino ativo, rota restaurada e painel único visível.
3. **Teste de diálogo:** foco inicial, contenção, Escape e retorno.
4. **Teste responsivo:** screenshots em desktop e quatro larguras móveis, incluindo conteúdo longo.
5. **Teste de contrato de dados:** schema, migração idempotente e totais consistentes.
6. **Teste de PWA:** versão do cache, atualização e fallback offline.
7. **Revisão manual:** teclado, NVDA, 200% de zoom e aparelho móvel real antes do release.

## Ordem recomendada de correção

1. Corrigir a arquitetura da navegação desktop/móvel.
2. Criar `Dialog`, `FormField` e `StatusMessage` compartilhados.
3. Tornar CRM e filtros completamente operáveis por teclado.
4. Criar a visualização responsiva compartilhada para dados tabulares.
5. Padronizar foco após navegação, headings e regiões vivas.
6. Só então adicionar Biblioteca e Performance sobre esses componentes.

## Limites desta auditoria

- Foi feita inspeção estática de HTML, CSS e JavaScript e validação visual do Meu Dia em desktop no servidor local.
- Não houve alteração no código da aplicação nem nos dados.
- Contraste foi avaliado pelos tokens e pela inspeção visual, sem medição automatizada pixel a pixel de todos os estados.
- NVDA, teclado completo, zoom e aparelhos físicos ainda precisam de execução manual no gate de release.
