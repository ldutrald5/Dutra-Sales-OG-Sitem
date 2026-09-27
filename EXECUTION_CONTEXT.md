# Execution Context — Package 05R em validação

- Repositório fonte: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch estável: `main`
- Baseline estável: `72ac7ab771f639e8598063a2a8d9fc8c07420ded`
- Baseline de produto pós-04R: `5d2d8aa5d1541010e03d2ca1926ba76a60efb3eb`
- Packages 00R, 01R, 02R, 03R e 04R: incorporados ao `main`
- Runtime suportado: Node `>=24 <25`, npm `>=11`
- Package em execução: **05R — Legacy Reconciliation / migração controlada**
- Branch: `package-05r-legacy-reconciliation`
- PR: **#9** — draft até concluir o gate final do head documental
- Head de implementação/hardening + segurança validado: `c8bfa90c4f84d4d9957e59df463a8345678b0601`
- CI de implementação/hardening + segurança: workflow run `36285040392` — **SUCCESS**; o head documental final ainda deve passar pelo mesmo gate
- Um run anterior (`36284662308`) falhou somente no novo teste 05R por ordem de inicialização de fixture; corrigido antes do SUCCESS.
- Fora do escopo do 05R: remoção de `lead.id`, migração automática de Opportunities/Tasks/Activities legados, ativação obrigatória do Supabase remoto e cutover big-bang.

## Sequência reconciliada

1. 01R — Canonical Domain Foundation — **MERGED**
2. 02R — Supabase Auth + Organization Pilot — **MERGED; piloto remoto pendente**
3. 03R — Company/Contact + Company 360 Beta — **MERGED**
4. 04R — Sync Bridge & Conflict UX — **MERGED**
5. 05R — Legacy Reconciliation / migração controlada — **EM VALIDAÇÃO**

## Estado técnico do 05R

O 05R transforma a ponte `Company.legacyLeadId` em um fluxo de reconciliação controlada, sem migrar dados na inicialização e sem auto-link.

Fluxo obrigatório:

`dry-run → revisão humana → seleção explícita → checkpoint → revalidação → aplicação controlada → sync 04R → rollback seletivo`.

O planner classifica cada lead como:
- `linked`;
- `review`;
- `ambiguous`;
- `proposed`;
- `blocked`;
- `invalid`.

Regras de integridade atuais:
- `legacyLeadId` explícito é soberano;
- CNPJ numérico completo (14 dígitos no contrato atual) é sinal forte, porém nunca auto-aplica;
- um match único por nome exige revisão e não cria Company duplicada silenciosamente;
- candidato já ligado a outro lead é bloqueado/desabilitado;
- CNPJ legado incompleto não é promovido ao canônico;
- plano é reavaliado contra o grafo atual antes do apply;
- Contact canônico duplicado por nome/telefone não é criado novamente;
- nenhuma seleção da UI vem marcada por padrão.

## Checkpoint, rollback e sincronização

Antes de aplicar, o checkpoint completo em IndexedDB é obrigatório.

Rollback 05R é seletivo:
- restaura/remover somente entidades afetadas pela última aplicação;
- usa o snapshot pré-apply como referência;
- bloqueia se Company/Contact foi alterado depois;
- bloqueia remoção de Company criada se novas relações foram adicionadas;
- não restaura o CRM inteiro por cima de trabalho posterior.

Apply/rollback ficam bloqueados durante conflito ou revisão pendente do Sync 04R. Toda persistência continua sujeita à revisão autoritativa do servidor.

## UX e valor visível

A aba **Performance & Operações** oferece:
- prévia dry-run;
- contadores por classe;
- escolha explícita da Company candidata;
- opção explícita de incluir Contact;
- avisos de candidato ocupado/CNPJ não promovido;
- exportação do plano;
- apply com checkpoint;
- rollback da última aplicação controlada.

Service Worker/PWA está em v30 com o planner 05R no shell offline.

## Estado do 02R

`OQ-PKG02-001` permanece aberta. A fundação Auth/Organization foi mergeada, mas migration/Auth/RLS remotos ainda exigem ensaio contra um projeto Supabase piloto antes de ativação. O 05R não altera essa condição.

## Restrições de dados

Nenhum commit, CI ou dry-run do 05R migra dados comerciais reais. Uma alteração de Company/Contact só ocorre quando um usuário da aplicação seleciona registros e confirma a operação. `lead.id` permanece ativo durante a transição.

## Regra de avanço

Fluxo obrigatório: branch isolada → implementação → testes → gate → auditoria → documentação/Brain → CI final → merge protegido → closeout → STOP.

O 05R não pode ser declarado concluído enquanto o head documental final não tiver CI/release gate em PASS, a PR não estiver auditada e o closeout pós-merge não tiver sido registrado.
