# OG-12 — Fundação: migração aditiva e validação de dados

## Status

In Progress — envelope, validação, dry-run e idempotência entregues; backup e deduplicação pendentes

## História

**Como** usuário com clientes e históricos já registrados,  
**quero** que o sistema atualize seus dados de forma aditiva, verificável e reversível,  
**para que** a nova estrutura seja adotada sem perder, duplicar ou corromper informações existentes.

## Resultado esperado

Implementar a camada de compatibilidade e os scripts auditáveis da Fase 1. A migração deve preservar a experiência local-first, reconhecer versões antigas e produzir relatório antes de gravar qualquer transformação.

## Requisitos rastreáveis

| ID | Requisito | Origem |
|---|---|---|
| FR-F1-07 | Detectar a versão atual dos dados e aplicar somente passos de migração ainda não executados. | Missão §§19, 21 |
| FR-F1-08 | Disponibilizar modo de simulação com relatório de inclusões, conversões, conflitos e rejeições. | Missão §21 |
| FR-F1-09 | Validar registros contra o contrato aprovado em OG-11. | Missão §§19, 21 |
| FR-F1-10 | Detectar possíveis duplicidades por telefone, CNPJ e combinação empresa/cidade sem mesclar automaticamente casos ambíguos. | Mapa de produto §2; Missão §21 |
| FR-F1-11 | Preservar histórico e referências entre cliente, interações, cotações e chamadas. | Missão §§3, 8 |
| FR-F1-12 | Criar fixtures sintéticas e testes de idempotência, atualização e rollback/backup. | Missão §§21, 22 |
| NFR-F1-04 | Nenhum dado real pode aparecer em testes, logs versionados ou screenshots públicas. | Missão §20 |
| NFR-F1-05 | Uma segunda execução da mesma migração não altera novamente registros já migrados. | Missão §21; requisito de migração aditiva |
| CON-F1-03 | Nunca apagar ou reinicializar `localStorage` como estratégia de migração. | `PROJECT-CONTEXT.md` §11 |
| CON-F1-04 | Antes de uma transformação persistente deve existir backup recuperável ou exportação equivalente. | Missão §11 e §21 |

## Escopo

### Incluído

- Registro de versão do esquema.
- Adaptadores de leitura para o formato legado.
- Migrações incrementais e idempotentes.
- Modo de simulação.
- Validador do modelo.
- Detector de duplicidade com relatório.
- Backup e restauração controlada para testes.
- Fixtures sintéticas sem informações comerciais reais.
- Logs locais resumidos, sem conteúdo sensível desnecessário.

### Fora do escopo

- Mescla automática de duplicidades ambíguas.
- Importação da planilha oficial, ainda não fornecida.
- Sincronização multiusuário.
- Limpeza de registros “antigos”.
- Alteração da interface além de feedback indispensável de migração/erro.

## Critérios de aceite

- [x] O sistema reconhece a versão do esquema sem impedir a leitura do formato atual.
- [x] Existe comando ou script documentado de simulação que não grava alterações.
- [ ] A simulação informa totais, ações previstas, conflitos e registros rejeitados sem expor conteúdo sensível.
- [ ] Antes da execução real, uma cópia recuperável é criada e sua restauração é testada com fixture.
- [x] Cada passo de migração implementado é aditivo, identificável e executado uma única vez.
- [x] Executar a migração duas vezes produz o mesmo resultado lógico e não duplica eventos ou filhos.
- [ ] Clientes mantêm histórico, próxima ação, observações, cotações e sessões vinculadas.
- [ ] Possíveis duplicidades são sinalizadas; o sistema não mescla silenciosamente clientes diferentes.
- [ ] Registros inválidos permanecem recuperáveis e aparecem em relatório para correção.
- [x] Nenhum teste limpa o armazenamento real do usuário.
- [x] Fixtures e logs versionados não contêm nomes, telefones, CNPJs, gravações ou documentos reais.
- [ ] Falha durante a migração não deixa o conjunto de dados parcialmente promovido.

## Tarefas e subtarefas

- [ ] **1. Congelar o contrato de entrada**
  - [ ] Receber a versão aprovada de OG-11.
  - [ ] Mapear formatos legados encontrados.
  - [ ] Definir versão inicial e sequência de passos.
- [ ] **2. Criar validação e simulação**
  - [ ] Validar estrutura e relacionamentos.
  - [ ] Produzir relatório resumido.
  - [ ] Identificar dados não reconhecidos sem descartá-los.
- [ ] **3. Criar backup e recuperação**
  - [ ] Gerar backup antes de escrita.
  - [ ] Testar restauração com fixtures.
  - [ ] Documentar procedimento de recuperação.
- [ ] **4. Implementar migração idempotente**
  - [ ] Converter somente o necessário.
  - [ ] Preservar IDs sempre que seguro.
  - [ ] Registrar versão aplicada.
- [ ] **5. Verificar duplicidade**
  - [ ] Normalizar telefone e CNPJ para comparação.
  - [ ] Comparar empresa/cidade de forma tolerante a acentos.
  - [ ] Emitir candidatos para revisão humana.
- [ ] **6. Automatizar testes**
  - [ ] Caminho feliz.
  - [ ] Segunda execução.
  - [ ] Dado incompleto.
  - [ ] Conflito de ID.
  - [ ] Falha e recuperação.
  - [ ] Preservação de vínculos.

## Dependências

- OG-11 aprovada por `@architect`.
- Inventário das versões atualmente persistidas.
- Fixtures sintéticas aprovadas para testes.

## Validação prevista

- Executar testes de migração em cópia sintética.
- Comparar contagens e referências antes/depois.
- Confirmar idempotência por hash ou comparação estrutural normalizada.
- Executar `npm run og:check`, testes específicos de migração e gates disponíveis.

## File List

Lista prevista; atualizar com os arquivos realmente modificados:

- `docs/stories/OG-12-migracao-aditiva-validacao-dados.md`
- `apps/sistema-og/operations-model.js`
- `scripts/og-operations.mjs`
- `scripts/test_operations_foundation.mjs`
- `apps/sistema-og/app.js`
- `apps/sistema-og/server.mjs`
- `apps/sistema-og/README.md`

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 0.1 | Story criada a partir da Fase 1 da missão operacional | @po/@sm |
| 2026-09-23 | 0.2 | Primeiro incremento funcional: envelope v1, CLI, validação e testes idempotentes | Codex |
