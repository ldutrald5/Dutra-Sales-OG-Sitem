# Story OG-2 — Modernização visual do Sistema OG

## Status

Ready for Review

## Story

**Como** usuário do Sistema OG,  
**quero** uma interface visualmente marcante e coerente com a Olho de Gato em computador e celular,  
**para que** o sistema seja agradável de usar, apresente o produto com clareza e tenha aparência profissional sem perder os dados e fluxos comerciais existentes.

## Objetivo

Aplicar ao Sistema OG a nova direção visual em preto, amarelo, branco e laranja, integrando os assets premium já produzidos para hero desktop, hero mobile e produto instalado. A modernização deve preservar integralmente as funções e os dados atuais, responder bem a diferentes tamanhos de tela e manter desempenho, legibilidade e acessibilidade.

## Escopo

### Incluído

- Integração dos assets `07`, `08` e `09` nas áreas adequadas da interface.
- Hero específico para desktop e hero específico para celular.
- Apresentação visual do produto Olho de Gato instalado na roda.
- Aplicação consistente da identidade preto/amarelo/branco/laranja.
- Representação visual das categorias de caminhões já previstas pelo sistema, usando imagens próprias e sem copiar imagens de terceiros.
- Ajustes de layout, contraste, tipografia, estados interativos e responsividade necessários à modernização.
- Otimização da entrega das imagens e respeito às preferências de redução de movimento.
- Verificação de regressão dos fluxos, dados e persistência existentes.

### Fora do escopo

- Alterar regras de cotação, CRM, priorização ou lógica comercial.
- Migrar, excluir ou reestruturar dados de clientes.
- Adicionar novas integrações externas, autenticação ou funcionalidades comerciais.
- Copiar fotografias, marcas ou material protegido de páginas de referência.

## Requisitos

- **FR-1:** Exibir `07-hero-desktop-olho-de-gato-v2.png` como imagem principal adequada ao layout de computador.
- **FR-2:** Exibir `08-hero-mobile-olho-de-gato-v2.png` como imagem principal adequada ao layout de celular, sem depender de recorte inadequado do asset desktop.
- **FR-3:** Integrar `09-produto-olho-de-gato-v2.png` em uma área de apresentação do produto, mantendo o equalizador legível e sem distorção.
- **FR-4:** Aplicar preto, amarelo, branco e laranja como identidade predominante da interface, removendo o verde-esmeralda como cor de destaque principal.
- **FR-5:** Mostrar categorias visuais de caminhões de forma coerente com os tipos usados no sistema e permitir que a categoria seja identificada por texto, não apenas pela imagem.
- **FR-6:** Preservar navegação, cotação, CRM, painel comercial, dados existentes e persistência local.
- **FR-7:** Adaptar hero, conteúdo, cartões e navegação para celular e computador sem sobreposição, corte de controles ou rolagem horizontal indevida.
- **NFR-1:** Otimizar imagens e carregamento para evitar que a nova camada visual torne o uso perceptivelmente lento, sobretudo em conexão móvel.
- **NFR-2:** Manter contraste legível, foco visível, textos alternativos úteis e operação por teclado nos controles interativos.
- **NFR-3:** Tratar imagens como conteúdo de apoio: falha no carregamento não pode impedir o uso das funções comerciais.
- **NFR-4:** Animações, caso já existam ou sejam usadas na composição, devem ser discretas e desativadas quando o sistema operacional solicitar redução de movimento.

## Critérios de aceite

- [ ] Em largura de desktop, o hero utiliza o asset `07` com texto e ações legíveis, sem esconder controles do sistema.
- [ ] Em largura de celular, o hero utiliza o asset `08` e não apresenta rolagem horizontal ou elementos sobrepostos.
- [ ] O asset `09` aparece na apresentação do produto sem esticar, achatar ou cortar o componente central.
- [ ] A interface usa preto, amarelo, branco e laranja de maneira consistente; verde-esmeralda não permanece como destaque dominante.
- [ ] As categorias de caminhões exibidas possuem imagem e identificação textual correspondente.
- [ ] Nenhuma imagem de referência externa é copiada para o produto final.
- [ ] Todos os clientes, observações, follow-ups e demais dados existentes continuam disponíveis após a atualização.
- [ ] Os fluxos atuais de cotação, CRM e Meu Dia continuam executáveis do início ao fim.
- [ ] A interface permanece utilizável com as imagens indisponíveis ou ainda carregando.
- [ ] Controles interativos apresentam foco visível e podem ser alcançados por teclado.
- [ ] Imagens informativas possuem texto alternativo; imagens decorativas não geram ruído para leitores de tela.
- [ ] A experiência respeita `prefers-reduced-motion`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam, quando esses scripts estiverem disponíveis no projeto.

## Tarefas e subtarefas

- [x] **1. Auditar a interface atual e mapear pontos de integração**
  - [x] Identificar hero, login/início, apresentação do produto e seletor de categorias.
  - [x] Registrar os seletores, eventos e estruturas de dados que não podem sofrer regressão.
  - [x] Confirmar os breakpoints já usados antes de ajustar a responsividade.

- [x] **2. Consolidar a identidade visual**
  - [x] Definir tokens reutilizáveis para preto, amarelo, branco, laranja, superfícies, texto, bordas e estados de foco.
  - [x] Substituir destaques verde-esmeralda pelos novos tokens sem reduzir contraste.
  - [x] Manter hierarquia visual consistente entre títulos, indicadores, cartões e ações.

- [x] **3. Integrar os assets premium**
  - [x] Aplicar o asset `07` no hero desktop.
  - [x] Aplicar o asset `08` no hero mobile por fonte responsiva apropriada.
  - [x] Aplicar o asset `09` na área de produto com proporção preservada.
  - [x] Adicionar fallback visual e textos alternativos conforme a função de cada imagem.

- [x] **4. Implementar categorias visuais de caminhões**
  - [x] Mapear as categorias existentes para imagens próprias disponíveis.
  - [x] Exibir nome textual junto a cada categoria.
  - [x] Garantir seleção clara, foco visível e funcionamento em toque e teclado.

- [x] **5. Ajustar desktop e mobile**
  - [x] Validar hero, cartões, navegação e áreas operacionais em telas pequenas e grandes.
  - [x] Corrigir recortes, contraste de texto sobre imagem e sobreposições.
  - [x] Evitar que elementos decorativos concorram com próximas ações e dados comerciais.

- [x] **6. Otimizar mídia e movimento**
  - [x] Entregar imagens em dimensões e formatos adequados ao contexto de exibição.
  - [x] Evitar carregamento antecipado de mídia fora da primeira tela quando desnecessário.
  - [x] Implementar comportamento compatível com `prefers-reduced-motion`.

- [x] **7. Validar acessibilidade e regressão funcional**
  - [x] Verificar teclado, foco, contraste, textos alternativos e zoom.
  - [x] Testar cotação, CRM, Meu Dia e persistência dos dados existentes.
  - [x] Executar os quality gates disponíveis e registrar os resultados nesta story.
  - [x] Atualizar checkboxes, notas de conclusão e File List antes da revisão.

## Validação

- Comparar visualmente as versões desktop e mobile, incluindo carregamento lento e falha de imagem.
- Executar uma cotação completa e abrir/editar um cliente existente antes e depois da mudança.
- Recarregar o aplicativo e confirmar que observações, follow-ups e dados persistidos continuam presentes.
- Navegar pelas ações principais usando somente teclado.
- Verificar o layout com zoom ampliado e com redução de movimento ativada.
- Confirmar que os assets de referência externos não foram incorporados ao pacote final.

## 🤖 CodeRabbit Integration

**Primary Type:** Frontend / UX Design  
**Secondary Types:** Accessibility, performance, regression  
**Complexity:** Medium

**Agentes indicados:**

- `@ux-design-expert`: consistência visual, responsividade e acessibilidade.
- `@dev`: implementação e preservação dos fluxos existentes.
- `@qa`: regressão funcional e validação dos critérios de aceite.

**Quality gates:**

- [x] Revisão pré-conclusão: conferir cada critério de aceite e ausência de regressão visual.
- [x] Revisão técnica: validar carregamento responsivo das imagens, fallbacks e semântica.
- [x] Revisão de QA: validar desktop, mobile, teclado, redução de movimento e dados persistidos.

**Focos da revisão:** contraste, recortes responsivos, peso das imagens, estados de foco, textos alternativos, integridade dos dados e preservação dos fluxos comerciais.

## Dependências

- Story `OG-1-copiloto-comercial-integrado.md`, que contém os fluxos e dados que devem ser preservados.
- Assets premium `07`, `08` e `09` já disponíveis no projeto.
- Imagens próprias das categorias de caminhões já disponíveis ou aprovadas durante a implementação.

## File List inicial

Arquivos previstos para referência ou alteração pelo agente implementador; a lista final deve refletir somente o que for realmente modificado:

- `docs/stories/OG-2-modernizacao-visual-sistema-og.md`
- `apps/sistema-og/index.html`
- `apps/sistema-og/styles.css`
- `apps/sistema-og/app.js`
- `apps/sistema-og/assets/premium/07-hero-desktop-olho-de-gato-v2.png`
- `apps/sistema-og/assets/premium/08-hero-mobile-olho-de-gato-v2.png`
- `apps/sistema-og/assets/premium/09-produto-olho-de-gato-v2.png`
- `apps/sistema-og/assets/premium/04-caminhoes-pesados.png`
- `apps/sistema-og/assets/premium/05-caminhoes-medios.png`
- `apps/sistema-og/README.md`
- `apps/sistema-og/manifest.webmanifest`
- `apps/sistema-og/service-worker.js`
- `apps/sistema-og/assets/premium/optimized/hero-desktop-1920.webp`
- `apps/sistema-og/assets/premium/optimized/hero-desktop-1280.webp`
- `apps/sistema-og/assets/premium/optimized/hero-mobile-960.webp`
- `apps/sistema-og/assets/premium/optimized/hero-mobile-640.webp`
- `apps/sistema-og/assets/premium/optimized/produto-og-1280.webp`
- `apps/sistema-og/assets/premium/optimized/produto-og-768.webp`
- `apps/sistema-og/assets/premium/optimized/caminhoes-pesados-960.webp`
- `apps/sistema-og/assets/premium/optimized/caminhoes-medios-960.webp`
- `apps/sistema-og/assets/icons/icon-192.png`
- `apps/sistema-og/assets/icons/icon-512.png`
- `apps/sistema-og/assets/vendor/tailwindcss.js`
- `scripts/optimize-og-assets.mjs`
- `docs/design/sistema-og-design-system.md`

## Dev Agent Record

### Agent Model Used

GPT-6 Codex

### Debug Log References

- `npm run og:check` — passou.
- `npm run aiox:config-check` — passou.
- `npm run aiox:doctor` — 17 PASS, 1 aviso informativo do npm/npx no Windows, 0 falhas.
- Navegação local verificada no navegador: Meu Dia → Cotação → Consultor; seleção visual de pesados atualizou a árvore técnica.
- Referências de mídia verificadas: 8 arquivos, 0 ausentes.
- O projeto não define scripts `lint`, `typecheck`, `test` ou `build`; foram executados todos os gates disponíveis.

### Completion Notes

- Heroes responsivos, bloco de produto e categorias visuais integrados sem alterar regras de cotação ou CRM.
- Assets convertidos para WebP: aproximadamente 38–181 KB por variante, contra cerca de 1,4–2,1 MB nos PNGs-fonte.
- Tokens consolidados em preto, amarelo OG, branco e laranja; verde mantido apenas para estados semânticos.
- Foco global visível, `aria-current`, `aria-live`, alvos de toque e `prefers-reduced-motion` adicionados.
- Service worker atualizado para o cache `sistema-og-v5`, com Tailwind local, ícones PWA corretos e fallback offline restrito à navegação.
- O seletor visual passou a exigir a composição exata do veículo antes de aplicar a regra técnica, evitando cotação incorreta por agrupamento amplo.

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-20 | 0.1 | Criação da story de modernização visual | @sm |
| 2026-09-20 | 1.0 | Implementação visual, mídia otimizada, acessibilidade e validação | @dev |
| 2026-09-23 | 1.1 | Correções de QA: seleção exata de veículos, PWA offline, ícones e MIME WebP | @dev |
