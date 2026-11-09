# Precision Workspace V1 — adoção experimental da Mesa

Autorização: PREMIUM DESIGN SYSTEM ADOPTION 01, 09/11/2026. Referência oficial `64caafb`; implementação parte do piloto local `a47df3d`. Nada neste documento comprova publicação ou homologação humana.

## Fonte e decisão

Pacote fornecido `DUTRA_DESIGN_V1_HANDOFF.zip`, SHA-256 `19d47dafec5b4a123b1f5b12fa66c2c537c4fba20c37fd5ea77b39a147846dc0`. Sete documentos e composições inspecionados. As proibições de implementar contidas no handoff pertencem à missão antiga de design; a autorização atual seleciona **B — Precision Workspace** para implementação experimental. Impacto OG continua sendo a direção da proposta comercial, superfície distinta.

## Mapa para o código real

| Handoff/papel | Token/componente atual | Adoção neste lote |
|---|---|---|
| Canvas/surface/raised | `--og-bg`, `--og-surface`, `--og-surface-raised` em styles.css | Aliases unidirecionais `--pw-*` no escopo `.precision-workspace` |
| Texto/apoio/marca | `--og-text`, `--og-muted`, `--og-brand` | Mesmos valores canônicos; 14px operacional/12px apoio/16px campo mobile |
| Limite de controle/seleção | Antes dispersos em CSS local | Papéis locais `--pw-control:#738091`, `--pw-selected:#292919`, raio6/8 e espaçamento16 |
| C04 workspace | `index.html #tab-dia`, hero/indicadores existentes | Header plano; execução antes do apoio; indicadores compactos |
| C06 AccountRow | `OG_UI_COMPONENTS.clientRow`, `renderDayDashboard` | Mesmo renderer/handlers/IDs, separadores e trilho2px/“Em foco” |
| C05/C07 conta e Agora | `renderSalesDeskClient` | Superfície plana, metadados legíveis, motivo expansível e canais neutros |
| C11/C12 registro | `openDeskRegister`, `saveDeskOutcome`, `commitSalesOutcome` | Mesmo formulário/enums; primária visual acompanha aberto/fechado |
| Fila e avanço | `OG_SALES_DESK.selectQueue/nextLead` | Nenhuma regra nova de ranking, recorte ou fallback |
| Mobile fila/foco | Estado de apresentação inexistente no piloto | `#tab-dia.dataset.deskView`, efêmero; mesmos nós/dados/handlers; sem storage novo |
| C17 compromissos | `OG_MISSION_CONTROL.project/render` | Projeção preservada; sugestão queue[0] fica em apoio expansível para não competir com a conta selecionada |
| C19 sync | `setSyncStatus`, bridge/outbox existentes | Textos/modos/ACK/conflito reais preservados |
| Ficha/cotação | `openClientSheet`, `openDeskQuote`, serviço de contexto | Mesmas pontes e guardas; nenhuma ficha ou proposta paralela |

O stylesheet novo é um limite explícito de adoção, carregado depois dos estilos de componentes e precacheado pelo Service Worker v86. Não substitui tokens globais nem cria outro tema persistido. Consolidação global dos aliases só após os próximos lotes comprovarem reuso.

## Diferenças deliberadas do handoff

- Shell mantém sidebar238/header100 existentes; 216/56, grupos e iconografia global ficam no lote de shell.
- Call AI/revisão Sales Execution não é incorporado como segundo formulário. O ramo canônico abre a revisão atual, com conta e retorno existentes.
- Cotação, aplicação e Call AI ficam como links secundários diretos; não foi criado menu “Mais ações” para esconder três destinos úteis.
- Ação secundária WhatsApp por linha foi retirada visualmente da fila; o mesmo canal permanece no painel da conta selecionada. Selecionar a conta não registra contato.
- Indicadores e sugestão da fila permanecem acessíveis depois da execução; não foram apagadas as projeções do Meu Dia.
- Mobile preserva shell/bottom nav; o H1 duplicado é acessível mas não ocupa mais uma faixa acima da conta. A alternância Fila/Conta fica no início da rotina.
- Campos/enums, defaults de follow-up e `nextLead` são do owner existente; não mudam para imitar o SVG.
- Canais sem dados válidos apresentam indisponibilidade; WhatsApp consulta o mesmo builder atual.
- Os 23 contratos são catálogo futuro, não 23 componentes implementados neste lote.

## Próximo incremento para Company 360

Refinar apenas o header da ficha universal atual: empresa, código/identidade, status textual, contato e próxima ação, largura/reflow e fechamento44 com foco preservado. Consumir a projeção `OG_COMPANY_360` já existente e manter toda escrita/revisão nos owners atuais. Depois validar essa única superfície antes de expandir timeline, documentos ou frota. Logo somente com ativo autorizado; lacunas continuam explícitas.

## Evidência e limites

Capturas reais, logs, comandos, manifesto e comparação com SVG em `/workspace/artifacts/PREMIUM-DESIGN-ADOPTION-01-20261109/`. Chromium/headless e viewports emulados não equivalem a teste em aparelho físico ou leitor de tela. Recuperação/off-host/produção não fazem parte deste lote.
