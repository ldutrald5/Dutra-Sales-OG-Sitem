# DUTRA-INT-01 — Roadmap do DUTRA Intelligence Core

Status: **em andamento**

## Objetivo

Evoluir o DUTRA OS sem criar módulos isolados ou segundas fontes de verdade. CIC, DUTRA Force, pós-venda, OG Technical Brain, Aplicação Visual 360°, Proposal/ROI e Coach DUTRA devem ser superfícies do mesmo núcleo operacional.

## Princípios obrigatórios

1. O CRM/Account 360 atual continua como fonte operacional da conta.
2. `OG_LEAD_INTELLIGENCE` continua como fonte canônica de priorização; não criar segundo score.
3. `interaction-service.setNextAction()` continua como contrato canônico de próxima ação.
4. Sugestões, sinais e IA não podem virar fatos sem confirmação humana ou evento confiável.
5. Dados técnicos, frota, ROI, proposta visualizada, decisor e satisfação nunca podem ser inventados.
6. Evolução aditiva: preservar IDs, histórico, sincronização, backups, PWA e compatibilidade legada.
7. Toda estimativa deve carregar premissa, evidência e/ou nível de confiança quando aplicável.

## Ondas de evolução

### WAVE-01 — Coração comercial

Fechar o ciclo antes/durante/depois do contato reutilizando CIC-01, PRECALL-01 e Interaction Service.

Entregas:
- briefing pré-ligação com fatos, lacunas, perguntas e “NÃO DIGA AINDA”;
- compromisso comercial estruturado;
- diário inteligente: texto/voz transcrita → rascunho estruturado revisável;
- motivo, objetivo e resultado esperado da próxima ação;
- nenhum fato salvo sem revisão.

### WAVE-02 — DUTRA Force

Transformar o motor de prospecção e Territory Intelligence em fluxo operacional:

`Missão → Discovery → Research → Qualification → Account → Contact → Opportunity → Next Action`

Cada evidência externa deverá registrar fonte, data e confiança. Estimativa de frota não pode ser apresentada como frota confirmada.

### WAVE-03 — Customer Revenue Engine

Usar clientes existentes como fonte de expansão:
- frota total confirmada;
- frota coberta por OG;
- gap de cobertura;
- jornadas 7/30/60/90/120;
- satisfação;
- reposição;
- expansão;
- indicação;
- origem e resultado da indicação.

### WAVE-04 — OG Technical Brain

Criar relações estruturadas:

`Veículo → configuração → eixos → implemento → posição → pressão → suporte → código OG/ERP → regra → evidência`

Aplicação desconhecida deve permanecer desconhecida até validação técnica.

### WAVE-05 — Aplicação Visual 360°

A interface visual será projeção do OG Technical Brain, nunca uma base técnica paralela.

### WAVE-06 — Proposal + ROI Engine

Uma fonte de dados para:
- mensagem curta;
- proposta intermediária;
- proposta executiva;
- estudo ROI/payback.

Cenários conservador/base/otimista devem exibir premissas. Economia e payback são simulações, não garantias.

### WAVE-07 — Coach DUTRA

Somente após dados estruturados suficientes. O Coach deve explicar recomendações usando fatos reais da operação, não produzir aconselhamento genérico desconectado do CRM.

## Primeira implementação

A primeira fatia funcional é **DIARY-01 — Diário Inteligente Revisável**, porque reduz trabalho manual e melhora os dados que alimentarão Force, Coach, pós-venda e NBA.

Contrato pretendido:

`texto/transcrição → extração determinística/assistida → preview → revisão humana → aplicação pelos serviços canônicos`

O parser não altera CRM diretamente.

## Fora de escopo deste documento

- contratar provedores externos;
- geocoding sem gate;
- automação de WhatsApp sem API apropriada;
- inferir frota, decisor, satisfação ou venda;
- substituir Supabase/persistência;
- reescrever módulos já concluídos.
