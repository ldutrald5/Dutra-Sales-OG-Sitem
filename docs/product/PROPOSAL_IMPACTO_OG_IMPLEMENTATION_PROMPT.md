# Preparação futura — Impacto OG

Atualização posterior: Lucas autorizou implementação controlada. Esta rodada visual permanece histórica; entrega atual em [Implementation](PROPOSAL_IMPACTO_OG_IMPLEMENTATION.md). Nenhuma publicação autorizada.

**DRAFT / NÃO EXECUTAR AGORA.** Direção A oficialmente confirmada; revisão final pronta em PROPOSAL_IMPACTO_OG_FINAL_REVIEW.md, integração aguardando autorização explícita. Este arquivo prepara uma implementação futura, sem conferir autorização de código/deploy.

TYPE: UX_UI. LEVEL: L2. EXECUTOR: dutra-product + dutra-dev + dutra-quote-engine; QA focado.

CONFIGURAÇÃO RECOMENDADA:
Modelo: GPT-6.1 Sol.
Inteligência: alta.
Velocidade: normal.
Motivo: apresentação delimitada sobre owners estáveis, com integridade histórica/exportação a preservar.

# MISSION

Quando Lucas autorizar a implementação, adaptar a proposta existente à direção **A — Impacto OG**. Uma narrativa comercial sobre o mesmo view model: abertura → composição/investimento → economia revisada → próximo passo. Não implementar B/C como novos conceitos.

# CURRENT STATE

Stage 8/8.1 já dispõe de proposal owner, templates funcionais, apresentação versionada, print/PDF/PNG e ativos autorizados. Stage 8.2 só produziu protótipos isolados e DNA. Usar `docs/product/PROPOSAL_IMPACTO_OG_DESIGN_DNA.md` como seleção; verificar quais refinamentos foram aceitos antes de incorporá-los. O estado online não foi recertificado nesta rodada.

# TARGET STATE

Impacto OG integrado ao render/export existente, com poucos dados na abertura, cards Cavalo/Carreta claros, preços rastreáveis e faixa econômica amarela com complemento preto. Preview e export devem preservar a mesma proposta histórica e identidade.

# CONTEXT MANIFEST

required:
- AGENTS.md; .codex/skills/dutra-product/SKILL.md; .codex/skills/dutra-quote-engine/SKILL.md; .codex/skills/dutra-dev/SKILL.md.
- docs/product/PROPOSAL_IMPACTO_OG_DESIGN_DNA.md; docs/product/PROPOSAL_IMPACTO_OG_FINAL_REVIEW.md; docs/product/VISUAL_CO_CREATION_PLAYBOOK.md; docs/handoffs/V3_UNIFICATION_CHECKPOINT.md.
- apps/sistema-og/components/proposal-document.js; apps/sistema-og/components/proposal-workspace.js; apps/sistema-og/services/proposal-intelligence-service.js.
- scripts/test_proposal_document.mjs; scripts/test_proposal_premium.mjs; scripts/test_quote_composition_snapshot.mjs.
- Second Brain: DEC-CONVERGENCE-EXPORT-001, DEC-PROPOSAL-EXPERIENCE-001, DEC-PROPOSAL-IMPACTO-001, INC-QUOTE-RECURSIVE-SNAPSHOT-001, INC-ROI-IMPLICIT-PREMISES-001, INC-PROPOSAL-LATE-CONTEXT-001.

conditional: app.js/renderOfficialProposalDocument e CSS envolvidos; export/browser harness já existente; contrato de materials quando usar branding; dutra-runtime-operator/INC-RAILWAY-APPROVAL-HANDOFF-001 se publicação for autorizada depois.

do_not_load: CRM inteiro, dados reais sem necessidade, histórico completo, módulos não relacionados ou infraestrutura produtiva.

# SOURCE OF TRUTH

Proposta/ROI: OG_PROPOSAL_INTELLIGENCE + operations.generatedDocuments. Apresentação: OG_PROPOSAL_DOCUMENT.viewModel. Preço: calculateCompleteQuote + resolveItemPrice. Técnica/classificação: OG_DATA/buildConsolidatedVehiclePieces + OG_TECHNICAL_APPLICATION_MAP. CRM: OG_CRM_SERVICE/state.leads. Logo: operations.materials + OG_MATERIAL_STORE, somente aprovado e associado ao cliente.

# PRE-FLIGHT

Verificar status/branch/local/remote e checkpoint; preservar WIP legítimo. Pesquisar render/blocos/export equivalente antes de criar. Capturar baseline de investimento, peças, pneus, ROI, IDs e proposta histórica. Nenhum reset ou cópia de segredos. Confirmar autorização posterior e refinamentos selecionados.

# SCOPE

Tokens/layout/copys aprovados, mídia autorizada, hierarquia e cards sobre os blocos existentes. Preservar formatos Executivo/Técnico/Compacto quando compatíveis. Não criar renderer de negócio separado. Referência isolada: `/workspace/artifacts/stage82-impacto-final/index.html` e PNGs; artefatos não são código pronto para copiar integralmente.

# OUT OF SCOPE

Novas fórmulas/preços/percentuais padrão; rateio por eixo sem dado; novo CRM/owner/engine/store; portal narrado, envio externo, migrações, produção/main. Não embutir base64/binários ou CRM/history/state no snapshot. Não converter imagem conceitual em suposta foto de frota real.

# EXECUTION PLAN

1. Mapear blocos e menor adaptação do renderer atual; separar apresentação de dados.
2. Aplicar DNA/refinamentos aprovados com ausência de logo/ROI digna e VALIDAR explícito.
3. Preservar histórico/versionamento, limites de mídia e tokens de contexto para resposta/export tardio.
4. Validar preview/print/PNG; escrever evidência e checkpoint. Publicação somente com autorização específica, sem accept_deploy automático.

# ACCEPTANCE CRITERIA

- Mesmos clientId/proposalId/quoteId, veículos, peças, quantidades, preço e ROI antes/depois.
- +20% de vida e 18 meses de vida atual não tratados como defaults nem economia direta. Premissa ausente/pendente não produz cifra fake.
- Card identifica Cavalo/Carreta pelo metadata, nunca pelo desenho/código isolado; sem multiplicação dupla. Mídia deve corresponder à configuração/escopo; 6×2/6×4 não recebem desenho de 4×2. Ausência de ativo compatível omite desenho sem inventar eixos ou invalidar técnica. Localização numérica não recalcula valor.
- Economia mantém valor amarelo dominante; preto complementa sem encobrir leitura.
- Preview/print/PNG compartilham modelo; sem chrome da aplicação ou clipping; branding autorizado ou fallback OG.
- Histórico imutável e snapshot mínimo dentro dos limites atuais; export != sent; sem requests externos não autorizados.

# TEST PLAN

Testes focados durante desenvolvimento: proposal/document/snapshot, classificação, troca de contexto e revisão histórica. Renderizar e inspecionar mobile 320/360/390/430 e desktop 1280/1440/1920, PDF e PNG reais. Testar sem logo, ROI omitido/VALIDAR e proposta longa. Gate final proporcional conforme AGENTS/skills; não repetir suite ampla a cada CSS.

# DEFINITION OF DONE

Implementação autorizada e visualmente revista, testes/evidências reais, nenhuma mudança financeira/técnica, checkpoint e diff revisados. Reportar claramente local versus online; seguir protocolo de patch do piloto se deploy for autorizado. Rollback isolado dos arquivos alterados; nunca tocar dados persistentes.
