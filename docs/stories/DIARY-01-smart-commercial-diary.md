# DIARY-01 — Diário Inteligente Revisável

Status: **pronta**

## Problema

Após ligação, WhatsApp, visita ou reunião, o vendedor não deve precisar atualizar manualmente vários campos e telas. Ao mesmo tempo, texto livre ou transcrição não pode alterar o CRM por inferência silenciosa.

## Objetivo

Receber um relato livre e gerar um rascunho estruturado para revisão humana.

Exemplo de entrada:

> Falei com o João. Tem 32 caminhões, está testando em 3. Pediu retorno sexta depois de falar com o sócio. Principal problema é desgaste irregular.

Saída proposta, sempre como preview:
- contato mencionado;
- frota mencionada;
- contexto/teste;
- dor mencionada;
- compromisso;
- próxima ação;
- data sugerida;
- trechos de evidência;
- campos incertos destacados.

## Regras

- parser nunca persiste diretamente;
- cada campo extraído guarda evidência textual;
- datas relativas precisam ser resolvidas com data-base explícita;
- número de frota mencionado não substitui automaticamente valor confirmado;
- decisor não é inferido de “dono”, “sócio”, “gerente” sem revisão;
- “interessado”, “gostou” ou “vai ver” não significam venda;
- próxima ação confirmada deve usar `interaction-service.setNextAction()`;
- resultado confirmado deve usar `interaction-service.recordResult()`;
- observação confirmada deve entrar na timeline canônica;
- IA, quando usada, produz somente sugestão revisável.

## Critérios de aceite

1. texto vazio é rejeitado;
2. preview não muta o lead;
3. extrações exibem evidência;
4. usuário pode aceitar/rejeitar campo a campo;
5. aplicação usa serviços existentes, não escrita paralela;
6. funciona sem IA com captura manual/heurística conservadora;
7. datas e compromissos não são inventados;
8. testes provam imutabilidade antes da confirmação;
9. mobile permite revisar o preview com poucos toques.

## Dependências

- TASK-005;
- TASK-006;
- CIC-01;
- PRECALL-01.

## Próxima fatia

Implementar contrato de preview e parser conservador, depois ligar a uma única superfície de pós-contato antes de expandir para Call AI, Mesa e Prospecção.
