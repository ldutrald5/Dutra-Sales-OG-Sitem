# Proposal Experience V2 — Etapa 8.2 / rodadas 2–3

Status atual: **A — Impacto OG oficial; revisão final pronta; integração aguardando autorização explícita**.
Data: 2026-10-09. Entrada: `8aab52a70ff2bd0b5d9691bb77264485f00df43c`, branch `integration/dutra-os-one-system`, igual ao remote verificado. Os cinco arquivos de documentação pendentes da rodada anterior foram preservados; nenhuma alteração em código de produto, preços, banco ou runtime.

## Diagnóstico e fontes

- Consultados: `AGENTS.md`, `.claude/CLAUDE.md` (não existe `CLAUDE.md` raiz), Context Router, Proposal Experience Vision, Visual Co-Creation Playbook, skills product/quote/dev/QA/Builder Brain e catálogo da skill UX. Não há skill DUTRA separada de frontend/segurança/documentação neste checkout; aplicam-se os contratos e guardrails existentes.
- Stage 8/8.1 fornece no checkout templates Executivo/Técnico/Compacto, apresentação versionada, print/PDF/PNG, logo autorizado e snapshot imutável. **Esses templates funcionais não são os três conceitos criativos da 8.2.**
- Conceitos preservados: **A Impacto OG**, **B Executivo Premium**, **C Storytelling Operacional**. Lucas gostou dos três; nenhuma direção foi eliminada ou escolhida como vencedora. Fonte: `SRC-PROPOSAL-FEEDBACK-20261009-001`; imagem `1001513701.jpg`.
- Lucas esclareceu nesta rodada: **18 meses = vida útil atual de pneu novo**; **20% = aumento estimado dessa vida útil**. Significado confirmado não prova desempenho universal. A menção de 2% de combustível permanece premissa comercial sem evidência empírica validada encontrada no contexto consultado.
- Owners: preço/cotação `calculateCompleteQuote` + `resolveItemPrice`; aplicação `OG_DATA` + `resolveVehicleSupports` + `buildConsolidatedVehiclePieces`; explicação `OG_TECHNICAL_APPLICATION_MAP`; proposta/ROI `OG_PROPOSAL_INTELLIGENCE`; apresentação/exportação `OG_PROPOSAL_DOCUMENT`; histórico `operations.generatedDocuments`; cliente `OG_CRM_SERVICE / state.leads`.
- Runtime online não foi reconsultado nem modificado. O checkpoint 8.1 registra o pacote local e handoff Railway; esta rodada não certifica SHA atual online.

## Entrega verificável para avaliação no celular

Artefatos isolados em `/workspace/artifacts/stage82-v2/`, fora do código do produto. `index.html` é um seletor autocontido dos três conceitos; recursos embutidos, sem fontes, APIs ou mídias remotas. `verification.json` e `scenario-audit.json` guardam a evidência. Pacote: `/workspace/artifacts/stage82-v2-preview.zip`.

| Direção | Abertura | Composição/investimento | Retorno |
|---|---|---|---|
| A Impacto OG | `A-opening-mobile.png`: preto/amarelo, curva sutil de olho, headline forte, 44 pneus e caminhão | `A-composition-mobile.png`: cards separados, números e total amarelo | `A-return-mobile.png`: faixa econômica forte, hipótese explícita, método expansível |
| B Executivo Premium | `B-opening-mobile.png`: marfim, serif editorial, imagem contida e amarelo discreto | `B-composition-mobile.png`: cards limpos, subtotais e investimento organizado | `B-return-mobile.png`: economia sem ruído, premissas e ação clara |
| C Storytelling Operacional | `C-opening-mobile.png`: contexto/desafio, caminhão e sinal operacional | `C-composition-mobile.png`: percurso Cavalo → Carreta → consolidado | `C-return-mobile.png`: aplicação → economia → próximo passo |

Também: três histórias completas `A-mobile.png`/`B-mobile.png`/`C-mobile.png`, imagens desktop, `comparison-openings.png`, `comparison.html`, `A.html`/`B.html`/`C.html`. PNGs são capturas de conceitos, **não uma nova implementação do exportador de produto**.

Hierarquia explorada: abertura curta; mais amarelo em A; imagem identificada como conceitual OG; Cavalo/Carreta preservados; subtotal por configuração; detalhe técnico expansível; investimento antes do ROI; método e limitações próximos à estimativa; CTA de revisão, sem envio/aceite. Nenhum logo de cliente inventado.

## Mesmo cenário técnico

Cliente fictício: **Transportadora Horizonte**. Fixture deriva as mesmas configurações do teste nativo Stage 8, usando os motores atuais do checkout. Referência: `tier: lead_ie`, `paymentMethod: faturado`, 120 PSI, sem aplicação dianteira, sem extras. Nenhum preço oficial modificado ou apresentado como oferta real.

| Configuração | Quantidade | Peças unitárias | Por veículo | Subtotal | Pneus no grupo |
|---|---:|---:|---:|---:|---:|
| Cavalo Volvo 4×2 (`toco_4x2`) | 2 | 8 | R$ 590,00 | R$ 1.180,00 | 8 |
| Carreta 3 eixos (`trucado_carreta3`) | 3 | 24 | R$ 1.770,00 | R$ 5.310,00 | 36 |
| Total nativo | 5 | **88 peças consolidadas** | — | **R$ 6.490,00** | **44** |

Por eixo: **VALIDAR**; contrato consumido não fornece rateio financeiro por eixo. Por conjunto pareado: **VALIDAR**; dois cavalos e três carretas sem vínculo pareado. Não dividir valores por eixos ou supor pareamento. Nenhuma quantidade multiplicada duas vezes; IDs, peças e caminhos vêm do snapshot.

## Auditoria econômica

Fonte: `apps/sistema-og/services/proposal-intelligence-service.js`, `ROI_FIELDS`, `normalizeRoiAssumptions`, `calculateRoi`; método `replacement-cycle-and-fuel-v1`. Exige valor, unidade, fonte, revisão, versão e data. Ausência/revisão pendente retorna `validate` e valores `null`.

| Premissa | Origem/status | Necessário para uso real |
|---|---|---|
| Combustível 2% | Citada por Lucas; hipótese, não resultado OG universal comprovado | Evidência/aplicabilidade, gasto mensal dos veículos atendidos, comparação e revisão |
| Ganho de vida 20% | Significado confirmado por Lucas; desempenho permanece estimado | Histórico comparável, operação/manutenção/tipo de pneu, fonte/versionamento |
| Vida atual 18 meses | Confirmada por Lucas para pneu novo no cenário; não horizonte do ROI | Ciclo real da frota, condições de uso e origem |
| Pneu R$ 2.000 | Custo **fictício** de exemplo | Custo médio real revisado |
| Combustível R$ 10.000/mês | Gasto **fictício** de exemplo | Gasto da mesma frota atendida, não operação inteira quando escopo é parcial |
| Investimento/pneus | R$ 6.490 / 44, cálculo nativo do fixture | Cotação real revisada, condições atuais e mesmo escopo |

Fórmulas existentes, sem alteração:

- Vida estimada = vida atual × (1 + ganho / 100).
- Economia mensal em pneus = pneus × custo × (1 / vida atual − 1 / vida estimada).
- Economia mensal em combustível = gasto mensal do escopo × percentual / 100.
- Mensal total = pneus + combustível; anual = mensal × 12.
- Payback simples = investimento / economia mensal; economia zero não produz retorno artificial.

**Exemplo ilustrativo**, não estudo real: 18 × 1,20 = **21,6 meses**; pneus **R$ 814,81/mês** + combustível **R$ 200,00/mês** = **R$ 1.014,81/mês**, **R$ 12.177,78/ano**, payback **6,40 meses**. Calculado pela função canônica, sem arredondar etapas intermediárias.

+20% de vida implica aproximadamente **16,7%** de redução no custo de reposição nesse modelo, não 20% de economia direta. O motor projeta 12 meses e não possui horizonte arbitrário de 18 meses; não foi inventada projeção acumulada de 18 meses. O retorno da prancha anterior, baseado em 24 meses/25% e sem combustível, não foi reutilizado com premissas diferentes.

Inclui produtos do cenário, reposição de pneus e combustível. Não monetiza segurança/paradas/disponibilidade. Não inclui frete, instalação, manutenção, custo de capital, inflação, valor presente, impostos incrementais ou variação de preços. Reposição é média de ciclo, não caixa comprovado todo mês. Interações entre ganhos de pneus/combustível não são modeladas. Não há garantia.

Na fixture, `reviewed` significa dado sintético conferido para demonstrar a função, **não aprovação comercial de cliente**. O mesmo cenário não revisado foi executado: `validate`, economia ausente. Nenhum resultado comprovado de cliente foi apresentado.

## Personalização e ideia narrada

Nome/dados comerciais usam o mesmo clientId/snapshot. Logo por `operations.materials` + `OG_MATERIAL_STORE`, com autorização, cliente, versão/fingerprint; ausente usa OG. Foto real exige consentimento/direito de uso e origem. Personalização conceitual deve ser identificada; não alterar foto real para insinuar instalação, propriedade ou resultado inexistente. Nesta rodada apenas mídia OG existente e empresa fictícia.

`IDEA-PROPOSAL-NARRATED-LINK-001` permanece **candidate**. Potencial: conduzir o decisor pela história e permitir revisão assíncrona. Existe `server-proposal-store.cjs` com token em hash, expiração, rotação/revogação, snapshot e eventos de abertura/clique; isso não é portal narrado pronto nem comprovação de consentimento.

Antes de implementar: destinatário/proteção contra encaminhamento; expiração/revogação; minimização; direitos de imagem/voz; áudio voluntário e alternativa textual; finalidade/consentimento e retenção mínima do tracking, desligado até aprovação do contrato. Revisar tracking atual antes de reutilização. Abertura/clique não prova envio/aceite. Nenhuma publicação, narração, tracking, provider ou comunicação externa nesta etapa.

## Validação e limites

- `test_proposal_premium.mjs`, `test_proposal_document.mjs`, `test_quote_composition_snapshot.mjs`: PASS.
- Harness isolado `verify-preview.mjs`: A/B/C em **320×844,390×844,1440×900**; snapshot/IDs/quantidades/preços iguais, reload, scope/path, detalhes e CTA, sem overflow horizontal, erros JS ou requests externos: PASS.
- Capturas reais inspecionadas. Nenhum teste de cinco segundos com decisores ou prova de conversão realizado.
- Snapshot: **7.685 bytes**, sem CRM/history/state, dentro do limite canônico (250.000 caracteres). Nenhum aumento de limite.
- Desktop em três painéis de exploração; mobile empilhado. Sem dependência nova, APIs, cookies/localStorage, sync, dados reais ou deploy.
- Chromium bloqueou `file://` por política do ambiente; teste via servidor estático temporário em `127.0.0.1`, fechado ao terminar, sem bypass. HTML baixado no aparelho físico não testado; PNGs são alternativa imediata.
- Não executados: suíte completa, release gate, QA físico e exports de produção. Não houve alteração de produto para justificar revalidação integral.

## Decisões abertas na rodada 2 (histórico; seleção superada na rodada 3)

1. Abertura A/B/C ou combinação, mantendo as três alternativas disponíveis.
2. Amarelo/curva de olho, headline, densidade e sequência de seções.
3. Cards e investimento por veículo/total; por-eixo/conjunto depende de evidência/contrato suficiente.
4. Peso do ROI e exibição: dados revisados, exemplo identificado ou seção omitida.
5. Ativos autorizados e evidência de ganhos no escopo do cliente real.

## Plano mínimo posterior

1. Registrar seleção/refinamentos; então criar Design DNA e prompt.
2. Adaptar o mesmo `OG_PROPOSAL_DOCUMENT.viewModel`: blocos/layout/tokens configuráveis, sem três renderers financeiros. Preservar templates funcionais, snapshots e preferências versionadas.
3. Conectar assets pelo contrato existente, fallback OG e identidade capturada em async.
4. Consumir ROI calculado e preço/classificação atuais; sem percentuais padrão ou rateios novos.
5. Validar a direção aprovada: mobile/desktop, imutabilidade, tamanho, contexto, PDF/PNG e preparado ≠ enviado. Demais variantes conforme escopo aprovado.
6. Publicação exige autorização separada e handoff vigente. Nenhuma implementação definitiva/deploy agora. Rollback: retirar apenas artefatos/deltas desta rodada, preservando WIP anterior e dados do piloto.


## Rodada 3 — seleção de A e refinamento (2026-10-09)

Lucas escolheu explicitamente **A — Impacto OG**, considerando-a a melhor opção e dispensando B/C como direções ativas. Os artefatos antigos permanecem preservados. Os templates funcionais Executivo/Técnico/Compacto da Stage 8.1 não foram excluídos.

Feedback específico: o template do cavalo na parte 2 ficou ruim; o destaque amarelo da economia na parte 3 ficou ótimo, com pedido de faixa preta inspirada no olho. Produzido novo card com ilustração conceitual 4×2/dois eixos, cabeçalho preto, quantidade amarela e preços unitário/subtotal separados. Faixa preta curva adicionada sobre o destaque econômico amarelo, sem obscurecer o valor.

Artefatos verificáveis: `/workspace/artifacts/stage82-impacto-v3/`, `A-tractor-card-mobile.png`, `A-economy-highlight-mobile.png`, seções completas, `A-mobile.png`, `A-desktop.png`, `index.html` e `verification.json`; pacote `/workspace/artifacts/stage82-impacto-v3-preview.zip`. Mesma fixture, snapshot **idêntico** ao anterior, 7.685 bytes; R$ 6.490 / 88 peças / 44 pneus / R$ 1.014,81 mensais ilustrativos preservados.

Harness A-only: **320×568,390×844,1440×900 PASS**; preto/amarelo, imagem, identidade/valores, detalhes técnicos, reload, nenhuma alteração pelo CTA, nenhum overflow, JS error ou request externo. Capturas efetivamente inspecionadas. Não reexecutada suite geral; nenhum código de produto mudou. Preview por servidor localhost temporário; sem publicação.

Design DNA selecionado: `PROPOSAL_IMPACTO_OG_DESIGN_DNA.md`. Prompt futuro: `PROPOSAL_IMPACTO_OG_IMPLEMENTATION_PROMPT.md`, DRAFT / não executado. A escolha A está concluída; o novo card/faixa e ativos/premissas de cliente real continuam sujeitos à avaliação. Imagem gerada é conceitual, não prova de frota/instalação; não adicionada aos assets de produto nem ao snapshot. Link narrado segue backlog, sem implementação.


## Revisão final oficial

Lucas confirmou A e pediu gate visual/financeiro antes da integração. Ver `PROPOSAL_IMPACTO_OG_FINAL_REVIEW.md`: prévias finais de abertura/composição/economia em mobile/desktop; adaptação segura das imagens; native snapshot e ROI iguais; seis casos de mídia e contraste >13:1; três regressões focadas PASS. Artefatos em `/workspace/artifacts/stage82-impacto-final/`. Pacote visual recomendado para aprovação; nenhuma integração ou publicação realizada.
