# CRM

## Funcionamento atual

O CRM usa `state.leads` como cadastro mestre. Cada lead mantém dados da empresa, contato, segmento, frota, estágio, prioridade, dor, decisor, follow-up, próxima ação e uma lista de interações. Meu Dia, Call AI, cotação e histórico reutilizam esses registros.

Entradas existentes incluem cadastro manual/rápido, importadores, OCR revisável e atualizações feitas em fluxos do Call AI. A sincronização preserva uma cópia local e um espelho compartilhado quando disponível.

## Regras de produto

- Conta/empresa é a raiz; contatos pertencem à conta.
- Cadastro rápido exige somente Empresa e Telefone; Nome do contato é opcional.
- Campo desconhecido permanece vazio, nunca inventado.
- Alterações sugeridas por IA precisam de revisão antes de gravar.
- Abrir WhatsApp ou preparar cotação não altera o estágio sozinho.
- Toda interação relevante deve produzir histórico e, quando aplicável, próxima ação.

## Lacunas atuais

- Contato e oportunidade ainda não são entidades independentes.
- Deduplicação por telefone/CNPJ/empresa e cidade não está consolidada.
- Não há proprietário da conta nem permissão real por vendedor.
- Atividades e tarefas não possuem ciclo completo separado.
- Campos livres e datas legadas variam entre origens.
- A experiência do CRM ainda exige troca de abas para algumas ações frequentes.

## Direção

A Mesa de Vendas usará o CRM como base sem exigir cadastro completo. O painel lateral carregará resumo, contatos, histórico, dor, objeções, oportunidade e próxima ação. Enriquecimento poderá acontecer depois, por usuário, importação ou IA econômica revisável.

Nunca migrar o cadastro mestre sem backup, dry-run, validação de referências e compatibilidade com as chaves atuais.
