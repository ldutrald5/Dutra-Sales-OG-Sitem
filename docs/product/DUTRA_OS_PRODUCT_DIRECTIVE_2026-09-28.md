# DUTRA OS — Diretriz de Produto, Design, Automação e Engenharia

Data de consolidação: 2026-09-28.

## Objetivo

Evoluir o DUTRA OS, sem recomeço e sem migração big bang, para um **Sales Operating System vertical da Olho de Gato** que reduza esforço administrativo e aumente a qualidade da execução comercial no fluxo:

**PROSPECÇÃO → CLIENTE → CONVERSA → DIAGNÓSTICO → COTAÇÃO → PROPOSTA → FOLLOW-UP → VENDA → INSTALAÇÃO → PÓS-VENDA → RECOMPRA → INDICAÇÃO.**

A pergunta de produto que governa o roadmap é:

> Isso ajuda o vendedor a vender mais, vender melhor, perder menos oportunidades ou gastar menos tempo administrando informação?

Tecnologia sem retorno operacional fica fora do caminho crítico.

## Regras inegociáveis

1. GitHub `main` é a fonte canônica do código.
2. A evolução é incremental, reversível e compatível com o legado.
3. Não criar segunda fonte de verdade para cliente, oportunidade, tarefa, atividade ou score.
4. Não alterar dados históricos silenciosamente.
5. IA sugere; fatos comerciais importantes são gravados por contratos controlados e confirmação explícita.
6. Não trocar a stack por moda ou por referência externa.
7. Não fazer rewrite React/Laravel/Twenty apenas para consumir componentes.
8. Não adicionar dependência sem justificativa de produto, segurança e manutenção.
9. Não sacrificar velocidade por motion ou decoração.
10. Segurança, backup, rollback e gates fazem parte da feature, não são acabamento posterior.
11. Toda mudança estrutural atualiza memória técnica, testes e rollback.
12. Mobile deve priorizar as ações recorrentes com o mínimo de toques.

## Referências e como utilizá-las

### Shadcn UI
**ADAPTAR.** Usar os padrões de composição de cards, sheets, dialogs, command palette, tabs, tables, badges, skeletons, toasts, filtros e tooltips dentro do design system atual. Não migrar o frontend para React apenas por isso.

### Twenty CRM
**ADAPTAR.** Referência para organização de entidades, relacionamentos, timeline, pesquisa global, criação rápida, views, filtros, tarefas, pipeline e histórico da conta. Não instalar/copiar Twenty.

### Aceternity UI / 21st.dev / motion
**ADAPTAR COM MODERAÇÃO.** Inspiração para Call AI, onboarding, estados vazios, loaders, momentos de sucesso e futuras propostas. Motion deve explicar estado e resposta da interface, nunca competir com o trabalho comercial.

### Phosphor Icons
**ADOTAR PROGRESSIVAMENTE.** Uma família única de iconografia reduz ruído visual. Migração deve ocorrer por módulo tocado, não em big bang.

### SkillUI
**USAR COMO FERRAMENTA DE DESENVOLVIMENTO QUANDO ÚTIL.** Prioridade inicial: auditar inconsistências do próprio DUTRA OS antes de estudar interfaces externas. Não clonar propriedade visual de terceiros.

### Context7 / documentação atual
**ADOTAR NO FLUXO DE DESENVOLVIMENTO QUANDO DISPONÍVEL.** Bibliotecas e integrações devem ser implementadas com documentação da versão atual, evitando APIs depreciadas.

## Capacidades estratégicas

### Account 360
A ficha do cliente é o centro de comando da conta. Deve responder rapidamente: quem é, quanto vale, onde estamos, o que aconteceu, o que fazer agora, o que vender e quais materiais existem.

### Mission Control
O sistema deve apontar a próxima conta e explicar a prioridade. Já existe uma primeira versão e deve continuar usando o score determinístico canônico.

### Signal Center
Sinais são derivados de fatos e sempre terminam em ação. Não criar um feed de notificações sem utilidade operacional.

### Knowledge Command Center
Sales Brain, Biblioteca e conhecimento técnico/comercial devem aparecer no contexto da conta e também na busca global.

### Proposal Intelligence
A evolução alvo é: cotação → proposta versionada → link público seguro → eventos de abertura/clique → Signal Center → follow-up. Proposal Room vem depois da comprovação de valor do tracking.

### Automation Engine
Começar com poucas regras de grande retorno. Automações podem criar tarefas, sinais e sugestões; não podem inventar contato, visualização, envio ou venda.

### Territory Intelligence
Mapa é inteligência de prospecção: leads, clientes, rotas, concentração, representantes e oportunidades próximas. Implementar somente após qualidade geográfica suficiente.

### ERP vertical leve
Instalação, ativos, reposição, QR e documentação podem surgir quando completarem o ciclo comercial OG. Não construir ERP horizontal genérico.

## Ordem de evolução

1. Consolidar baseline, documentação e contratos existentes.
2. Refinar Account 360 e Command Center.
3. Unificar Knowledge Command Center.
4. Implementar Proposal Tracking seguro.
5. Implementar Automation Engine V1.
6. Implementar Territory Intelligence.
7. Consolidar multiusuário/Auth/banco remoto conforme validação real.
8. Expandir instalação, ativos, reposição e QR somente com demanda comprovada.

## Regra de performance

Preferir CSS, componentes pequenos, lazy loading, carregamento progressivo e `prefers-reduced-motion`. Bibliotecas pesadas e módulos raros devem sair do caminho crítico.

## Regra de segurança

Código funcionando não significa código seguro. Releases relevantes exigem autenticação/autorização adequadas, validação de input, rate limiting quando aplicável, headers, secrets fora do cliente/Git, auditoria de dependências, backup, restore, conflito, sessões e trilha de auditoria.
