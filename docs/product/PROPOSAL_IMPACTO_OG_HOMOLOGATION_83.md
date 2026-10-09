# Etapa 8.3 — homologação Impacto OG

2026-10-09. **APROVADO COM RESSALVAS.** O núcleo comercial/funcional passou; dois defeitos visuais exigem decisão de Lucas antes da publicação. Esta rodada não corrigiu código, alterou o Design DNA, criou nova versão do produto nem publicou. Homologação automatizada local e inspeção das imagens pelo assistente; não houve teste de aparelho físico, Safari, impressora ou aceite online.

## Versão e ambiente

- Branch: `integration/dutra-os-one-system`.
- Entrada/versão examinada: `5087384560e6758b2b66109782903ee18d5c74ab`, Git limpo na entrada; implementação ancestral `096c8b68f2ccdfffd07b95cb6d8e1286e899084e`.
- Remote consultado: integração `8aab52a70ff2bd0b5d9691bb77264485f00df43c`; main `5255dc5d432850dfeebe0a523402a1902b1d3a52`. Os dois commits locais não foram enviados.
- Node24.19.0, npm11.9.0, Chromium151.0.7922.173 headless. Servidores temporários vinculados a127.0.0.1 e armazenamento isolado. Sem autenticação/dados/escritas no piloto ou produção.
- Owners: `OG_PROPOSAL_INTELLIGENCE / operations.generatedDocuments`; `OG_PROPOSAL_DOCUMENT`; `calculateCompleteQuote / resolveItemPrice`; `OG_DATA / resolveVehicleSupports / buildConsolidatedVehiclePieces`; `OG_TECHNICAL_APPLICATION_MAP`; `OG_CRM_SERVICE / state.leads`.
- Evidências novas: `/workspace/artifacts/stage83-homologation/`. Código homologado permaneceu congelado; apenas documentos/Brain desta auditoria são alterações pendentes. Sem commit, push, merge, deploy, migração ou envio externo nesta rodada.

## Comparação comercial

Todos os documentos exportados são **fictícios/ilustrativos**, sem dados pessoais reais. A abertura indica o destinatário, problema/solução, pneus atendidos e caráter conceitual da imagem. Investimento, retorno estimado e próximo passo aparecem depois, conforme a direção aprovada; não se presume que todos estejam visíveis no primeiro viewport mobile.

### Cenário principal — Transportadora Horizonte / CENÁRIO ILUSTRATIVO

Aplicações nativas independentes:2 cavalos/caminhões4×2, Volvo na pergunta técnica,120PSI, sem dianteira;3 implementos de3eixos,120PSI. As imagens são conceituais, não fotografias/identificação da frota ou confirmação física de compatibilidade.

| Grupo | Equipamentos por unidade | Unidades | Peças do grupo | Pneus atendidos | Investimento unitário | Subtotal |
|---|---|---:|---:|---:|---:|---:|
| Cavalo/caminhão4×2 | EQ-120×2; EQ-1145×2; EQ-1040×2; EQ-1043×2 | 2 | 16 | 8 | R$590,00 | R$1.180,00 |
| Carreta/implemento3eixos | EQ-120×6; EQ-1135×6; EQ-1040×6; EQ-1043×6 | 3 | 72 | 36 | R$1.770,00 | R$5.310,00 |
| **Total canônico** | Multiplicação uma única vez | **5** | **88** | **44** | — | **R$6.490,00** |

Preços unitários lidos do cálculo atual, tier`lead_ie`:EQ-120 R$213,00; EQ-1145/EQ-1135 R$22,00; EQ-1040/EQ-1043 R$30,00. Por exemplo, tractor:2×(213+22+30+30)=590; trailer:6×(213+22+30+30)=1770. Não se alterou catálogo nem preço oficial. A soma das linhas congeladas coincide com o investimento, antes/depois de salvar, revisar, reabrir e recarregar.

Pneus atendidos derivam dos equalizadores da aplicação cotada:4por cavalo e12por implemento. Não equivalem automaticamente ao total físico de pneus da frota; a dianteira foi excluída. Os2cavalos e3carretas não foram arbitrariamente pareados como conjuntos. Não há rateio confiável por eixo/conjunto no contrato: não foi inventado.

Condições do fixture:produtosR$6.490,00, taxaR$0,00,6parcelas exibidasR$1.081,67, texto de pagamento revisado no teste; frete a negociar, entrega15dias úteis conforme estado sintético. Frete estimado no texto não integra o total do owner. Condições reais devem ser confirmadas pelo vendedor. Arredondar todas as parcelas a centavos pode gerar diferença deR$0,02 na soma; não houve alteração da fórmula/política canônica nesta auditoria.

### ROI e limites

| Premissa | Valor | Origem/status nesta homologação |
|---|---:|---|
| Custo médio do pneu | R$2.000,00 | Fictício, explicitamente revisado |
| Vida útil atual do pneu novo | 18meses | Interpretação confirmada por Lucas; valor assumido para a simulação |
| Ganho de vida útil | 20% | Hipótese estimada revisada; não economia direta de20% no gasto |
| Combustível mensal da frota atendida | R$10.000,00 | Fictício, explicitamente revisado |
| Economia de combustível | 2% | Hipótese estimada revisada; não resultado OG universal/comprovado |

Fórmula canônica`replacement-cycle-and-fuel-v1`:

- Vida estimada=18×1,20=21,6meses.
- Pneus/mês=44×2000×(1/18−1/21,6)=R$814,814814…
- Combustível/mês=10000×0,02=R$200,00.
- Economia mensal estimada=R$1.014,814814…; anual=mensal×12=R$12.177,777777…
- Payback=6490/1014,814814…=6,395255…meses, exibido **6,40meses**.

Comparação independente da aritmética e `calculateRoi` passou. Premissa ausente/não revisada continua VALIDAR; ganho zero não fabrica payback. O horizonte exposto é anual,12meses;18meses representam vida atual, não duração da projeção. A conta normaliza ciclos de reposição; não é calendário de desembolsos de pneus novos, VPL, garantia nem previsão de caixa mensal. Frete, instalação, manutenção, financiamento, impostos adicionais e outros benefícios não foram presumidos/inventados. A base de combustível precisa corresponder à frota atendida. Premissas, fontes e limitações permanecem visíveis mesmo ao esconder a seção opcional detalhada.

### Curta e longa comercialmente consistentes

| Documento | Entrada | Saída do owner | PDF/PNG | Snapshot JSON compacto |
|---|---|---|---|---:|
| Curta/Compacto | 1configuração4×2,1unidade | 8peças;4pneus;R$590,00 | 2páginas | 5.029bytes |
| Principal/Técnico | 2configurações,5unidades | 88peças;44pneus;R$6.490,00 | 7páginas | <30KB |
| Longa/Técnico | 8configurações alternadas,15unidades | 248peças;124pneus;R$18.290,00 | 16páginas | 23.112bytes |

O caso longo desta rodada foi **recalculado pelo motor nativo**, não mera repetição de linhas de apresentação com um total antigo. Cada linha, quantidade e subtotal foi comparado com o snapshot. O teste de stress antigo de paginação permanece identificado separadamente em `impacto/proposal-long-pagination.pdf`, sem significado comercial. Limite existente24páginas/erro explícito foi exercitado pelo harness existente.

## Referência real somente leitura

O JSON enviado pelo usuário foi lido integralmente; contém13leads,1cotação em histórico e0propostas geradas. SHA256 original: `7d9841f8abe33cfdc1ef0114a8949d7bb284b493af8e304ec289d00e97cd5b7e`,135.527bytes; hash final idêntico. Arquivo original nunca alterado/importado. Apenas campos comerciais anônimos entraram na comparação local; nenhuma identificação pessoal entrou nas evidências.

Cotação histórica:1configuração`bitrem_7eixos`, override manual confirmado,12EQ-120 +4EQ-1271 +8EQ-1135 +2EQ-120D +2EQ-1250, além de1EQ-545 extra. **29peças eR$3.410,00**, reproduzidos exatamente pelo cálculo atual; diferençaR$0,00. O owner calcula28pneus atendidos; o backup não comprova a contagem física real.

Lacunas: `clientId` e`technicalContext.leadId` ausentes, nenhum vínculo canônico ao CRM nessa cotação, nenhuma proposta existente/versionada no backup; classificação/contexto técnico legados incompletos e configuração manual não constituem validação física OG. Nenhum ID foi preenchido artificialmente no original. Portanto **referência financeira histórica:PASS; proposta real completa/mesma identidade:NOT RUN por ausência de referência vinculada disponível localmente**. Isso não contradiz os testes sintéticos de isolamento e identidade; limita a abrangência do aceite real. É necessário escolher posteriormente uma proposta real vinculada, em cópia privada ou piloto autorizado.

## Testes executados nesta rodada

| Teste | Resultado/evidência |
|---|---|
| `npm run og:check` | PASS;`logs/og-check.log` |
| `npm test` | **82/82 gates PASS**; inclui contratos comerciais/técnicos/preços/snapshot/propostas, segurança/privacidade, sync/PWA e`release:gate`;`logs/npm-test.log` |
| `npm run og:brain:check` | PASS188registros/0warnings antes de novos registros; PASS192registros/0warnings após registrar os incidentes abertos |
| `og:proposal:impacto:browser:test` | PASS; fluxo real da UI,4versões imutáveis, template/seções/textos, ativo autorizado por cliente/fingerprint, imagem/logo ausente/alterado, save/reopen/reload, export realPDF/7PNG, stale A→B,0envios/requests externos/errosJS;`logs/impacto-browser.log` |
| `og:proposal:export:browser:test` | PASS; apresentação histórica clássica, PDF/4PNG;`logs/legacy-browser.log` |
| `og:proposal:browser:test` | PASS; aplicações/preços/ROI nativos, identidade/revisões/histórico, HTTP503/outbox/reload/reconnect e409explícito;`logs/workspace-browser.log` |
| `og:sync:browser:test` | PASS; conflito durável após reload, preparar revisão sem publicar, envio explícito da revisão para servidor isolado/ACK real, fila limpa, sem loops/listeners acumulados;`logs/sync-browser.log` |
| Harness externo`functional-extra.mjs` | PASS; **`context.setOffline(true)`/navigatoroffline real**, alteração de proposta local, navegação, reconnect/ACK e snapshot exato;409da proposta resolvido explicitamente;`logs/functional-extra.log` |
| Harness externo`commercial-export-audit.mjs` | PASScomparações financeiras, curta/longa recalculadas,18PNG adicionais/PDF2e16páginas, fallback,0requests externos/errosJS;`commercial-audit.json`,`png-audit.json`,`logs/commercial-export-audit.log` |

Os harnesses adicionais ficam fora do Git/produto. Falhas iniciais de instrumentação (dependência ausente no host isolado, retorno Blob, abrir painel antes de preencher) foram corrigidas somente nesses harnesses e seus logs preservados. Não são defeitos do produto nem motivo para enfraquecer assertions. Não foi alterado nenhum teste existente para passar.

Viewports automáticos:320×568,360×800,390×844,430×932,768×1024,1280×720,1440×900,1920×1080. Sem overflow horizontal; feedback fora da navegação mobile; preview desktop>600px. PDF efetivo via Chromium, a partir do HTML exato capturado no iframe do botão imprimir; diálogo do SO/impressora não exercitado. PNG principal baixado pelo botão real; curta/longa adicionais invocam o mesmo exportador em host isolado. Nenhum status SENT foi criado. Históricos/versões clássicas e financeiras anteriores permaneceram iguais.

## Inspeção visual e defeitos

Inspeção pelo assistente das capturas mobile/desktop, páginas rasterizadas dos PDFs e PNGs efetivos. Preto/amarelo, card4×2, esquema3eixos, faixa preta do retorno, valores emBRL/paybackcomvírgula e ausência de chrome no documento conferem. LogoQA vermelho é sintético/autorizado no fixture, não logo real de transportadora. Falta de ilustração mantém peças/valores; nenhuma foto real foi manipulada.

| ID | Severidade | Defeito reproduzido | Evidência | Correção mínima proposta, **não aplicada** |
|---|---|---|---|---|
| H83-01 | P2/média | Títulos consecutivos do anexo ficam órfãos no fim da página4; conteúdo começa na5. Não houve perda de linhas/valores. | `impacto/pdf-page-4.png`,PDFprincipalp4,PNGp4 | Em`paginate`,agrupar sequência de headings com primeiro bloco de conteúdo; verificar páginas limite sem mexer no DesignDNA/totais. O lookahead atual só vê o heading seguinte. |
| H83-02 | P2/média | Aviso do hero sem imagem fica branco em fundo#f4f5f6,contraste**1,09:1**. Cardtextual de veículo continua legível. | `fallback/mobile.png`,`fallback/desktop.png`,`commercial-audit.json:fallbackContrast` | Corrigir somente especificidade/cor do placeholder dentro do hero; contraste≥4,5:1 e regressão renderizada screen/PDF/PNG com imagens indisponíveis. |
| H83-03 | P3/baixa | Singular aparece como“1veículos”; validade é ISO no documento. | `short/page-1.png`,`short/proposal.pdf` | Ajustes de apresentação/plural/dataBR,sem tocar contagem/validade canônicas. |

Paginação preservou todos os conteúdos e números. O documento Técnico de2configurações tem7páginas, com folga e última página pouco ocupada; Compacto tem2páginas e serve à leitura rápida. Melhorar densidade é opção de produto, não justificativa para redesenhar agora. Metadados técnicos/fontes pequenos requerem zoom no PNG A4 pelo celular; mobile HTML é responsivo. Textos individuais maiores que uma página e documentos>24páginas geram erro limitado, não saída incompleta silenciosa.

## Parecer e próximos passos

**APROVADO COM RESSALVAS**, sem achado crítico de cálculo, perda de dados, contaminação entre clientes ou violação de histórico nos testes executados. Não recomendo publicação irrestrita antes de autorizar as duas correções P2 e sua rechecagem focada. Esta classificação não é autorização de publicação.

Pendências objetivas:decisão de Lucas sobre correções mínimas; depois screenshot/PDF/PNG de fronteira e fallback, sem repetir suíte pesada se código fora dessas áreas ficar intacto; referência real com clientId/quote/proposta vinculados; teste de telefone físico e fluxo de impressão/Safari conforme dispositivos usados. Dispositivo físico e aceite online continuam NOT RUN. Autorização explícita separada é necessária para qualquer correção do produto e publicação.

Rollback desta auditoria:descartar/reverter somente documentos novos/entradas de Brain identificadas nesta rodada se desejado; produto permanece no checkpoint5087384. Não resetar dados ou trabalho anterior. Não há deploy, schema ou persistência a reverter. Correções futuras devem ser commits pequenos reversíveis sobre o mesmo renderer, sem alteração de owner/cálculo.

Evidências principais: `impacto/mobile-{opening,composition,return}.png`;`impacto/desktop-{opening,composition,return}.png`;`impacto/proposal-print-pages.pdf`;`impacto/proposal-page-{1..7}.png`;`short/proposal.pdf`;`long/proposal.pdf`;`fallback/*.png`;`commercial-audit.json`;`manifest.json`; pacote`Impacto-OG-homologacao-8.3.zip` no diretório de artefatos. Todos foram gerados nesta rodada; nenhum arquivo contém o backup real bruto.

Fechamento: HEAD permanece5087384560e6758b2b66109782903ee18d5c74ab; remote integração/main reconferidos e idênticos à entrada. Working tree DIRTY **somente documentação/Brain**. Diferença em apps/, scripts/ e package/lockfile:nenhuma. Registro/documentação ainda sem commit; sem push/deploy. Brain refresh/check final:192registros,0warnings.
