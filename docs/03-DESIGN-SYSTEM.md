# Design System

## Adoção experimental Precision Workspace

A Mesa recebe o primeiro lote da direção Precision Workspace em escopo local, sem substituir a linguagem Impacto OG das propostas. [Mapa de tokens, componentes, diferenças e limites](design/PRECISION_WORKSPACE_V1.md). Tokens globais OG e owners existentes permanecem a fonte; expansão para outras superfícies depende de validação do lote atual.

## Padrão existente

A interface usa preto e grafite como base, amarelo Olho de Gato para ações principais, laranja como luz editorial, verde para sucesso/WhatsApp e vermelho para risco. A direção é operacional, densa e legível, com imagens de frota e produto apenas quando ajudam a reconhecer o contexto.

Tokens atuais e mídia estão documentados em [Design System existente](design/sistema-og-design-system.md). Esse arquivo continua sendo a referência visual detalhada.

## Princípios incrementais

- Mostrar primeiro empresa, prioridade e próxima ação.
- Evitar cartões decorativos sem decisão associada.
- Manter ações frequentes em um clique e alvos de toque com ao menos 44 × 44 px.
- Usar painel lateral no desktop e tela/modal de altura total no celular.
- Preservar foco visível, contraste AA e navegação por teclado.
- Respeitar `prefers-reduced-motion`; animação comunica mudança, não atrasa operação.

## Catálogo alvo reutilizável

| Componente | Contrato mínimo |
|---|---|
| Button | variante, estado, loading, ícone e foco |
| IconButton | rótulo acessível, tooltip e alvo de toque |
| Card | título, corpo, ações e densidade |
| ClientRow | empresa, contato, status, prioridade e próxima ação |
| ClientDrawer | contexto, timeline e ações sem abandonar a fila |
| QuickAction | ação, ícone, confirmação e evento resultante |
| StatusBadge | texto obrigatório, cor sem significado isolado |
| Search | pesquisa incremental, vazio e teclado |
| CommandPalette | ação global, conta recente e atalho |
| Modal | foco preso, fechamento previsível e CTA claro |
| Toast | resultado curto, severidade e região `aria-live` |
| Input | label persistente, ajuda e erro associado |
| Select | busca quando extensa e valor vazio explícito |
| Tabs | teclado, estado selecionado e overflow móvel |
| Timeline | data, tipo, autor/fonte e conteúdo resumido |

## Evolução segura

Componentes devem ser extraídos ao tocar na funcionalidade correspondente, sem redesenhar toda a aplicação. Primeiro consolidar tokens/classes e contratos; depois substituir duplicações com teste visual e funcional. Não introduzir biblioteca de componentes apenas por preferência estética.
