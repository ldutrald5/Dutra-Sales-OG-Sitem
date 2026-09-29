# DUTRA OS 1.0 FINAL — Checklist de release

Este arquivo é o gate operacional da versão 1.0. Um item só recebe **OK** quando existe evidência de código, CI ou produção.

## Fundação de produção

- [x] GitHub `main` é a fonte de verdade.
- [x] CI completo executa `validate`, Brain check, segurança, audit e release gate.
- [x] Railway publica o SHA esperado da `main`.
- [x] `/api/health` é público e identifica a release.
- [x] Volume de dados permanece montado em `/data`.
- [x] Build Node/npm é reproduzível no Railway.
- [x] Atualização PWA v63 confirmada em produção no RC2C.\n- [ ] Confirmar Service Worker v64 e SHA da RC3 em produção.

## Uso diário comercial

- [x] Meu Dia escolhe próxima missão usando motores canônicos.
- [x] Cliente atual oferece Ligar, WhatsApp, Registrar, Call AI e Ficha.
- [x] Abrir telefone/WhatsApp não registra contato como realizado.
- [x] Resultado exige confirmação explícita.
- [x] Próxima ação usa o contrato canônico.
- [x] Salvar e avançar usa a fila compartilhada.
- [x] Fila vazia oferece próxima ação útil.
- [x] CRM preserva histórico e dados locais.
- [ ] Executar smoke manual completo com um registro de teste descartável antes do selo final.

## Prospecção e DUTRA Research

- [x] Pesquisa passa pelo gateway server-side.
- [x] Firecrawl permanece sem segredo no browser.
- [x] Resultados exigem evidência pública.
- [x] Duplicidade é recalculada contra o CRM.
- [x] Importação exige confirmação humana.
- [x] Loading e falhas 401/429/503/504 têm mensagens operacionais.
- [ ] Executar um último teste real em produção e confirmar revisão sem autoimportar.

## Dados, offline e sincronização

- [x] App continua local-first.
- [x] Falha de rede mantém outbox.
- [x] Conflitos 409 não são sobrescritos silenciosamente.
- [x] Conciliação exige revisão e confirmação.
- [x] Status online/offline/conflito é visível.
- [x] Checkpoint local antecede descarte de versão conflitante.
- [ ] Simular offline → edição → reconexão em navegador real antes do selo final.

## PWA e mobile

- [x] Quatro destinos móveis primários + menu Mais.
- [x] Menu Mais fecha após navegação.
- [x] Menu Mais suporta Escape e retorno de foco.
- [x] Alvos principais têm mínimo de 44 px.
- [x] Conteúdo reserva espaço para barra inferior e safe-area.
- [x] Atualização de versão é explícita e não força reload.
- [ ] Validar 320×568, 360×800, 390×844 e 430×932 em navegador/aparelho real.
- [ ] Validar teclado virtual sem cobrir ação crítica.

## Segurança

- [x] Credencial hospedada não é persistida em localStorage.
- [x] Estado sincronizado não carrega Bearer token.
- [x] Proposta pública usa token opaco/hash e CSP.
- [x] Mensagens dinâmicas de toast entram como texto, não HTML.
- [x] `npm audit --audit-level=high` faz parte do CI.
- [ ] Rotacionar a chave Firecrawl que foi compartilhada em conversa antes de considerar credenciais definitivas de longo prazo.

## Acessibilidade e acabamento

- [x] Feedback principal usa `role=status`/alert conforme severidade.
- [x] Sync e Research usam regiões vivas.
- [x] Menu Mais expõe relação com a folha controlada.
- [x] Modais legados usam controlador comum de foco/Escape/retorno de foco.
- [x] Módulos têm rota por hash, foco no título e menu desktop compacto.\n- [ ] Validar navegação completa por teclado em navegador real.
- [ ] Validar zoom 200%.
- [ ] Fazer revisão final de textos, títulos e telas sem dados.

## Critério do selo 1.0 FINAL

A release só recebe o selo quando:
1. CI está verde no SHA candidato;
2. Railway está no mesmo SHA;
3. `/api/health` retorna esse SHA;
4. smoke comercial completo passa;
5. DUTRA Research real passa sem autoimport;
6. offline/reconexão passa;
7. QA móvel mínimo passa;
8. não existe P0/P1 conhecido aberto no fluxo principal.
