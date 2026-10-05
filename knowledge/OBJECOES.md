# Objeções comerciais

## Estrutura de cada playbook

```text
Objeção literal:
Contexto/segmento:
O que precisa ser esclarecido:
Perguntas de diagnóstico:
Resposta aprovada:
Prova permitida e fonte:
Próximo passo sugerido:
O que não prometer:
Última revisão:
```

## Regra operacional

A objeção registrada deve permanecer na linguagem do cliente. O sistema pode sugerir perguntas e próximos passos, mas uma resposta factual sobre aplicação, preço, economia, garantia, imposto, estoque, prazo ou case só pode usar fonte/autoridade válida.

## Categorias de diagnóstico

- Preço / valor: distinguir preço absoluto de dúvida de retorno, caixa, condição ou prioridade.
- “Já fazemos calibragem”: entender processo atual e problema real antes de comparar solução.
- “Preciso falar com manutenção/diretoria”: identificar papel, critério e próximo contato.
- “Não vejo economia”: não prometer ganho; levantar dados reais e, se aplicável, montar cenário explicitamente assumido.
- “Envie material”: combinar qual material resolve qual dúvida e quando retomar.
- “Sem orçamento agora”: separar falta de orçamento de falta de prioridade/fit.
- Aplicação técnica/compatibilidade: encaminhar para validação OG; nunca improvisar suporte.

O Call AI pode sugerir perguntas, mas só apresenta resposta factual quando houver fonte validada.

## V3 reference retained during Stage 1

The following preserves V3 branch guidance as reference for later stages; current integration safety and mature runtime remain authoritative. Historical runtime observations are not live certification.

# Objeções comerciais

## Regra

Objeção não é convite para responder automaticamente. Primeiro diagnosticar o significado real. Provas técnicas/comerciais só podem ser usadas quando houver fonte validada.

## OBJ-01 — “Preço”

**Status:** active / resposta factual condicionada a proposta real<br>
**Diagnóstico:** preço é valor absoluto, caixa/parcelamento, comparação com alternativa ou falta de percepção de retorno?<br>
**Perguntas:** “O ponto é investimento total, condição ou retorno esperado?”; “O que precisaria ficar claro para avaliar?”<br>
**Próximo passo:** revisar configuração/proposta e, quando houver dados válidos, simulação de frota/ROI.<br>
**Não prometer:** economia/payback não sustentados.

## OBJ-02 — “Já fazemos calibragem”

**Status:** active<br>
**Diagnóstico:** entender frequência, processo, responsável e dores residuais.<br>
**Perguntas:** “Como é feito hoje?”; “Com que frequência?”; “Mesmo com o processo atual, onde ainda aparece desgaste/perda de pressão?”<br>
**Próximo passo:** decidir se existe problema real que justifique aprofundar.<br>
**Não fazer:** desqualificar a rotina atual do cliente.

## OBJ-03 — “Preciso falar com outra pessoa”

**Status:** active<br>
**Diagnóstico:** identificar função, influência e próximo acesso.<br>
**Perguntas:** “Quem participa dessa parte?”; “Fica com frota, manutenção, compras ou direção?”; “Faz sentido alinharmos juntos?”<br>
**Próximo passo:** cadastrar a nova pessoa preservando o contato atual.

## OBJ-04 — “Envie material primeiro”

**Status:** active<br>
**Diagnóstico:** entender que informação precisa estar no material.<br>
**Perguntas:** “O que você precisa validar primeiro: aplicação, funcionamento, investimento ou resultado?”<br>
**Próximo passo:** enviar somente material pertinente e criar follow-up datado.<br>
**Não assumir:** envio = interesse/contato concluído.

## OBJ-05 — “Sem orçamento agora”

**Status:** active<br>
**Diagnóstico:** separar timing de falta de prioridade/fit.<br>
**Perguntas:** quando o tema volta ao planejamento; existe teste menor; quem precisa acompanhar.<br>
**Próximo passo:** próxima ação realista, sem pressionar artificialmente.

## OBJ-06 — Aplicação/compatibilidade

**Status:** active / técnico<br>
**Regra:** consultar `dutra-og-tech` e motor técnico.<br>
Se não houver determinação segura: `VALIDAR`.<br>
Nunca resolver objeção técnica inventando código de suporte.

## Estrutura para novas objeções

```text
Objeção literal:
Contexto/segmento:
O que precisa ser esclarecido:
Perguntas de diagnóstico:
Resposta aprovada:
Prova permitida e fonte:
Próximo passo:
O que não prometer:
Status/confiança:
Última revisão:
```

Call AI pode sugerir perguntas, mas resposta factual depende de fonte/revisão.
