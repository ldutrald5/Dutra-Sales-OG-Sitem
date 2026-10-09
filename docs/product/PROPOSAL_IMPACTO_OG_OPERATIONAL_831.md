# Stage8.3.1 — acesso operacional privado / Impacto OG

Estado: **PATCH_READY / LOCAL_OPERATIONAL_PASS**; implementação e source-only patch preparados/revisados. Atualização do piloto e aceite autenticado online ainda exigem aprovação explícita de Lucas. Não confundir pacote local com versão publicada.

Entrada: `5087384560e6758b2b66109782903ee18d5c74ab`, branch `integration/dutra-os-one-system`. WIP documental da homologação8.3 preservado. Não houve reset, mudança de preço, migração ou criação de engine.

## Correções mínimas

- H83-01: `OG_PROPOSAL_DOCUMENT.paginate` agrupa a sequência de títulos consecutivos com o primeiro bloco de conteúdo. Não deixa o anexo/aplicação isolados ao fim da página. Preserva limites de bloco/24 páginas e quantidades/valores.
- H83-02: seletor específico para o aviso do hero sem mídia mantém texto escuro sobre fundo claro. Contraste calculado real: **8,77:1**, antes1,09:1. Design DNA e assets imutáveis preservados.
- Service worker v82 invalida o shell anterior para receber a correção; mesma estratégia de cache, outbox e auth.

## Fluxo executado, não apenas componentes

`og:proposal:operational:browser:test` executa o servidor canônico em diretório privado temporário, com PIN/token aleatórios de teste não impressos e autenticação persistente ativada. Navegador usa login real/cookie; token do harness só inicializa/lê o fixture isolado server-side.

1. API anônima rejeitada; login pelo formulário, cookie HttpOnly/Secure/SameSite=Strict e prazo30dias; nenhum PIN/token bruto no storage do navegador.
2. CRM → Novo cliente fictício → pesquisa → Abrir ficha → Aplicação técnica. Identidade criada pelo owner `OG_CRM_SERVICE/state.leads`; bridge da ficha preserva exatamente o mesmo ID.
3. Duas aplicações independentes no engine existente, multiplicadores2/3, envio para uma cotação e revisão das condições.
4. Preparar proposta, editar condições/premissas/apresentação, criar quatro versões imutáveis; histórico original da cotação não duplica nem muda.
5. Impacto OG, templates/seções, logo de fixture autorizado, exportação efetiva de PDF e sete PNGs; PDF reaberto/analisado e páginas renderizadas para inspeção.
6. Sair/login novamente → reabrir mesma proposta; parar/reiniciar o processo com mesmo diretório/secrets → sessão e arquivo durável conservam o registro completo.
7. Resposta/exportação tardia de A não aplica em B; nenhuma requisição externa, envio ou registro SENT. Sessão anterior é rejeitada após logout e novo contexto sem sessão recebe401.

## Comparação canônica do cenário FICTÍCIO

Todos os arquivos desta rodada identificam a empresa como `Transportadora QA · ORÇAMENTO FICTÍCIO`. Nada foi inserido no piloto online.

| Grupo | Aplicação unitária | Multiplicador | Peças / pneus atendidos | Subtotal |
|---|---|---|---|---|
| Cavalo4×2, Volvo,120PSI, sem dianteira | 8peças /4pneus /R$590,00 | 2 | 16 /8 | R$1.180,00 |
| Carreta3eixos,120PSI | 24peças /12pneus /R$1.770,00 | 3 | 72 /36 | R$5.310,00 |
| Consolidado | preços do tier canônico `lead_ie` | 5veículos | **88 /44** | **R$6.490,00** |

Itens canônicos: EQ-120/R$213; EQ-1145 e EQ-1135/R$22; EQ-1040 e EQ-1043/R$30. Preço/subtotal mostrado é do snapshot nativo, não fórmula de apresentação. Não se inventou rateio por eixo/conjunto. Configurações sem mídia compatível continuam válidas e mostram texto explícito.

ROI ilustrativo revisado: pneuR$2.000; vida atual18meses; ganho estimado20%; combustível da frota atendidaR$10.000/mês e economia estimada2%. Vida projetada21,6meses; economia de pneusR$814,81/mês + combustívelR$200,00/mês = **R$1.014,81/mês**, **R$12.177,78/ano**, payback **6,40meses**. Os18meses são vida atual, não horizonte da projeção. São premissas sintéticas explícitas, sem garantia nem aplicabilidade universal. Frete/condições exigem revisão comercial e custos fora do cenário não entram silenciosamente no total.

## Runtime e acesso reais verificados

- URL: https://dutra-os-uxr01-preview-production.up.railway.app/
- Railway projeto `DUTRA OS UXR-01 Preview` / `d8e7173f-b8d3-4f8a-85e7-33c93d627774`; ambiente `production` **dentro do projeto de previews**, ID`e5b1fd77-0460-431c-b886-7be134a5c5f3`.
- Serviço existente `dutra-os-uxr01-preview`, ID`b385d7a3-616c-4c44-82c7-7c9541ba7c45`.
- Live deployment `6d07fb1a-ef61-4ec3-9269-113907e03afb` SUCCESS/1replica. SHA **be83c32bf4c1c395daafb2a3b7877bbeda467976**: Stage8, anterior ao export/Impacto atual. Nenhum deploy executado nesta rodada.
- Volume próprio `piloto-dutra-os-data`, ID`509ed70c-cdfc-44e9-9eaf-3d0dc144ff2c`,500MB,`/data`; não é volume produtivo. `/health`200 e `persistent:true`. Persistência local após restart testada; novo orçamento/retention online nesta rodada NOT RUN.
- Runtime público: `isolatedPreview:true,persistentAuth:true,pilotRealData:true`. Segredos só Railway, nomes auditados sem valores. Nenhuma configuração de Supabase/provider produtivo copiada. Este runtime usa `/api/state` autenticado e arquivos duráveis, não escrita Supabase produtiva.
- HTTP TLS verificado: raiz/health/runtime-config200; `/api/state` e `/api/access/session`401 sem login; `/.data/shared-state.json` e `/.data/access-sessions.json`403.
- Tela de PIN abre a390×844 e1440×900, sem overflow/erro crítico. Login com PIN real existente NOT RUN pelo assistente: credencial/sessão não fornecida nem extraída do ambiente. Não substituir PIN para testar.

O piloto é base privada compartilhada da equipeOG; não há autenticação/ACL de organizações independentes. Proteção server-side contra acesso anônimo/revogado e escrita cross-origin foi testada. Isolamento de identidade entre clientes é testado no fluxo; isso não equivale a isolamento multi-tenant. Local-first conserva dados no dispositivo confiável mesmo após logout; não certificar PC público/compartilhado. Usar PIN existente, manter conectado somente em dispositivo confiável, Sair para revogar a sessão.

## Caminho para Lucas preparar orçamento

No PC ou celular, abrir a URL HTTPS (sem depender do mesmo Wi-Fi). Entrar com PIN já gerenciado no ambiente, sem registrar em chat/documentação. `CRM / Clientes` → pesquisar empresa ou `Novo cliente` → `Abrir ficha` → `Aplicação técnica` → configurar Cavalo/Caminhão ou Carreta/Implemento e120PSI/configuração real → `Enviar para cotação` → `Adicionar veículo` para outras aplicações → `Multi-Veículos / Propostas` → revisar peças/preços/quantidades/condições → `Preparar proposta`.

**Após aplicar o pacote preparado**, `Documento para o cliente` permite tema `Impacto OG`, seções/preview e `PDF / Imprimir` → diálogo do navegador → `Salvar como PDF`. PNG é paginado. `Histórico` → carregar cotação → versões da proposta para reabrir/criar revisão. A UI publicada hoje ainda é Stage8; não prometer controles8.1/Impacto antes do deploy. Revisar todo resultado VALIDAR e condições antes de enviar manualmente ao cliente.

## Evidências e gates

Artefatos isolados `/workspace/artifacts/stage831-operational/operational/`: PDF`proposal-print-pages.pdf`, PNG`proposal-page-1.png`…`7.png`,16páginas`proposal-long-pagination.pdf`, screenshots8viewports, `missing-image-mobile.png`, `snapshot.json`, `result.json`, `additional-cases.json`. Logs no diretório irmão`logs/`; live anônimo e Railway em`live/` e`railway-readonly-audit.json`. Não contêm dados/segredos produtivos.

Executados: proposal-focused PASS; Impacto browser PASS; sessão server-side/browser PASS (PIN inválido, reload/browserreopen, logout/revogação, actualoffline/reconnect/PWA/restart, origin403/private-file403/409); operacional autenticado PASS, com versões, preços, PNG/PDF,8viewports, captura de limites de páginas e fallback. Emulação Chromium, não aparelho físico/Safari/impressora. Gate geral final executado: `npm run lint`/og:check PASS; `npm test` **82/82 PASS**, incluindo `release:gate`; Brain refresh/check **194 registros/0warnings PASS**. Browser clássico atual PASS (PDF4/PNG4); reconnect atual PASS (fila vazia, ACK real,503,409/revisão e sem acúmulo de listeners). Diferença de produto revisada: somente renderer e versão do shell; nenhuma alteração nos owners/cálculos/auth/sync/provider/preços.

## Publicação controlada e rollback

Nenhuma infraestrutura nova/variável/volume/banco/domínio precisa mudar. Implementação **04ad48077702ae00b2e38e24b58628b42d6d8a26**, commit e push somente da integração PASS, local=remote/CLEAN, hooks normais82/82. O mesmo patch`1fe3f12f-2078-4586-88f3-4aa395c33630` foi retargeted para esse commit, substituindo o alvo obsoleto86027135. Readback Railway: STAGED/non-destructive, apenas source do serviço piloto; repo/branch permanecem iguais, commitSHAbe83c32→04ad480 e limpeza do image:null; nenhuma variável/volume/rede/outro serviço. Nada construído/aplicado. Source live é pinned, portanto push da integração NÃO disparou deploy. Não chamar accept_deploy até autorização explícita de Lucas. Documentação de fechamento pode avançar HEAD sem mudar alvo testado04ad480.

Rollback de runtime: pin novamente **be83c32bf4c1c395daafb2a3b7877bbeda467976**, preservando volume/sessões/estado atual e backup. Rollback dos dois fixes por revert do commit específico, nunca apagar proposta/CRM/history ou reduzir dados atuais a um seed. Código de Stage8.2 continua opt-in/versionado; propostas antigas não migram visualmente.

Pendências: aprovação para entrega externa/publicação privada; login/smoke autenticado online pelo usuário ou sessão autorizada; aceite em telefone físico/diálogoPDF usado por Lucas. P3 plural/data permanece backlog conforme homologação8.3; sem redesign. Nenhum acesso multi-conta foi criado. MAIN/PRODUÇÃO OFICIAL/V2/V3 alterados:NO; preços/ROI/CRM/auth/sync architecture alterados:NO. Acesso atual existe, porém missão integral com Impacto online ainda NÃO COMPLETE.
