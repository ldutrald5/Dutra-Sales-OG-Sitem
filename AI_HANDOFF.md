# DUTRA OS — AI Handoff

Este arquivo existe para que qualquer nova IA, agente ou desenvolvedor consiga continuar o projeto sem reconstruir sua história a partir de chats.

## Boot obrigatório

Antes de alterar o DUTRA OS:

1. Leia `DUTRA_OS_CONTEXT.md`.
2. Leia este `AI_HANDOFF.md`.
3. Leia `ROADMAP.md` e `CHANGELOG.md`.
4. Leia `AGENTS.md` e somente a documentação ligada ao escopo.
5. Inspecione o código real antes de propor refatoração ou criar módulo paralelo.

## Contrato de trabalho

- Preserve funcionalidades existentes e dados persistidos.
- Não invente dados de CRM, resultado de contato, envio, venda ou valor financeiro.
- Não invente aplicação/código técnico Olho de Gato. Ausência de confirmação = `Necessária validação técnica`.
- Separe **FATO**, **REGRA** e **SUGESTÃO** em recursos de inteligência.
- Não mude estágio comercial silenciosamente. Cotação salva não é proposta enviada; WhatsApp aberto não é mensagem enviada.
- Reutilize o mesmo lead/conta em Prospecção, CRM, Mesa, Agenda, Pipeline, Cotação e Call AI.
- Prefira evolução incremental ao redesenho completo.
- Não altere Railway, volume, variáveis, autenticação ou servidor sem necessidade clara e validação do impacto.
- Não declare testes como aprovados se não foram executados com sucesso.

## Antes de codificar

Descubra primeiro:

- qual entidade/estado existente representa o dado;
- quais serviços já fazem persistência;
- quais eventos operacionais já existem;
- qual vocabulário de status o CRM usa;
- quais testes existentes cobrem o fluxo;
- se a mudança pode afetar dados locais ou produção.

Se houver uma estrutura existente adequada, estenda-a. Não crie uma segunda fonte de verdade.

## Definition of Done

Uma alteração relevante só pode ser entregue quando:

1. O código solicitado está implementado.
2. Os testes/checks relevantes disponíveis foram executados e o resultado real foi registrado.
3. `CHANGELOG.md` foi atualizado.
4. `ROADMAP.md` foi atualizado quando o estado do produto mudou.
5. `DUTRA_OS_CONTEXT.md` foi atualizado se surgiu decisão durável, módulo, regra ou arquitetura nova.
6. `AI_HANDOFF.md` foi atualizado se mudou o protocolo de trabalho.
7. O ZIP/release contém esses documentos.
8. Se houve deploy, confirmar o status e domínio reais; não assumir que GitHub, ZIP e Railway estão sincronizados.

## Regra de sincronização

Existem quatro superfícies que podem divergir:

**working tree → ZIP/release → GitHub → produção Railway**.

Nunca diga que “está tudo salvo/sincronizado” sem verificar cada superfície relevante. O GitHub deve ser a fonte oficial de código compartilhável; o ZIP deve representar uma release identificável; Railway deve publicar um commit conhecido.

## Ao encerrar uma sessão

Registre no mínimo:

- versão/estado atual;
- arquivos alterados;
- validações executadas;
- pendências e riscos;
- próximo passo recomendado;
- situação de sincronização GitHub/produção.

Isso permite continuidade por ChatGPT, Codex, Claude, Gemini, outro agente ou desenvolvedor humano.
