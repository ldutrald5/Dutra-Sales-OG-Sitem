# V1-02 — Proposta persistente integrada

## Objetivo

Transformar o resultado da aplicação técnica em um rascunho comercial real, vinculado à conta e persistido pela infraestrutura local-first do DUTRA OS.

## Entrega

- O handoff técnico abre um editor nativo dentro da V3.
- Quantidade, preço, parcelas, frete e entrega permanecem editáveis.
- Itens podem ser removidos antes do salvamento.
- O rascunho recebe `proposalStatus: DRAFT`, versão, criação, atualização, total e itens.
- Nova edição do mesmo rascunho atualiza a versão sem duplicar a proposta.
- O salvamento usa `DUTRA_CORE.commit`, mutation tipada e chave de idempotência.
- Preparar ou salvar não registra `proposal.sent`.
- O editor legado permanece disponível como contingência explícita durante a migração.

## Segurança

- A proposta exige cliente e ao menos um item.
- Nenhuma aplicação técnica é recalculada ou inventada neste módulo.
- Publicação e envio continuam ações separadas e confirmadas pelo usuário.
- Produção e dados reais não são alterados por testes.

## Evidência

- `scripts/test_v1_proposal_integration.mjs`
- `scripts/test_proposal_intelligence.mjs`
- `scripts/test_proposal_public_runtime.mjs`
- suíte de testes de `preview-v2`

## Limites

- PDF final, transições completas de estado e conversão em pedido permanecem em etapas posteriores.
- Smoke autenticado no preview isolado depende de capacidade adicional na Railway.
