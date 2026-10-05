# DUTRA OS — Plano Mestre de Reintegração V3 + Sistema OG Legado

## Objetivo

Transformar o DUTRA OS V3 na **única interface operacional** do vendedor, reaproveitando o máximo possível do sistema OG legado como motor de domínio enquanto os módulos são migrados gradualmente para componentes V3.

A regra é simples:

> **não abrir um sistema para trabalhar e outro para concluir.**

A interface nova vira o shell principal. O legado deixa de ser “outro sistema” e passa a ser uma fonte temporária de motores, regras, dados e rotinas até que cada módulo seja extraído.

---

## Princípios obrigatórios

1. **Uma única conta de cliente.**
   Listas, CRM, propostas, reuniões, pedidos e pós-venda apontam para a mesma empresa.

2. **Uma única regra técnica.**
   Suportes, equalizadores, mangueiras, eixos e quantidades não podem ser calculados por dois motores diferentes.

3. **Uma única navegação.**
   O usuário não deve ser jogado para outra aplicação ou outra aba para terminar uma tarefa.

4. **Automação não remove edição manual.**
   Todo cálculo pode ser ajustado por quantidade, preço, item, suporte, observação e condição.

5. **Migração incremental.**
   Enquanto um módulo ainda depende do legado, ele roda dentro do shell V3. Depois é extraído sem alterar o fluxo do usuário.

6. **Dados reais antes de dashboards.**
   Métricas precisam ter o mesmo universo de origem. Histórico total do CRM não pode contaminar taxa de uma sessão de prospecção.

---

## Arquitetura alvo

```text
DUTRA OS V3 — SHELL ÚNICO
│
├── Home / Meu Dia
├── Cliente 360°
├── Prospecção / Sales Execution
├── Aplicação Técnica
├── Carrinho Multi-Veículos
├── Proposta / Cotação
├── Pedidos
├── Pós-venda
└── Relatórios
      │
      ▼
DOMAIN SERVICES COMPARTILHADOS
│
├── CRM / Lead Intelligence
├── Sales Execution
├── Technical Application Engine
├── Catalog / Pricing
├── Proposal Engine
├── Order Engine
├── Communication / WhatsApp
└── Sync / Persistence
      │
      ▼
PERSISTÊNCIA CANÔNICA
CRM atual → sincronização controlada → Supabase definitivo
```

---

## Estratégia de migração do legado

### Estado A — atual

- V3 tem interface melhor.
- Legado ainda tem módulos mais maduros.
- Algumas ações abrem o legado em nova aba.
- Existem lógicas duplicadas.

### Estado B — reintegração

- V3 continua como shell.
- Legado é executado apenas como módulo interno/embutido quando necessário.
- Handoff de contexto é automático.
- Nenhum cliente precisa ser redigitado.
- O usuário continua na mesma navegação V3.

### Estado C — extração

Cada módulo legado é desmontado em:

1. dados;
2. serviço de domínio;
3. componente de interface V3.

Depois o frame/ponte é removido.

### Estado D — final

Nenhuma tela do legado aparece para o usuário, mas nenhuma funcionalidade madura foi perdida.

---

# BLOCO 1 — CRM / LEADS

## Reaproveitar do legado

O motor `OG_LEAD_INTELLIGENCE` já possui:

- Todos;
- Fila de ataque;
- Clientes;
- Prospects;
- Propostas;
- ERP para conferir;
- Estratégicas;
- Já conversados;
- estágio da conversa;
- prioridade;
- próxima ação;
- score;
- ordenação.

## V3 deve apresentar

### Base CRM

Visões inteligentes são filtros vivos, e não bancos separados.

```text
BASE CRM
[Todos 184]
[Fila de ataque 92]
[Clientes 38]
[Prospects 126]
[Propostas 17]
[Estratégicas 22]
[Já conversados 63]
[ERP para conferir 8]
```

### Minhas listas

Listas são coleções operacionais:

```text
Ivan — 200 contatos
Maringá — Transportadoras
Feira 2026
Clientes antigos
```

Uma empresa pode aparecer em várias visões e listas sem duplicar a conta.

## Ações

De qualquer visão:

- abrir Cliente 360;
- selecionar contas;
- criar lista;
- iniciar sessão;
- preparar contatos;
- exportar quando necessário.

---

# BLOCO 2 — PROSPECÇÃO

## Corrigir métrica imediatamente

`close_rate` deve usar:

```text
vendas atribuídas às propostas do filtro
÷
propostas do mesmo filtro
```

Nunca:

```text
todos os clientes fechados do CRM
÷
propostas de uma sessão
```

Se não houver denominador:

mostrar `—` ou `0%`.

## Estrutura da tela

Ordem:

1. Base pronta para trabalhar;
2. Minhas listas;
3. Sessão ativa;
4. Conversão operacional;
5. Sessões recentes;
6. Reuniões.

Dashboard não pode vir antes do trabalho.

---

# BLOCO 3 — MOTOR TÉCNICO ÚNICO

## Problema atual

Existem duas implementações:

- `resolveVehicleSupports()` / `buildConsolidatedVehiclePieces()` no sistema legado;
- `supportDecision()` / `buildQuote()` na V3.

Isso cria risco de divergência.

## Solução

Criar serviço compartilhado:

`technical-application-service.js`

Responsável por:

```text
resolveApplication(input)
resolveSupports(input)
calculatePieces(input)
consolidateVehicles(vehicles)
validateApplication(input)
```

## Entrada

- tipo de veículo;
- marca;
- configuração;
- eixos;
- suspensão;
- cubo com redução;
- ano;
- aro;
- PSI;
- dianteira;
- quantidade.

## Saída

- eixos resolvidos;
- suporte por posição;
- código OG;
- código ERP;
- equalizador;
- mangueira;
- quantidade;
- alertas;
- pontos a validar;
- evidência/regra usada.

## Regra de segurança

Se a aplicação não estiver coberta:

`VALIDATE`

Nunca inferir silenciosamente.

---

# BLOCO 4 — APLICAÇÃO V3

A interface V3 permanece.

O motor técnico compartilhado alimenta:

```text
VEÍCULO
↓
PERGUNTAS DINÂMICAS
↓
EIXOS
↓
SUPORTES
↓
PEÇAS
↓
QUANTIDADES
↓
ORÇAMENTO
```

Dois modos:

- Assistido;
- Manual.

Botão obrigatório:

`USAR CÁLCULO COMO BASE MANUAL`

---

# BLOCO 5 — MULTI-VEÍCULOS

Reaproveitar do legado:

- vários veículos;
- quantidades;
- itens por veículo;
- preço manual;
- quantidade manual;
- peças extras;
- subtotal;
- consolidação.

Nova interface:

```text
FROTA DA PROPOSTA

3 × Volvo FH 6x2
2 × Scania R450 6x4
4 × Carreta 3 eixos

PEÇAS CONSOLIDADAS

EQ-120    44
EQ-1145    6
EQ-1190    4
EQ-1135   24
...
```

Cada código consolidado deve permitir expandir a origem por veículo.

---

# BLOCO 6 — PROPOSTA / COTAÇÃO

## Regra de UX

Não abrir outra aplicação em outra aba.

### Transição

Enquanto o motor oficial ainda for legado:

- abrir dentro da tela Proposta do V3;
- usar iframe same-origin/embedded somente como etapa intermediária;
- esconder navegação duplicada;
- manter barra V3;
- transferir contexto por handoff.

### Extração final

Migrar para componentes V3:

- cliente;
- veículos;
- itens;
- preço;
- frete;
- condição;
- parcelamento;
- ROI;
- PDF;
- mensagem WhatsApp.

Depois remover o iframe.

---

# BLOCO 7 — PEDIDOS

Criar fluxo contínuo:

```text
PROPOSTA ACEITA
↓
CONVERTER EM PEDIDO
↓
AJUSTAR SE NECESSÁRIO
↓
CONFIRMAR
↓
PREPARAÇÃO
↓
FRETE / INSTALAÇÃO
↓
CONCLUÍDO
↓
PÓS-VENDA
```

Pedido deve preservar histórico de alterações.

---

# BLOCO 8 — CLIENTE 360

Cliente 360 é a ficha-mãe.

Deve concentrar:

- empresa;
- contatos;
- gatekeepers;
- decisores;
- frota;
- aplicações;
- orçamento atual;
- propostas;
- pedidos;
- reuniões;
- timeline;
- próxima ação;
- pós-venda.

Nenhuma feature comercial deve pedir o cliente novamente quando já existe contexto.

---

# BLOCO 9 — NAVEGAÇÃO ÚNICA

Toda ação deve resolver dentro do V3.

Evitar:

- `window.open()`;
- nova aba;
- link para o legado;
- redigitação.

Exceções:

- PDF;
- WhatsApp;
- e-mail;
- calendário;
- recurso externo explicitamente solicitado.

---

# BLOCO 10 — ESTABILIDADE / SYNC

Estados:

- CONNECTING;
- CONNECTED;
- OFFLINE;
- SYNCING;
- ERROR.

Persistir localmente trabalho não confirmado.

Toda gravação importante:

```text
SALVANDO
↓
SALVO ✓
```

ou:

```text
OFFLINE
SALVO NESTE APARELHO
SINCRONIZAÇÃO PENDENTE
```

---

# BLOCO 11 — SUPABASE DEFINITIVO

Somente após fluxos principais estabilizarem.

Ordem:

1. Auth;
2. Organization;
3. Membership;
4. RLS;
5. entidades canônicas;
6. migração incremental;
7. remoção do state legado.

Nunca liberar tabelas com RLS genérico apenas para acelerar.

---

# ORDEM DE EXECUÇÃO

## Sprint R1 — reintegração imediata

- corrigir métricas de prospecção;
- restaurar visões inteligentes do CRM na V3;
- impedir abertura do legado em nova aba;
- embutir cotação oficial no shell V3;
- documentar arquitetura de reintegração.

## Sprint R2 — técnico único

- extrair `resolveVehicleSupports`;
- extrair `buildConsolidatedVehiclePieces`;
- criar serviço compartilhado;
- V3 passa a consumir serviço único;
- criar testes de equivalência legado x V3.

## Sprint R3 — Multi-Veículos

- extrair estado de veículos;
- carrinho técnico V3;
- consolidação;
- edição manual;
- extras.

## Sprint R4 — proposta V3 nativa

- extrair motor de preços;
- extrair geração de snapshot;
- UI de proposta nativa;
- PDF;
- tracking;
- remover iframe.

## Sprint R5 — pedidos

- proposta → pedido;
- edição;
- status;
- timeline.

## Sprint R6 — CRM/Sales Execution completos

- seleção CRM → lista;
- lista → sessão;
- sessão → contato;
- reunião/proposta sem troca de tela.

---

# TESTES DE REINTEGRAÇÃO

1. Abrir Fila de Ataque no V3 e encontrar as mesmas contas do legado.
2. Cliente em duas listas continua sendo uma única conta.
3. Taxa de fechamento nunca ultrapassa 100%.
4. Aplicação técnica retorna o mesmo resultado no legado e no V3.
5. Alterar regra técnica altera todos os consumidores.
6. Configurar veículo → proposta sem redigitar cliente.
7. Proposta oficial abre dentro do shell V3.
8. Converter cálculo assistido em manual preserva peças e preços.
9. Multi-veículos consolida códigos iguais.
10. Refresh não perde cliente, sessão nem rascunho.
11. Offline não apaga trabalho.
12. Nenhum botão operacional depende de abrir outro sistema.

---

# Definition of Done

Um módulo só está reintegrado quando:

- aparece no shell V3;
- usa a mesma conta central;
- não abre o legado em outra aba;
- não duplica regras;
- preserva edição manual;
- funciona em mobile;
- persiste;
- possui estado de erro/loading;
- possui teste;
- deploy está saudável.

---

## Resultado final esperado

O usuário não deve saber onde terminava o sistema antigo e onde começava a V3.

Para ele existe apenas:

> **DUTRA OS**

O legado vira implementação interna temporária e depois desaparece da interface, sem perda de inteligência, dados ou recursos.
