# Scripts comerciais

## Princípio

Scripts são guias adaptáveis. Devem indicar objetivo, perguntas e próximo passo, sem inventar fatos sobre a conta ou o produto.

A fonte operacional dos modos comerciais está em `docs/playbooks/SALES_PLAYBOOKS.md`. Este arquivo mantém frases/estruturas reutilizáveis; dados da conta entram em runtime pelo CRM.

## SCRIPT-01 — Gatekeeper

**Status:** ativo  
**Objetivo:** identificar e chegar ao responsável por frota/manutenção/pneus.

**Abertura base:**

> Oi, aqui é o Lucas, da Olho de Gato. Preciso falar com quem cuida da frota ou da manutenção dos pneus. Você consegue me orientar?

**Perguntas:**
- Quem cuida dessa parte?
- Normalmente fica com frota, manutenção ou proprietário?
- Poderia me passar para essa pessoa?
- Existe ramal ou WhatsApp comercial?

**Registrar:** nome, cargo, contato/ramal e pessoa indicada.  
**Não fazer:** apresentação técnica completa.

## SCRIPT-02 — Decisor / diagnóstico

**Status:** ativo  
**Objetivo:** entender operação, dor e caminho de decisão.

**Perguntas base:**
- Como vocês controlam hoje pressão e desgaste dos pneus?
- O que mais pesa na rotina/custo de pneus hoje?
- Qual parte da frota exige mais atenção?
- Quem mais participa da decisão?
- Faz sentido simular/testar em veículos reais?

## SCRIPT-03 — Conversão para reunião

**Status:** ativo  
**Objetivo:** parar de explicar indefinidamente quando a oportunidade já está qualificada.

**Estrutura base:**

> Pelo tamanho da operação, vale mais eu montar uma simulação na frota real do que ficar só na explicação por telefone.

Depois confirmar participantes, formato e oferecer horários concretos adequados ao contexto.

## SCRIPT-04 — Follow-up

**Status:** ativo

> Estou retomando exatamente do ponto que combinamos.

Perguntar o que mudou, o que foi validado e qual bloqueio existe agora. Não reiniciar a venda como lead frio.

## SCRIPT-05 — Proposta

**Status:** ativo

> Quero revisar o que ficou pendente na proposta e entender o que precisa acontecer para a decisão avançar.

Diagnosticar bloqueio técnico, financeiro ou timing; identificar aprovadores.

## SCRIPT-06 — Cliente / expansão

**Status:** ativo

> Quero entender como está a experiência com o que já foi instalado e se mudou algo na frota.

Explorar experiência, veículos novos, reposição, expansão e só depois indicação quando houver confiança.

## Regras

- adaptar ao `relationship_status` e à pessoa atual;
- nunca inventar economia, preço, garantia, aplicação ou case;
- proposta criada não significa enviada;
- WhatsApp aberto não significa mensagem enviada;
- sugestões de Call AI só viram fato após revisão.

Templates de mensagens/documentos pertencem a `docs/08-TEMPLATES-COMERCIAIS.md`.
