# DUTRA OS — Command Core

## Missão
Transformar o Sistema OG de um CRM local-first em um sistema operacional comercial e técnico, mantendo fatos auditáveis, operação mobile-first, modo offline e aprovação humana para ações externas.

## North Star
Ao comando **"Dutra, começa meu dia"**, o sistema deve conseguir:
1. ler agenda, tarefas, carteira e sinais confirmados;
2. priorizar contas com score explicável;
3. sugerir a próxima ação e o motivo;
4. preparar pesquisa, ligação, mensagem, proposta ou pós-venda;
5. registrar somente fatos confirmados;
6. devolver o vendedor à próxima missão.

## Fontes de verdade
- CRM e domínio canônico: estado operacional existente e serviços canônicos.
- Conhecimento OG: Sales Brain / Knowledge Command Center.
- Atividades: eventos confirmados.
- Propostas: snapshots e taxonomia de eventos.
- Automações: criam tarefa, sinal ou sugestão; não inventam fatos.

## Camadas
### 1. Mission Control
Meu Dia, fila inteligente, Next Best Action, sinais e agenda.

### 2. Account Intelligence
Account 360, contatos, frota, dores, oportunidades, histórico, propostas e próximos passos.

### 3. Prospecting Intelligence
Descoberta, enriquecimento controlado, deduplicação, evidências, priorização e preparação de abordagem.

### 4. Sales Copilot
Call AI, diagnóstico, objeções, mensagens, follow-up e coaching contextual.

### 5. Technical Intelligence
Aplicação por veículo/eixo, suporte, código ERP, regras técnicas, evidências e Aplicação Visual 360°.

### 6. Proposal & ROI
Cotação, ROI/payback, snapshot versionado, publicação segura e sinais de intenção.

### 7. Lifecycle
Instalação, satisfação, indicação, expansão, reposição e reativação.

### 8. Integration Fabric
Conectores e APIs com permissões mínimas, observabilidade, idempotência e fila de aprovação.

## Regra de autonomia
### Pode executar sem confirmação
- pesquisar dados públicos;
- calcular;
- classificar com regra explicável;
- preparar rascunhos;
- criar sinais/tarefas internas;
- testar código;
- produzir relatórios.

### Exige confirmação humana
- enviar mensagem/email;
- alterar condição comercial;
- publicar proposta;
- excluir dados;
- aceitar venda em nome do cliente;
- executar ação externa irreversível.

## Princípios
1. Uma fonte de verdade; nenhuma base paralela.
2. Determinístico antes de IA.
3. Evidência antes de afirmação.
4. Local-first continua funcional.
5. Mobile é superfície principal de comando.
6. Integrações entram por adaptadores, nunca acopladas ao domínio.
7. Toda automação deve ser auditável e reversível quando possível.
8. Custos de IA devem ser medidos por missão e por conta.
9. Segurança e autorização são requisitos de produto.
10. Cada incremento precisa de teste e critério de aceite.

## Próximo marco
**DUTRA-CORE-01 — Command Core Foundation**: contratos de agentes, catálogo de integrações, fila de aprovação, observabilidade e roadmap executável.
