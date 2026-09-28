# DUTRA OS — Arquitetura Alvo

## Direção
A evolução não será uma reescrita. O núcleo atual permanece operacional e recebe uma camada de orquestração sobre os serviços canônicos.

```text
Mobile / Desktop Command Center
          |
     Mission Router
          |
  +-------+--------+----------------+
  |       |        |                |
CRM    Knowledge  Automation     Approval Queue
  |       |        |                |
  +-------+--------+----------------+
          |
   Integration Adapters
          |
GitHub / Calendar / Gmail / Drive / APIs autorizadas
```

## Contrato de agente
Cada agente deve declarar:
- missão;
- entradas mínimas;
- ferramentas permitidas;
- fontes de evidência;
- saída estruturada;
- ações que exigem aprovação;
- orçamento de contexto/custo;
- timeout e fallback;
- logs de decisão sem expor segredos.

## Agentes planejados
- **Orchestrator:** decompõe a missão e escolhe capacidades.
- **Prospecting Researcher:** coleta evidências e enriquece prospects.
- **Account Analyst:** sintetiza Account 360.
- **Sales Coach:** prepara ligação, diagnóstico e objeções.
- **Technical Specialist:** aplicação OG e validação técnica.
- **ROI Analyst:** cenários, premissas, ROI e payback.
- **Proposal Builder:** transforma dados aprovados em proposta.
- **Follow-up Planner:** cria cadências, tarefas e sinais.
- **Reviewer:** valida evidência, consistência e risco antes de ação.

## Integrações
Toda integração deve usar adaptador com interface comum: `read`, `prepare`, `execute`, `health`. `execute` é bloqueado por política quando a ação exige aprovação.

## Observabilidade
Registrar por execução: missionId, accountId quando aplicável, agente, duração, ferramentas, status, custo estimado, evidências utilizadas e ação resultante.

## Segurança
Segredos fora do Git; permissões mínimas; tokens revogáveis; nenhuma credencial no frontend; logs sem conteúdo sensível desnecessário.

## Migração
1. contratos e telemetria;
2. orquestração somente leitura;
3. tarefas/sinais internos;
4. integrações de leitura;
5. fila de aprovação;
6. ações externas explicitamente autorizadas;
7. autonomia ampliada apenas com métricas e rollback.
