# CRM

## Funcionamento atual

O CRM usa `state.leads` como cadastro mestre operacional. Cada lead mantém dados da empresa, contato, Código OG (`internalCode`), telefones, segmento, frota, estágio, prioridade, dor, decisor, follow-up, próxima ação, indicações e uma lista de interações. Meu Dia, Call AI, cotação e histórico reutilizam esses registros.

Entradas existentes incluem cadastro manual/rápido, importadores, OCR revisável e atualizações feitas em fluxos do Call AI. A sincronização preserva uma cópia local e um espelho compartilhado quando disponível.

## Regras de produto

- Conta/empresa é a raiz; contatos pertencem à conta.
- Cadastro rápido exige somente Empresa e Telefone; Nome do contato é opcional.
- Campo desconhecido permanece vazio, nunca inventado.
- Alterações sugeridas por IA precisam de revisão antes de gravar.
- Abrir WhatsApp ou preparar cotação não altera o estágio sozinho.
- Toda interação relevante deve produzir histórico e, quando aplicável, próxima ação.\n- **Código OG é código de cadastro no sistema da empresa, não prova de compra.** Um prospect pode ter Código OG e continuar em estágio comercial aberto.\n- O DUTRA OS não inventa Código OG. Quando o cadastro externo gerar um código, o vendedor registra esse valor na ficha.\n- Código OG deve ser único na base operacional e pesquisável em CRM, Meu Dia e Call AI.

## Lacunas atuais

- Contato e oportunidade ainda não são entidades independentes.
- Deduplicação por telefone/CNPJ/empresa e cidade não está consolidada.
- Não há proprietário da conta nem permissão real por vendedor.
- Atividades e tarefas não possuem ciclo completo separado.
- Campos livres e datas legadas variam entre origens.
- A ficha lateral cobre consulta e edição sem abandonar Meu Dia ou a lista do CRM; fluxos especializados (cotação, Call AI e Biblioteca) continuam como superfícies próprias, abertas mantendo a conta ativa.

## Direção

A Mesa de Vendas usa o CRM como base sem exigir cadastro completo. O painel lateral carrega e edita dados principais, Código OG, múltiplos telefones, indicações, contexto comercial, histórico, Company 360 e materiais sem criar uma segunda cópia. Enriquecimento pode acontecer depois, por usuário, importação ou IA econômica revisável.

Nunca migrar o cadastro mestre sem backup, dry-run, validação de referências e compatibilidade com as chaves atuais.
