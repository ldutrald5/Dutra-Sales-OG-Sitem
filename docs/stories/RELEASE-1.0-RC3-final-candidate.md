# DUTRA OS 1.0 RC3 — Final Candidate UX

Status: **em validação via PR/CI**

## Objetivo

Fechar os últimos riscos P1 conhecidos do fluxo principal antes do selo 1.0: diálogos legados sem gerenciamento de foco, navegação desktop saturada e módulos sem rota recuperável.

## Entregas

- controlador compartilhado para diálogos com:
  - `role="dialog"` / `aria-modal="true"`;
  - foco inicial intencional;
  - retenção de Tab/Shift+Tab;
  - Escape para fechar;
  - retorno do foco ao acionador;
  - bloqueio de rolagem do fundo;
  - clique no backdrop para fechamento previsível;
- importação de orçamento, importação/OCR de leads, preços de item, dores/ganchos e cadastro rápido passam a usar o mesmo controlador;
- prévia OCR recebe texto alternativo;
- cards interativos do catálogo ficam acessíveis por Enter/Espaço;
- navegação de módulos passa a usar hash recuperável, por exemplo `#crm`, `#prospeccao`, `#cotacao`;
- voltar/avançar do navegador restaura o módulo ativo;
- troca de módulo move o foco para o título da área;
- desktop mantém os cinco destinos mais usados visíveis e consolida ferramentas secundárias em **Mais**;
- menu **Mais** desktop fecha com Escape e marca estado ativo;
- Service Worker atualizado para v64;
- novo gate `og:final-candidate-ux:test` entra na suíte `validate`.

## Guardrails

- nenhuma regra comercial alterada;
- nenhuma migração de dados;
- nenhuma ação externa automatizada;
- nenhuma mudança no significado dos eventos;
- `state.leads`, Operations Model, outbox e sincronização continuam canônicos;
- nenhuma navegação cria fato comercial.

## Aceite

1. CI completo verde.
2. Todos os cinco overlays principais possuem semântica e retenção de foco.
3. Escape fecha os overlays e devolve foco.
4. `#crm` e demais hashes restauram o módulo correto.
5. voltar/avançar restaura módulo sem perder dados.
6. navegação desktop não depende mais de rolagem horizontal para descobrir módulos secundários.
7. produção publica exatamente o SHA do merge.
8. `/api/health` confirma o SHA.
9. Service Worker v64 é servido em produção.

## Gate manual restante para 1.0 FINAL

- smoke comercial completo em navegador real;
- PWA instalado recebendo update de versão anterior;
- offline → edição → reconexão;
- 320, 360, 390 e 430 px;
- teclado virtual aberto durante registro;
- navegação completa por teclado e zoom 200%.
