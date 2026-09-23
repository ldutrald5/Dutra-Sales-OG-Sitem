# OG-11 — Fundação: arquitetura e modelo de dados canônico

## Status

Ready for Review — contrato-alvo documentado e recorte transitório implementado

## Vínculo e resultado esperado

Story de fundação derivada da missão **Evolução Operacional Completa do Sistema OG 2026**. Complementa a visão registrada em `OG-10-evolucao-operacional-2026.md` sem reabrir a Entrega 1 já concluída.

Ao final, o Sistema OG terá um contrato de dados versionado e documentado para sustentar Biblioteca Comercial, CRM, Call AI, Performance, documentos, comissões, transportadoras e usuários. Esta story define a fundação; não entrega ainda as telas das fases 2–9.

## História

**Como** responsável pelo Sistema OG,  
**quero** um modelo de dados único, rastreável e compatível com os registros atuais,  
**para que** cada módulo use o mesmo cliente e futuras evoluções não criem bancos paralelos nem percam histórico.

## Requisitos rastreáveis

| ID | Requisito | Origem |
|---|---|---|
| FR-F1-01 | Definir `Client` como registro canônico reutilizado por todos os módulos. | Missão §§3, 19 e critério geral “cliente existir uma única vez” |
| FR-F1-02 | Definir contratos para `Contact`, `Interaction`, `CallSession`, `Material`, `MaterialShare`, `MaterialPackage`, `Quote`, `QuoteTemplate`, `MessageTemplate`, `DocumentTemplate`, `GeneratedDocument`, `Sale`, `Commission`, `Partner`, `Transporter`, `TransporterCoverage`, `User`, `Goal` e `ActivityEvent`. | Missão §19 |
| FR-F1-03 | Especificar IDs, relacionamentos, obrigatoriedade, versionamento, datas, origem e confirmação dos dados. | Missão §19 |
| FR-F1-04 | Separar fato confirmado, hipótese e informação ainda não validada. | Missão §§4, 14, 16 e decisões do mapa de produto |
| FR-F1-05 | Representar atividade, oportunidade, venda, faturamento e comissão como conceitos distintos. | Missão §§7 e 12 |
| FR-F1-06 | Documentar eventos mínimos necessários aos indicadores sem calcular métricas nesta story. | Missão §7.2 e Fase 4 |
| NFR-F1-01 | Preservar funcionamento local-first e PWA. | Missão §3; `PROJECT-CONTEXT.md` |
| NFR-F1-02 | Manter dados reais, gravações, planilhas privadas, segredos e `.data` fora do Git. | Missão §20 |
| NFR-F1-03 | Não definir tecnologia de backend, autenticação ou armazenamento sem validação arquitetural. | Constitution, Art. IV; Missão §13 |
| CON-F1-01 | Migrações futuras serão aditivas e não poderão limpar `localStorage`. | Missão §§3, 21; `PROJECT-CONTEXT.md` §11 |
| CON-F1-02 | Regra técnica de peças não validada permanece bloqueada e marcada como pendente. | Missão §16 |

## Escopo

### Incluído

- Diagnóstico documentado da arquitetura atual e das fontes de dados existentes.
- Diagrama lógico das entidades e seus relacionamentos.
- Dicionário de dados com campos obrigatórios, opcionais, status e fontes.
- Convenções para IDs, datas, versões e referências entre registros.
- Contrato de `ActivityEvent` para permitir analytics posteriores.
- Matriz módulo → entidade → permissão de leitura/escrita.
- Limites entre dados comerciais, técnicos, financeiros e conteúdo de mídia.
- Decisões e dúvidas que exigem validação do arquiteto ou material oficial.

### Fora do escopo

- Construção de dashboards, galerias, mapas, PDFs ou autenticação.
- Pesquisa de dados de transportadoras.
- Criação dos dez textos ou dez PDFs definitivos.
- Regras de comissão ainda não fornecidas.
- Associação de suportes, mangueiras ou códigos sem a folha oficial.
- Migração efetiva de dados, tratada em `OG-12`.

## Critérios de aceite

- [x] Existe um documento de arquitetura que descreve as fontes atuais, fluxo local-first e fronteiras dos módulos.
- [x] `Client` possui um identificador estável e é a única raiz de cliente proposta.
- [x] Todas as 20 entidades exigidas em FR-F1-02 estão no dicionário de dados.
- [ ] Cada entidade informa campos, tipos lógicos, obrigatoriedade, relacionamentos, origem, estado de confirmação e estratégia de versão.
- [x] `Interaction`, `CallSession` e `ActivityEvent` têm responsabilidades distintas e exemplos de eventos sem dados reais.
- [x] `Quote`, `Sale`, `Commission` e `GeneratedDocument` têm vínculos explícitos e não compartilham status ambíguos.
- [x] A modelagem suporta múltiplos contatos por cliente e múltiplos materiais/documentos por negociação.
- [ ] Informação pesquisada ou importada guarda fonte e data de verificação quando isso for exigido pela missão.
- [x] Material interno e material autorizado para cliente são distinguíveis no contrato.
- [x] Aplicação técnica sem fonte oficial possui estado bloqueado; nenhum código de peça é inventado.
- [x] A matriz de escrita identifica qual módulo pode criar ou alterar cada entidade.
- [x] As decisões não confirmadas estão registradas como questões abertas, e não como fatos.
- [x] A documentação referencia os IDs de requisito desta story.

## Tarefas e subtarefas

- [x] **1. Diagnosticar a arquitetura atual**
  - [x] Inventariar dados em `data.js`, `app.js`, servidor, armazenamento local e sincronização opcional.
  - [x] Identificar chaves, IDs e estruturas já persistidas.
  - [x] Registrar riscos de duplicação e compatibilidade.
- [x] **2. Desenhar o modelo canônico**
  - [x] Definir entidades e relacionamentos.
  - [x] Definir campos comuns de auditoria, versão, origem e confirmação.
  - [x] Definir separação entre registros comerciais, técnicos e financeiros.
- [x] **3. Definir o contrato de eventos**
  - [x] Listar eventos necessários para atividade, funil, envio de material, cotação, venda e comissão.
  - [x] Determinar campos mínimos e vínculo com cliente/usuário.
  - [x] Proibir inferência de contato ou avanço apenas por abertura do WhatsApp.
- [x] **4. Produzir matriz de propriedade**
  - [x] Mapear leitura e escrita por Meu Dia, CRM, Call AI, Cotação, Biblioteca e Performance.
  - [x] Registrar permissões futuras sem simular autenticação existente.
- [x] **5. Revisar rastreabilidade**
  - [x] Ligar decisões a FR/NFR/CON.
  - [x] Marcar dependências de material oficial.
  - [ ] Solicitar revisão de `@architect` antes da implementação de persistência.

## Dependências

- `OG-10-evolucao-operacional-2026.md` como épico de produto.
- `docs/architecture/sistema-og-product-map.md`.
- Inspeção das estruturas persistidas atuais.
- Revisão de arquitetura antes de congelar o contrato.

## Bloqueios e entradas pendentes

Não bloqueiam a modelagem estrutural, mas impedem regras finais:

- PDF e planilha oficiais.
- Regra de comissão.
- Folha técnica de aplicações.
- Usuários, papéis e metas reais.

## Validação prevista

- Revisão cruzada: toda entidade exigida deve aparecer no dicionário e no diagrama.
- Auditoria de rastreabilidade: nenhuma decisão sem FR/NFR/CON ou fonte verificada.
- Inspeção de compatibilidade com registros existentes, sem usar dados reais em fixtures versionadas.
- Quality gates disponíveis em `AGENTS.md`, quando aplicáveis a documentação.

## File List

Lista prevista; o implementador deve confirmar os arquivos realmente modificados antes de revisão:

- `docs/stories/OG-11-fundacao-arquitetura-modelo-dados.md`
- `docs/architecture/og-operations-foundation.md`
- `apps/sistema-og/operations-model.js`

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 0.1 | Story criada a partir da missão operacional 2026 | @po/@sm |
| 2026-09-23 | 0.2 | Contrato-alvo, diagnóstico e recorte transitório concluídos para revisão | Codex |
