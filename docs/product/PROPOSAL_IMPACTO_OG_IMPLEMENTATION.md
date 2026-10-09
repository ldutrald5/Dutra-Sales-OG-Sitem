# Stage 8.2 — Impacto OG / pacote de homologação

2026-10-09. Lucas autorizou implementação controlada após a revisão final. **Implementado em desenvolvimento; homologação e publicação ainda exigem aprovação final.** Entrada Git: `8aab52a70ff2bd0b5d9691bb77264485f00df43c`, branch `integration/dutra-os-one-system`. WIP criativo anterior preservado. B/C ficam históricas; Executivo/Técnico/Compacto continuam funcionais.

## Comportamento entregue

- Renderer único `OG_PROPOSAL_DOCUMENT`: abertura preto/amarelo, destinatário/pneus atendidos, caminhão conceitual, cards, investimento, retorno e próximo passo. Evidência técnica extensa fica no anexo, depois da narrativa comercial.
- Apresentação `schemaVersion:2 / themeId:impacto-og / themeVersion:1`. Novos drafts sem preferências adotam a direção aprovada. Preferências persistidas/documentos antigos não são migrados; mudar o visual histórico prepara nova revisão no owner atual.
- Card ilustrado apenas para `toco_4x2` no contexto `cavalo`; esquema de três eixos apenas para `trucado_carreta3` no contexto `carreta`. Outros tipos/escopos/imagem ausente usam dados e fallback textual. A imagem não calcula eixos, peças ou preços e não representa uma frota real.
- Assets conceituais first-party em `assets/premium/impacto-og-v1/` com caminhos versionados. São carregados progressivamente, decodificados e embutidos apenas no documento/export temporário. Nenhum binário vai ao snapshot; PWA usa a estratégia de mídia existente.
- Logo do cliente mantém autorização por material/clientId/referência/fingerprint, sem busca externa. Os exemplos de QA usam logo fictício explicitamente autorizado na fixture.
- Investimento unitário/subtotal de grupo vêm da cotação. Não há rateio por eixo ou conjunto pareado inventado. Cifras pt-BR; payback novo em meses usa vírgula.
- Retorno amarelo com faixa preta/olho; premissas e limitações continuam visíveis quando ROI está ativo, inclusive sem o detalhamento opcional da fórmula. Ausência de revisão = VALIDAR; nenhum percentual é default comercial novo.
- PDF nativo e PNG A4 1588×2246 compartilham blocos/estilos; guard de contexto impede resultado/export tardio em outro cliente. Exportar não registra SENT.
- Correção responsiva localizada: botão/nome longo do cliente no cabeçalho da cotação pode quebrar linha, sem overflow em 320px.

## Owners preservados

`OG_PROPOSAL_INTELLIGENCE / operations.generatedDocuments`; `calculateCompleteQuote / resolveItemPrice`; `OG_DATA / resolveVehicleSupports / buildConsolidatedVehiclePieces`; `OG_TECHNICAL_APPLICATION_MAP`; `OG_CRM_SERVICE / state.leads`. Sem nova persistência, engine, dependência, preço, regra técnica, fórmula ROI ou mudança de auth/sync.

## Evidências reais desta implementação

Diretório verificável: `/workspace/artifacts/stage82-implementation/impacto/`.

- `mobile-{opening,composition,return}.png`, `desktop-{opening,composition,return}.png`: screenshots reais do produto integrado.
- `proposal-print-pages.pdf`: PDF real do documento capturado pelo botão de impressão (7 páginas).
- `proposal-white.pdf`: PDF real do print geral do app, sem chrome.
- `proposal-page-{1..7}.png`: imagens reais pelo botão PNG, 1588×2246; pixels/texto/logo/identidade amarela verificados e imagens inspecionadas.
- `proposal-long-pagination.pdf`: stress visual isolado, 16 páginas; repete linhas de apresentação para testar paginação, não representa composição comercial válida a enviar.
- `proposal-export.html`, `snapshot.json`, `result.json`, `additional-cases.json`: representação exata/auditoria.
- `../legacy/`: exports/classificação clássica; `../*.log`: registros dos gates. Artefatos não são dados do piloto nem publicação.

Fixture **Transportadora Horizonte · CENÁRIO ILUSTRATIVO**, não cliente real: 2 cavalos 4×2 + 3 carretas, 88 peças, 44 pneus atendidos, R$6.490,00. Modelo canônico sem alterações: vida atual18 meses, ganho estimado20%, combustível2% hipótese, pneuR$2.000 e combustívelR$10.000/mês fictícios/revisados. R$1.014,81/mês, R$12.177,78/ano, payback6,40 meses. Não são resultados comprovados ou percentuais universalmente aplicáveis.

## Validação

Focused proposal/document contracts, Impacto/classic browser export, save/reopen/reload/old versions, scoped logo changed/missing, media fallback, financial/technical identity, async switch A→B, no send/external requests/JS errors, 16-page pagination and explicit24-page cap: **PASS**.

Viewports Chromium emulados: 320×568,360×800,390×844,430×932,768×1024,1280×720,1440×900,1920×1080, todos sem overflow. Sem certificação de dispositivo físico/impressora/Safari.

Final gates executed: `npm run lint` / `og:check` PASS; `npm test`82/82 PASS including `release:gate`; `og:brain:refresh/check`188 records/0warnings PASS. Meu Dia, proposal workspace, Multi-Veículos, Shell/PWA and sync/reconnect/503/actual409 browser regressions PASS. Detailed logs and checkpoint retain the evidence.

## Limites / próximo passo / rollback

Homologar primeiro a narrativa, cards e exports com Lucas. Validar em telefone físico e no piloto somente após autorização separada; o runtime atual não recebeu o tema novo. Sem push, Railway patch, deploy, merge ou escrita em dados persistidos do piloto. Nenhum PIN/segredo de cliente usado nesta rodada.

Assets são conceituais: hoje só existem 4×2 e esquema de implemento3 compatíveis. Não ampliar elegibilidade por semelhança visual; novos assets exigem compatibilidade documentada. Logo local indisponível em outro aparelho mantém fallback OG. PDFs dependem de navegador com impressão/Save PDF; PNG usa páginas finitas e download explícito. Textos individuais que ultrapassem uma página geram erro compreensível; o teste longo cobre múltiplos blocos/configurações dentro dos limites existentes.

Rollback: reverter apenas commits de implementação/apresentação desta rodada para o código da entrada, por `git revert` na integração. Não resetar, apagar dados ou reimportar CRM. O renderer anterior lê preferências desconhecidas como apresentação clássica e mantém os snapshots/IDs/preços; as novas versões continuam recuperáveis. Sem migração. Preservar volume, histórico e assets autorizados. Publicação futura exige o protocolo vigente do QG.

Backlog preservado: proposta narrada por link com audiovisual, controle de acesso/privacidade e rastreamento consentido; assets autorizados por cliente e Reverse Technical Lookup. Não implementados.
