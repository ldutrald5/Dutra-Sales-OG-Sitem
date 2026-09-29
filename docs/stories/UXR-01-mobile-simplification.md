# UXR-01 — Mobile simplification + safe spreadsheet import

Status: **incorporado à main; fluxo móvel simplificado em produção. QA físico final em aparelho real permanece no gate da 1.0.**

## Problema observado

Gravação de uso real no celular mostrou excesso de opções simultâneas, densidade alta, navegação ocupando duas linhas e importação de planilha expondo dezenas de campos técnicos. O fluxo de mapeamento também aceitava correspondências parciais permissivas demais.

## Regra de UX

> O complexo existe por trás. O simples aparece para o vendedor.

No celular, cada tela deve favorecer uma tarefa principal. Ferramentas secundárias continuam acessíveis sem disputar atenção com o fluxo diário.

## Entregas

- navegação móvel reduzida a quatro entradas visíveis: Meu Dia, Clientes, Call AI e Mais;
- ferramentas secundárias movidas para uma folha “Mais ferramentas”;
- Meu Dia reduz densidade no celular: remove bloco de marketing/produto, rotina horária e textos redundantes;
- CRM móvel prioriza busca, novo cliente e importação;
- exportação, ferramentas legadas e filtros menos frequentes deixam de disputar espaço no mobile;
- importador mostra primeiro apenas os campos reconhecidos;
- mapeamento completo fica escondido em “Ajustar campos”;
- correspondências automáticas passam a aceitar somente aliases exatos confiáveis;
- colunas ambíguas continuam disponíveis para escolha manual no modo avançado;
- PWA cache atualizado para v52.

## Guardrail de mapeamento

Não pré-selecionar por substring.

Exemplos que não podem acontecer automaticamente:

- “Usuário responsável” → Contato;
- “Data de início” → Data de retorno;
- “Título do negócio” → Empresa.

Campos explicitamente conhecidos como “Telefone principal”, “E-mail” e “Cidade / UF” continuam reconhecidos.

## Segurança de dados

Esta story não altera schema, persistência, regras de merge, decisões de criação/atualização, histórico nem volume hospedado. A confirmação explícita da importação continua obrigatória.

## Aceite

1. Barra móvel ocupa uma linha.
2. “Mais” abre ferramentas secundárias sem navegar sozinho.
3. Importação não exibe todos os selects por padrão.
4. Campos exatos conhecidos continuam auto-mapeados.
5. Correspondências parciais ambíguas não são auto-selecionadas.
6. Mapeamento avançado continua disponível.
7. `og:spreadsheet:test` e CI passam antes de merge.
8. Validar visualmente em celular antes de produção.


## Preview isolado

Foi criado um ambiente temporário separado da produção, sem volume e sem seed de dados reais. Ele existe apenas para validação visual/mobile desta story e deve ser removido após aprovação ou descarte.
