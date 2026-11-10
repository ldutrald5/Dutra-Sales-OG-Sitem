# PRES-S01 — Projetor positivo de dados do cliente

Status: implementado localmente; aguardando revisão humana. Base: `64caafb089dff29ab15f45bdc4de7e3b5b2384c5`. Decisões PRESENT-007–013 aprovadas pelo responsável pelo produto em 2026-11-10, com as salvaguardas do `BLUEPRINT_DUTRA_PRESENT_V0.2.md` (artefato local da missão anterior). Nenhum contrato deste pacote concede autorização para exibir, publicar ou enviar uma proposta.

## Contrato

`OG_PRESENT_PROJECTION.project(source, selection, policy)` é síncrona e pura: retorna um DTO congelado ou lança `ProjectionError` com `code` e `path`. `source` é um objeto de dados plano recebido de um futuro adaptador confiável; esta story não faz leitura do CRM, registro de sessão nem busca da revisão. `selection` escolhe somente seções e IDs de veículos. `policy` contém relógio/validade explícitos, referência pública opaca, identidade esperada da revisão ou fixture e o texto exato revisado pelo vendedor. Esses campos são entradas de validação, **não prova criptográfica nem aprovação humana**. Um caller futuro deve obter a revisão do owner `OG_PROPOSAL_INTELLIGENCE / operations.generatedDocuments`, controlar a política no servidor quando houver modo remoto e vincular aprovação ao digest do DTO.

- `proposal_revision`: `clientRef.leadId` deve concordar com `record.clientId`, `record.snapshot.clientId` e contextos de veículos. `record.id`, `quoteId` e `version` devem concordar com `policy.expectedRevision`. Só aceita revisão `internal_draft`, snapshot `schemaVersion:1`, `representationVersion:2`, valor positivo, condições e validade ainda vigentes para toda a vida do DTO. Uma revisão legada sem representação 2 falha fechada. `companyId` não é aceito nesta etapa porque o snapshot atual não fornece vínculo Company verificável; um adaptador futuro precisará consultar o resolver canônico e comprovar a relação.
- `demonstrative_fixture`: `clientRef:null`, fixture versionada com fingerprint em formato SHA-256 e identidade idêntica em `policy.expectedFixture`. Não aceita IDs de CRM, cotação ou proposta, nem preços/ROI/aplicação. Quantidades conceituais saem identificadas como `demonstrative`; peças/pneus/subtotais ausentes continuam `null` ou listas vazias. O fingerprint é uma referência declarada; a comparação com bytes de uma fixture registrada fica a cargo do futuro adaptador confiável.
- O DTO contém apenas alias público dos veículos, título revisado, quantidades e itens selecionados. Preços unitários e subtotais por veículo só aparecem com `showCommercial:true`. O agregado `approvedCommercial` aparece somente quando todos os veículos da proposta são selecionados; seleção parcial mantém valores unitários canônicos, omite o agregado e retorna `validation.status:'VALIDAR'`. ROI global com seleção parcial é rejeitado. O ROI pronto é copiado do snapshot canônico como **estimativa**, com fonte, unidade, versão/data e limitações; nenhuma fórmula é recalculada. ROI `validate` retorna `VALIDAR` e `results:null`. O caminho técnico bruto, notas, respostas, mídia, contatos, CNPJ, código interno, CRM e histórico não entram no DTO.
- `approvalStatus:'not_approved'` e `validation.status:'ready_for_review'` significam somente que a projeção passou nos testes de formato e vínculo. `approvedCommercial` é o nome conceitual do bloco do Blueprint; seu conteúdo ainda exige aprovação futura por digest antes de exibição. O texto revisado é comparado por igualdade exata, incluindo nome, veículo, **código da peça e da aplicação**, condição e fonte de premissa. Isso não substitui a revisão humana real.

Limites: entrada UTF-8 ≤250.000 bytes; DTO UTF-8 ≤60.000 bytes; profundidade ≤64; ≤50.000 nós inspecionados; ≤40 veículos; ≤100 itens/aplicações por veículo; texto público ≤300 caracteres (referências e unidades têm limites menores). Profundidade e complexidade excessivas causam `ProjectionError` com `DEPTH_LIMIT` ou `COMPLEXITY_LIMIT`. Propriedades desconhecidas nas estruturas reconhecidas, accessors, funções, símbolos, objetos não planos, ciclos, IDs duplicados, datas inválidas, versões incompatíveis e seleções cruzadas causam erro tipado. Dados privados que o owner mantém no snapshot são lidos apenas para validar a estrutura e o tamanho; o DTO é construído campo a campo. Para validade em `AAAA-MM-DD`, o vencimento é o fim do dia em UTC; timestamps exigem UTC explícito.

## Definition of Done

- [x] Projetor e validador independentes de UI, persistência, IA e rede.
- [x] Revisão comercial e fixture demonstrativa discriminadas.
- [x] Referências A/B, homônimos, versões, validade, texto revisado e canários privados testados.
- [x] Entrada imutável e saída congelada; saída limitada e sem IDs internos.
- [x] ROI só por cópia do owner, sem fórmula nova; ausência resulta `VALIDAR`.
- [ ] Aprovação real por digest, viewer, sessão, navegação e persistência: pertencem a stories posteriores e não estão autorizadas aqui.

## Evidências e rollback

Teste específico: `npm run og:present:projection:test` (fixtures inteiramente sintéticas). Executados nesta branch: `og:check`, `og:proposal:test`, `og:technical:map:test`, `og:security:test`, `og:brain:check`, todos com código de saída 0 no primeiro commit. Na revisão seguinte, dois testes RED reproduziram rejeição indevida de texto privado vazio em snapshot nativo e aceitação de data impossível normalizada por `Date.parse`; correções restritas ao projetor deixaram 57 casos GREEN. Texto privado omitido pode conter quebra de linha sem bloquear a projeção; texto público continua com validação estrita. `npm test` não foi executado nesta story: o runner dispara mais de 80 scripts em paralelo, incluindo servidores, fluxo de persistência e dependências de navegador ausentes neste worktree; nenhum fluxo do app foi conectado ao novo serviço. O teste novo foi registrado no runner para uma futura validação integrada isolada. Rollback local: `git revert <commit-de-revisão> <commit-pres-s01>` após revisão, removendo somente serviço, teste, esta story e registro dos scripts. O serviço ainda não é carregado pelo app e não altera dados históricos.

PRES-S01-FIX-02 (2026-11-10): a revisão posterior reproduziu seleção parcial com totais globais, códigos sem revisão e `RangeError` em entrada profunda. A correção local restringiu agregados e ROI ao escopo integral, exigiu revisão explícita dos códigos e adicionou limites de profundidade/complexidade. Os testes focados passaram com 64 casos sintéticos; `npm test` passou com 86/86 gates em sandbox isolado. Esses resultados não representam aprovação para entrega do DTO ao Modo Cliente.

### File List

- `apps/sistema-og/services/present-projection-service.js` — projetor puro e limites.
- `scripts/test_present_projection.mjs` — fixtures e casos adversariais.
- `package.json` — comando de teste focado.
- `scripts/validate.mjs` — inclusão do teste no gate futuro.
- `docs/stories/PRES-S01-positive-client-projection.md` — contrato, evidência e rollback.

### DUTRA-EVIDENCE-01

| Recurso | Uso concreto | Classificação |
|---|---|---|
| `AGENTS.md`, `.claude/CLAUDE.md`, Constituição e Context Router | Escopo, owners, gates e preservação | CONSULTADO |
| Skills `dutra-core`, `dutra-quote-engine`, `dutra-og-tech`, `dutra-minimal-change`, `dutra-builder-brain`, `dutra-qa-guardian`, `dutra-environment-guardian` | Fronteira de privacidade, reuso, testes, execução local | APLICADO CONCEITUALMENTE |
| `BLUEPRINT_DUTRA_PRESENT_V0.2.md`, `CHECKPOINT.json`, protocolo DUTRA-EVIDENCE-01 fornecido em conversa | Contrato, variantes e limites da story | APLICADO CONCEITUALMENTE |
| `proposal-intelligence-service.js`, `technical-application-map.js`, testes de proposta | Formato nativo de snapshot/revisão, enums técnicos e regressão | CONSULTADO |
| `present-projection-service.js` | Construção e validação por lista positiva | IMPLEMENTADO |
| `test_present_projection.mjs` | Casos sintéticos e regressões da fronteira | VALIDADO após execução local |
| Modo Cliente, autenticação remota, aprovação por digest, runtime real | Fora da story | INDISPONÍVEL nesta validação |

Checkpoint: branch local `feat/dutra-present-s01` iniciada em `64caafb`; worktrees de recuperação, Mesa e Precision não foram modificados. Próximo incremento possível somente após revisão humana: ligar um adaptador de leitura confiável e o controller/viewer isolado, com aprovação explícita por digest e novos testes de payload.
