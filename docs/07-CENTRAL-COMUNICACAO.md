# Central de Comunicação

## Objetivo

Um espaço amplo e contextual para preparar comunicações sem perder a conta ativa. A central cria rascunhos e registra apenas fatos confirmados pelo usuário.

## Canais

- WhatsApp
- E-mail
- Proposta
- Formulário
- Apresentação

## Objetivos comerciais

Primeiro contato, chegar ao decisor, não atendeu, pós-ligação, apresentação, orçamento, follow-up, recuperação, objeção de preço, redução de custos, fechamento, pós-venda e indicação.

## Fluxo

1. Receber `companyId`, contato e objetivo da Mesa de Vendas.
2. Sugerir templates compatíveis com canal, estágio e segmento.
3. Preencher variáveis determinísticas e sinalizar ausências.
4. Exibir prévia editável.
5. Opcionalmente personalizar com IA.
6. Copiar, abrir o canal ou exportar.
7. Registrar envio somente após confirmação explícita, com canal e horário.
8. Pedir resultado e próxima ação quando fizer sentido.

## Estados necessários

`draft`, `ready`, `copied`, `channel_opened`, `sent_confirmed`, `failed`, `archived`. Copiar ou abrir um canal não produz `sent_confirmed`.

## Integrações futuras

Integração oficial de e-mail ou WhatsApp dependerá de credenciais, consentimento, política de retenção e story própria. Até lá, links e cópia manual são o caminho seguro e econômico.

## Implementação TASK-009

- O JSONL é a fonte estruturada inicial; IDs, status original, confiança e fonte são preservados.
- O DOCX é manual humano e referência de governança, registrado por nome e hash, sem indexação automática.
- Status são normalizados em uma taxonomia de governança; premissas e pendências não viram promessa externa.
- WhatsApp e e-mail usam templates versionados antes de qualquer IA.
- Personalização reutiliza `ai-service`, contexto mínimo e no máximo três conhecimentos selecionados.
- Cada rascunho registra cliente, contato, canal, objetivo, template, uso de IA e `knowledge_ids_used`.
- Copiar ou abrir canal registra `prepared`/`opened`; nunca `sent` sem confirmação real.
