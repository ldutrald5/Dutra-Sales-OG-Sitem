# Impacto OG — revisão final isolada / Stage 8.2

Atualização posterior: Lucas autorizou implementação controlada. Esta rodada visual permanece histórica; entrega atual em [Implementation](PROPOSAL_IMPACTO_OG_IMPLEMENTATION.md). Nenhuma publicação autorizada.

Data: 2026-10-09. **A — Impacto OG é a direção visual oficial**, confirmada por Lucas. B/C permanecem como histórico; não são alternativas ativas. **FINAL_PREVIEW_READY / AWAITING_EXPLICIT_IMPLEMENTATION_AUTHORIZATION**. Nenhuma integração ao renderer de produto, produção, preço, dados, commit/push ou deploy nesta rodada.

## Prévia verificável

Artefatos preservados em `/workspace/artifacts/stage82-impacto-final/`. Rodadas anteriores intactas.

| Seção | Mobile 390×844 | Desktop 1440×900 |
|---|---|---|
| Abertura | `A-opening-mobile.png` | `A-opening-desktop.png` |
| Composição | `A-composition-mobile.png` | `A-composition-desktop.png` |
| Economia | `A-return-mobile.png` | `A-return-desktop.png` |

Também: `A-tractor-card-mobile.png`, `A-economy-highlight-mobile.png`, `A-mobile.png`, `A-desktop.png`, prévia autocontida `index.html`, `verification.json`, `media-eligibility-audit.json`, `scenario-audit.json` e `proposal-snapshot.json`.

## Card e adaptação honesta

O card mantém título/configuração, quantidade de veículos, imagem conceitual, contexto de aplicação, valor unitário/subtotal e peças/caminho expansíveis. A representação atual mostra um cavalo 4×2 com dois eixos, sem carreta. Não comprova marca/modelo exatos, ano, propriedade da frota ou instalação.

Na prévia isolada, a elegibilidade da mídia usa **escopo + configuração canônica**, nunca código da peça, nome livre ou imagem como origem técnica. `toco_4x2`/escopo cavalo admite a imagem conceitual de dois eixos; `trucado_carreta3`/escopo carreta admite esquema de três eixos do implemento. A identificação da carreta vem do escopo filtrado do engine; o preset completo também contém cavalo, que não é recontado neste card.

6×2, 6×4, implemento com quatro eixos e escopo ausente não recebem esses desenhos. Sem ativo compatível, omitir imagem e mostrar **“Ilustração compatível indisponível”**, mantendo os dados técnicos válidos. Falta de imagem não invalida cálculo nem justifica inventar eixos ou renderizar o 4×2 para qualquer cavalo. Isto foi testado somente no protótipo; não é uma capability já integrada ao renderer definitivo. Fotos/logos reais exigem o contrato autorizado existente.

Texto da carreta ajustado no protótipo para “Aplicação nos eixos do implemento”, sem pergunta/label de dianteira do cavalo.

## Integridade do cenário

Transportadora Horizonte é **fictícia**. As configurações, peças, pneus atendidos e preços são resultados efetivos dos owners nativos aplicados à fixture controlada, não dados reais de uma empresa nem oferta comercial aprovada.

| Grupo | Quantidade | Peças unitárias | Peças no grupo | Pneus atendidos no grupo | Unitário | Subtotal |
|---|---:|---:|---:|---:|---:|---:|
| Cavalo 4×2, sem aplicação dianteira | 2 | 8 | 16 | 8 | R$ 590,00 | R$ 1.180,00 |
| Carreta, 3 eixos do implemento | 3 | 24 | 72 | 36 | R$ 1.770,00 | R$ 5.310,00 |
| Total | 5 | — | **88** | **44** | — | **R$ 6.490,00** |

Pneus atendidos não são contagem de todos os pneus físicos da frota. Sem dupla multiplicação; IDs/itens/posições/preços preservados. Por eixo e conjunto pareado continuam VALIDAR, sem rateio ou vínculo inventado. Snapshot igual ao da rodada anterior: **7.685 bytes**, sem CRM/history/state recursivos.

ROI nativo `OG_PROPOSAL_INTELLIGENCE.calculateRoi`, método `replacement-cycle-and-fuel-v1`, sem mudança. Vida atual 18 meses; ganho **estimado** de vida 20%; combustível 2% **hipótese**; pneu R$ 2.000 e gasto de combustível R$ 10.000/mês fictícios. Resultado da mesma simulação: R$ 814,81 pneus + R$ 200,00 combustível = **R$ 1.014,81/mês**, R$ 12.177,78/ano, payback simples 6,40 meses. Vida estimada 21,6 meses; ganho de vida 20% não equivale a economia direta de 20%. Aplicabilidade ao cliente real permanece VALIDAR. Premissas sem revisão não produzem cifra; nenhuma promessa de retorno garantido.

## Verificações executadas e limites

- Native rebuild + igualdade integral de snapshot/ROI e soma de peças/pneus/subtotais: PASS.
- Harness Chromium: **320×568,390×844,1440×900**, seis casos de mídia/configuração, detalhes, reload, CTA sem envio, ausência de overflow horizontal, erros JS e pedidos externos: PASS. Servidor estático temporário localhost encerrado ao terminar.
- Contraste do destaque econômico: valor preto/amarelo **13,67:1**; texto amarelo/faixa preta **13,79:1**. Cor, hierarquia e referência visual OG preservadas; não constitui auditoria completa de acessibilidade.
- `test_proposal_premium.mjs`, `test_proposal_document.mjs`, `test_quote_composition_snapshot.mjs`: PASS. Esses testes protegem owners existentes; não certificam integração que ainda não foi feita.
- Capturas mobile/desktop reais inspecionadas. Sem teste em dispositivo físico, decisor real/5 segundos, impressão física ou PDF/PNG do novo layout pelo pipeline de produto. Prints dos artefatos são screenshots de revisão.
- Só há imagem compatível de exploração para o 4×2 e esquema simples de carreta 3 eixos. Demais configurações têm fallback. Sem logo/foto autorizados de cliente nesta fixture. O payback do bloco nativo ainda usa ponto decimal na apresentação; localizar para `6,40` é ajuste visual posterior, sem recalcular.
- Propostas longas e impressão/paginação do novo tema precisam ser verificadas na integração. Desktop em três painéis é composição de revisão; o workspace definitivo deve reutilizar controles/preview existentes.

## Recomendação e mínimo posterior

**Recomendo aprovar este pacote visual para implementação**, com a regra de mídia compatível/fallback obrigatória e premissas econômicas sempre explícitas. Seleção oficial da direção não significa autorização para executar a integração.

Após autorização explícita:

1. Adaptar tokens/blocos existentes de `OG_PROPOSAL_DOCUMENT.viewModel`; preservar formatos funcionais e um único owner de proposta/preço/ROI/técnica.
2. Associar mídia compatível e branding pelo contrato atual; nova apresentação versionada e limitada, sem binários nos snapshots; histórico antigo imutável. Configuração de apresentação desconhecida deve cair no formato anterior legível.
3. Testar mesmas identidades/preços/quantidades/ROI, ausência de premissas, 4×2/6×2/6×4/implementos, assets autorizados/ausentes, async de outro cliente, save/reopen, versões, snapshot limitado e export != sent. Inspecionar mobile/desktop e PDFs/PNGs reais, inclusive proposta longa e paginação; gate final proporcional conforme repositório.
4. Rollback: reverter apenas commit(s) de apresentação para a base imediatamente anterior verificada; manter dados/cotações/propostas e seus IDs. Preservar leitura das novas preferências com fallback anterior, sem reset, migração ou apagar armazenamento. Deploy somente por autorização separada/protocolo do piloto.

Plano preparado, não executado. Sem mudança em `apps/sistema-og/`, main ou runtime.
