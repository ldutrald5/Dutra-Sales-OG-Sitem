# Design System — Sistema OG

## Direção

Interface operacional escura com preto e grafite como base, amarelo OG para ações principais e laranja apenas como luz editorial. Verde fica reservado a sucesso e WhatsApp; vermelho, a risco. A tela deve responder rapidamente à pergunta: "quem precisa da minha atenção agora?".

## Tokens

- Brand: `#ffde17`
- Brand hover: `#f4c900`
- Editorial orange: `#f97316`
- Background: `#070707`
- Surface: `#15171b`
- Surface elevated: `#1d2025`
- Border: `#30343a`
- Success: `#22c55e`
- Danger: `#ef4444`
- Text: `#f8fafc`
- Muted: `#94a3b8`
- Radius: 12px / 18px
- Motion: 160ms para hover e foco

## Componentes

- KPI card: número, rótulo e explicação curta; clicável quando filtra uma lista.
- Opportunity card: empresa, contato, prioridade, follow-up e próxima ação.
- Coaching card: pergunta recomendada, evidência disponível e lacuna a preencher.
- Timeline: blocos de 09h, 11h, pós-almoço e 17h.
- Form field: rótulo persistente, foco visível e linguagem comercial direta.
- Hero operacional: caminhão e marca no plano visual, próximo passo e CTAs sobre overlay de alto contraste.
- Product proof: imagem do equalizador, três benefícios verificáveis e acesso ao consultor técnico.
- Vehicle visual: imagem própria por classe, nome textual e ligação com a árvore de decisão.

## Acessibilidade

- Contraste mínimo AA nos textos operacionais.
- Todos os controles acessíveis por Tab e acionáveis por Enter/Espaço.
- Labels explícitos nos campos e mensagens em região `aria-live` existente.
- Cores acompanhadas de texto; prioridade não depende apenas de cor.
- Alvo mínimo de toque de 44 × 44 px e foco amarelo de 2 px com offset.
- Movimento reduzido quando `prefers-reduced-motion` estiver ativo.

## Mídia

- Desktop usa `hero-desktop-1920.webp` ou `hero-desktop-1280.webp`.
- Celular usa uma composição vertical própria em `hero-mobile-960.webp` ou `hero-mobile-640.webp`.
- Imagens abaixo da primeira tela carregam com `loading="lazy"`.
- PNGs originais permanecem como fontes; a interface consome WebP otimizado.
