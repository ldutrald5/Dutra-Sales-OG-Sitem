# DUTRA OS 1.0 RC2B — feedback operacional e estados de sistema

## Objetivo
Remover incerteza durante o uso diário: o vendedor deve saber se o sistema salvou, sincronizou, está offline, está pesquisando ou precisa de uma ação.

## Mudanças observáveis
- toast seguro: mensagens dinâmicas entram como texto, nunca HTML;
- severidade visual e acessível para sucesso, aviso e erro;
- toast mobile acima da barra inferior;
- status de sincronização com `role=status`, `aria-live`, timestamp interno e estados visuais para online/offline/conflito;
- evento offline informa imediatamente que o trabalho continua salvo no aparelho;
- reconexão mostra estado intermediário antes de puxar/sincronizar;
- fila vazia do Meu Dia vira estado acionável com **Novo prospect** e, quando aplicável, **Ver fila completa**;
- DUTRA Research anuncia progresso, usa `aria-busy` e converte 401/429/503/504 em mensagens compreensíveis;
- mensagens técnicas do provedor não são despejadas diretamente na interface;
- cache PWA atualizado para v62.

## Integridade
- nenhuma alteração em score, CRM, eventos ou regras comerciais;
- nenhum envio automático novo;
- offline continua local-first;
- conflito continua exigindo revisão explícita;
- pesquisa continua `prepare_only` e importação continua humana.

## Aceite
- CI completo verde;
- `showNotification` não usa `innerHTML` com mensagem dinâmica;
- sync visível e acessível;
- pesquisa nunca parece travada silenciosamente;
- fila vazia oferece próxima ação útil;
- produção publica o SHA exato e `/api/health` confirma a release.
