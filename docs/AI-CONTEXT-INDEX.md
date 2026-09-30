# AI Context Index — DUTRA OS / Sistema OG

Este é o roteador de contexto para humanos e agentes. O objetivo é obter inteligência alta com contexto pequeno e correto, evitando carregar o repositório inteiro.

## Ordem mínima de leitura
1. `AGENTS.md`
2. `DUTRA_OS_CONTEXT.md`
3. `AI_HANDOFF.md`
4. este índice
5. apenas os documentos do escopo

## Roteamento
| Trabalho | Contexto primário |
|---|---|
| Visão/prioridade | `docs/00-VISAO-SISTEMA.md`, `docs/10-ROADMAP.md` |
| Arquitetura/integrações | `docs/01-ARQUITETURA.md` |
| Dados/persistência | `docs/02-BANCO-DE-DADOS.md` |
| UI/UX | `docs/03-DESIGN-SYSTEM.md` |
| CRM/contas | `docs/04-CRM.md` |
| Mesa de Vendas | `docs/05-MESA-DE-VENDAS.md` |
| Call AI/inteligência | `docs/06-CALL-AI.md` + conhecimento estritamente necessário |
| Comunicação | `docs/07-CENTRAL-COMUNICACAO.md`, `docs/08-TEMPLATES-COMERCIAIS.md` |
| Custos de IA | `docs/09-CUSTOS-IA.md` |
| Excel/import/export | `docs/11-INTEGRACAO-EXCEL.md` |
| Proteção/sync/backup | `docs/12-PROTECAO-E-SINCRONIZACAO.md` |
| Produção/runtime | `.codex/skills/dutra-runtime-operator/SKILL.md`, `docs/runtime/DUTRA_OS_RUNTIME.md` |
| Execução | `tasks/TODO.md`, story específica |
| Conhecimento OG | `apps/sistema-og/knowledge/` — somente arquivo pertinente |

## Modelo mental do produto
A conta é a raiz operacional. Contatos, interações, oportunidades, atividades, ligações, mensagens, propostas, pesquisas, follow-ups e inteligência devem convergir para a mesma identidade; hoje `lead.id` é a identidade operacional.

O vendedor deve conseguir chegar rapidamente a:
**Quem contatar? → Por quê? → O que perguntar? → Qual próxima ação? → Quando retornar?**

## Contrato epistemológico
Toda inteligência deve distinguir:
- **FATO:** confirmado por dado, usuário, código ou fonte.
- **HIPÓTESE:** inferência útil ainda não confirmada.
- **SUGESTÃO:** ação recomendada.
- **PENDENTE:** informação necessária ausente.

IA nunca converte hipótese em fato automaticamente.

## Contrato de vendas
O foco não é apenas armazenar leads. O sistema deve ajudar a chegar ao decisor e transformar prospecção em conversa/reunião. Para oportunidades consultivas e de maior valor, preserve contexto de reunião: objetivo, participantes/cargos, dores confirmadas, frota/operação, perguntas diagnósticas, objeções, compromisso obtido e próxima ação.

Atendente, usuário técnico, gestor e proprietário/decisor são papéis distintos. O sistema pode sugerir estratégia de abordagem por papel, mas não deve inventar quem ocupa cada papel.

## Contexto de IA por conta
Envie somente o necessário: empresa, segmento, contato/cargo, estágio, objetivo, resumo recente, dores confirmadas, objeções, proposta/valores registrados, próxima ação/prazo e trechos rastreáveis da base OG. Evite telefone/CNPJ quando irrelevantes. Nunca envie o banco completo por padrão.

## Regra anti-duplicação
Antes de criar módulo, tabela, estado, prompt, documento ou serviço novo, procure equivalente existente. Estenda a fonte canônica. Não crie “CRM 2”, “Call AI 2” ou cadastro paralelo.

## Mudanças de arquitetura
Uma conversa ou ideia não altera automaticamente a arquitetura. Tecnologias futuras (incluindo bancos gerenciados) só entram após decisão registrada, migração, compatibilidade, segurança, testes e rollback.
