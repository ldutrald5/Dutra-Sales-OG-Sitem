# DUTRA OS 1.0 RC2C — atualização PWA e confiabilidade mobile

Status: **em validação via PR/CI**

## Objetivo

Evitar que o vendedor use uma mistura de arquivos antigos e novos depois de um deploy e fechar riscos de navegação móvel antes da 1.0.

## Entregas

- detecção explícita de nova versão do Service Worker;
- banner **Nova versão do DUTRA OS pronta**;
- atualização somente após ação humana **Atualizar agora**;
- opção **Depois** sem reload forçado;
- nenhum `controllerchange` recarrega a tela silenciosamente;
- registro do Service Worker centralizado em `initServiceWorkerUpdates()`;
- menu móvel **Mais** declara `aria-haspopup` e `aria-controls`;
- Escape fecha o menu e devolve foco ao acionador;
- toque fora fecha a folha sem navegar;
- folha **Mais** ganha altura máxima e scroll próprio em telas curtas;
- alvos móveis principais sobem para mínimo de 44 px;
- ações do banner ficam acima da navegação inferior;
- cache PWA atualizado para v63;
- teste de regressão `og:pwa-release:test` entra em `validate`.

## Guardrails

- atualização não recarrega a página sem confirmação;
- nenhum dado comercial é alterado;
- nenhum schema é alterado;
- nenhum envio externo é automatizado;
- a outbox/sincronização existente permanece canônica;
- o menu móvel continua com quatro destinos primários e **Mais**.

## Aceite

1. CI completo verde.
2. Nova versão instalada gera aviso explícito em vez de reload silencioso.
3. O usuário pode adiar o reload.
4. Em 320–430 px, o menu **Mais** não ultrapassa a tela sem scroll.
5. Alvos principais têm no mínimo 44 px.
6. Service Worker v63 é servido em produção.
7. `/api/health` confirma o SHA publicado no Railway.

## QA manual ainda exigido para o selo 1.0 FINAL

- aparelho móvel real;
- teclado virtual aberto durante registro de resultado;
- PWA instalado recebendo atualização de uma versão anterior;
- zoom 200% no desktop;
- navegação completa por teclado.
