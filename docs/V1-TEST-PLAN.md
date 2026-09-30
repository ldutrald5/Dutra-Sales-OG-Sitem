# Plano de testes V1

## Gates por alteração

1. Sintaxe e contratos do módulo tocado.
2. Teste de regra de negócio.
3. Paridade entre fonte canônica e espelho de deploy.
4. Suíte `npm run validate`.
5. `npm run release:gate`.
6. Smoke test no preview Railway antes de qualquer promoção.

## Motor de Cotação

- Rodotrem conhecido gera quantidades consolidadas esperadas.
- Cubo com redução seleciona somente regra cadastrada.
- Combinação ambígua permanece pendente.
- Busca entende termos normalizados sem inventar veículo.
- Quantidade e preço podem ser editados.
- Item livre autorizado entra no total.
- Espelhos V3 são idênticos às fontes canônicas.

## Persistência

- Falha remota mantém a ação local.
- Retry é idempotente.
- Confirmação antiga não limpa mutation nova.
- Offline, erro de servidor e sincronização têm estados diferentes.
- Backup/restore usa fixture sintética e reconcilia IDs e contagens.

## Aceitação visual

- Desktop e celular.
- Loading, empty, ready, error e offline.
- Nenhum `alert()` ou `prompt()` em fluxo novo.
- Aplicação ambígua mostra validação antes da proposta.
- Carrinho técnico abre editor nativo com itens e preços editáveis.
- Salvar rascunho persiste `DRAFT`, incrementa versão e não registra envio.
- Produção permanece sem mudança durante a fase V1.
