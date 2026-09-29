# DUTRA-PROSPECT-01 — Prospecting Intake

## Objetivo
Transformar um pedido como "transportadoras em Cascavel com 30+ caminhões" em uma missão estruturada, auditável e pronta para um provedor de pesquisa, sem criar leads automaticamente.

## Implementado
- critérios normalizados por cidade/UF usando Territory Readiness;
- segmento, frota mínima, palavras-chave e limite;
- política obrigatória de evidência pública;
- contrato de saída para empresa, fonte, frota, decisor, contato e fit OG;
- normalização de candidatos;
- deduplicação contra a carteira antes de qualquer importação;
- estado `ready_for_review` versus `insufficient_evidence`;
- política `prepare_only`.

## Guardrails
Pesquisa não é fato de CRM. Candidato só pode seguir para revisão quando possui fonte pública registrada. Importação continua separada da descoberta.

## Próximo
DUTRA-PROSPECT-02: Provider Adapter + Research Queue. O provedor poderá ser web/API autorizada, sempre retornando evidências no contrato desta fase.
