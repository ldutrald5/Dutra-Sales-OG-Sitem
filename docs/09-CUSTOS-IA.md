# Estratégia de custos de IA

## Níveis

### Nível 0 — sem IA

Templates, filtros, CRM, cálculos, tarefas, links, WhatsApp, formulários, validações e automações determinísticas. É o padrão para operações repetíveis.

### Nível 1 — IA econômica

Resumo incremental, extração de campos, classificação, preenchimento revisável e personalização curta. Usa modelo econômico, saída estruturada e limite pequeno de contexto.

### Nível 2 — IA avançada

Estratégia comercial, análise profunda da conta, negociação, objeções complexas e Proposta Premium. Executada sob solicitação explícita e com benefício claro.

## Contexto eficiente

Separar:

- **Contexto fixo OG:** regras, linguagem, produtos confirmados e guardrails, versionados e cacheáveis.
- **Contexto variável do cliente:** identificação, estágio, fatos recentes, objetivo, lacunas e próximos passos.

Cada requisição recebe somente os campos necessários, eventos novos desde o último resumo e poucos trechos recuperados por relevância. Screenshots contínuos, histórico integral e base completa não são enviados.

## Estratégia técnica

- Normalizar e filtrar dados localmente.
- Manter resumo compacto por conta, com versão e fontes.
- Atualizar resumo por delta após evento confirmado.
- Usar cache por versão do contexto fixo.
- Definir limites de caracteres/tokens por caso de uso.
- Solicitar saídas JSON quando o sistema precisar gravar campos.
- Registrar modelo, finalidade, volume estimado, duração, sucesso e revisão humana, sem expor conteúdo sensível em logs.

## Regra de decisão

Antes de chamar IA, perguntar: uma regra, filtro, cálculo, template ou busca local entrega o mesmo resultado? Se sim, usar Nível 0. Nível 2 nunca deve executar tarefa determinística.

## Indicadores futuros

Custo por sessão, custo por conta, chamadas por nível, taxa de reaproveitamento de cache, taxa de aceitação das sugestões e custo por avanço confirmado no funil.
