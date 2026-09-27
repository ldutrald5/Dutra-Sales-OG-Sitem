# IMPLEMENTATION PACKAGE 05R REPORT

## Resultado atual

**PACKAGE 05R — IMPLEMENTADO E VALIDADO EM BRANCH; PR #9 EM DRAFT AGUARDANDO GATE DOCUMENTAL/FINAL**

## Baseline e escopo

- Base estável: `main@72ac7ab771f639e8598063a2a8d9fc8c07420ded` (closeout 04R).
- Baseline de produto anterior: `5d2d8aa5d1541010e03d2ca1926ba76a60efb3eb`.
- Branch: `package-05r-legacy-reconciliation`.
- PR: `#9` — `feat(05r): controlled legacy reconciliation workflow`.
- Head de implementação/hardening validado: `0a2998556b7d85cb7e46c3d9a1de307ec6cd26c1`.
- CI validado: workflow `Package 00R CI`, run `36284704946` — **SUCCESS**.
- Objetivo: reconciliar `lead.id` legado com Company/Contact canônicos de forma explícita, auditável, reversível e sem migração em massa.
- Não objetivos: remover `lead.id`, migrar automaticamente Opportunities/Tasks/Activities legados, ativar Supabase remoto, executar migração de dados reais via CI ou fazer cutover big-bang.

## Evidência e decisão

O 03R introduziu Company/Contact canônicos e a ponte `Company.legacyLeadId`. O 04R tornou sincronização/conflito revisável e recuperável. O 05R usa essas fundações para migrar apenas quando houver revisão humana explícita.

Decisão: **nenhum sinal isolado cria ou liga uma Company automaticamente**. O fluxo obrigatório é:

`dry-run → revisão → seleção explícita → checkpoint → revalidação contra estado atual → aplicação controlada → sync revision-aware → rollback seletivo disponível`.

## Planner dry-run

`legacy-reconciliation-service.js` classifica cada lead sem mutar o grafo:

- `linked`: já existe ponte explícita por `legacyLeadId`;
- `review`: existe uma correspondência única que precisa de confirmação humana;
- `ambiguous`: existem múltiplas candidatas;
- `proposed`: não há candidata e pode ser proposta uma nova Company;
- `blocked`: dados/ocupação impedem aplicação segura;
- `invalid`: lead sem identidade mínima.

Regras de correspondência:
- `legacyLeadId` explícito é soberano;
- CNPJ só é sinal forte quando o contrato atual possui 14 dígitos normalizados;
- CNPJ forte ainda exige confirmação humana;
- um único nome normalizado igual exige revisão, em vez de criar Company duplicada;
- múltiplas candidatas exigem escolha explícita;
- candidatas já ligadas a outro lead são sinalizadas/bloqueadas;
- CNPJ legado incompleto não é promovido ao registro canônico.

A prévia visual limita a renderização aos primeiros 100 pendentes priorizando revisão/ambiguidade/propostas; o plano JSON exportado contém todos os registros.

## Aplicação controlada

`applyApproved()` recebe somente aprovações explícitas. Antes de escrever:
- valida o plano;
- rejeita aprovação duplicada;
- exige `confirmed: true`;
- reexecuta a inspeção contra o grafo **atual** para detectar plano obsoleto;
- rejeita Company que deixou de ser candidata ou foi ligada a outro lead;
- para match por CNPJ, impede escolha de candidata que não possua o sinal forte;
- evita Contact duplicado por telefone/nome dentro da Company;
- valida o grafo canônico completo antes de retornar.

A aplicação pode:
- criar uma Company nova e opcionalmente um Contact;
- ligar um lead revisado/ambíguo a uma Company existente;
- registrar `legacy.reconciliation.applied` em `activityEvents`.

Nenhuma seleção vem marcada por padrão.

## Checkpoint e rollback

Antes de qualquer aplicação, o app exige sucesso de um checkpoint completo via `OG_DATA_SAFETY.saveLocalSnapshot()`. Sem checkpoint, não há apply.

O rollback é **seletivo**, não um restore bruto do CRM:
- usa o checkpoint para recuperar o estado anterior apenas das Companies afetadas;
- remove somente Companies/Contacts criados pela aplicação revertida;
- restaura somente o vínculo/Company preexistente alterado;
- remove os eventos da aplicação revertida e registra `legacy.reconciliation.rolled_back`;
- bloqueia o rollback se uma Company/Contact afetada foi editada depois;
- bloqueia a remoção de Company criada se ela recebeu novos Contacts/Opportunities/Activities/Tasks.

Isso evita que um rollback tardio apague trabalho comercial feito depois da reconciliação.

## Integração com Sync 04R

Apply e rollback ficam bloqueados enquanto houver conflito/revisão de sincronização pendente. Após uma aplicação válida, `saveOperationsToStorage()` entra no fluxo revision-aware do 04R. Se outro dispositivo modificar o servidor, o 409 volta para Conflict UX; o 05R não força merge nem sobrescrita.

## UX

O painel **Performance & Operações** ganhou uma área 05R com:
- geração de prévia `dry-run`;
- contadores de já ligados, revisões, ambiguidades, propostas e bloqueios;
- seleção manual por registro;
- escolha de Company em correspondências;
- opção explícita para incluir Contact;
- aviso de CNPJ legado inválido/não promovido;
- candidatas ocupadas visíveis e desabilitadas;
- exportação do plano JSON;
- aplicação com checkpoint;
- rollback da última aplicação controlada.

PWA/service worker avançou para v30 e inclui o planner no shell offline.

## Testes e gates

Novos gates:
- `og:legacy:reconciliation:test`;
- `og:legacy:reconciliation:ui:test`;
- ambos integrados ao `npm run validate` e ao `og:check`.

Cobertura inclui:
- vínculo explícito existente;
- match por CNPJ;
- match único por nome sem criar duplicata;
- múltiplos candidatos;
- candidata ocupada;
- CNPJ inválido não promovido;
- nova Company/Contact;
- confirmação obrigatória;
- plano obsoleto;
- dedupe de Contact;
- rollback seletivo;
- bloqueio do rollback quando houver edição/relação posterior;
- checkpoint/UX/sync gate/offline.

Run `36284662308` falhou no novo teste por ordem de inicialização da fixture `domain` (ReferenceError no teste; `og:check` e demais suites haviam passado). A fixture foi corrigida em `0a2998556b7d85cb7e46c3d9a1de307ec6cd26c1`.

Run final de implementação `36284704946`: **SUCCESS** em:
- `npm ci`;
- lockfile íntegro;
- `npm run validate`;
- `og:brain:check`;
- `og:security:test`;
- `npm audit --audit-level=high`;
- `release:gate`.

## Segurança e dados

- nenhum token/segredo novo;
- nenhum dado comercial real é alterado por commit, CI ou dry-run;
- aplicação só ocorre por ação explícita do usuário no navegador;
- checkpoint é obrigatório;
- nenhuma transformação em massa é disparada na inicialização;
- `lead.id` continua identidade operacional/ponte durante a transição.

## Rollback de release

Antes do merge: fechar PR #9.

Após merge: revert por PR. Não apagar snapshots 05R automaticamente. Se houver aplicação real feita por usuário antes de um revert de código, executar primeiro o rollback controlado na versão que entende o relatório/checkpoint 05R ou preservar/exportar o snapshot para recuperação.

## Riscos residuais / não objetivos

- reconciliação campo-a-campo de dados divergentes de Company ainda não existe; o fluxo escolhe criar ou ligar e preserva dados canônicos existentes;
- nested legacy `opportunities`, `tasks`, `contacts` e interações não são convertidos em massa;
- `lead.id` não é removido neste package;
- Supabase remoto/OQ-PKG02-001 continua pendente;
- CNPJ alfanumérico não é introduzido neste package; a regra usa o contrato numérico atual do domínio e não promove identificadores incompletos.

## Definition of Done

O 05R fecha somente quando:
- CI final do head documental estiver SUCCESS;
- Brain/security/audit/release gate estiverem PASS;
- branch estiver 0 behind do `main`;
- reviews/threads estiverem limpos;
- Builder Brain estiver atualizado/validado;
- PR sair de draft e for mergeada com `expected_head_sha`;
- closeout pós-merge registrar novo baseline e ciclo.

## Próxima etapa

Após merge + closeout + STOP do 05R, a próxima etapa deve ser definida a partir do estado real. Não há autorização automática neste relatório para remover o legado ou ativar Supabase remoto.
