# DUTRA-PROSPECT-07 — Research UI Pipeline

A aba Prospecção agora possui o launcher DUTRA Research com cidade, UF, segmento, frota mínima, quantidade e palavras-chave. O clique explícito cria uma missão via Intake, chama o gateway seguro, executa Research + deduplicação e alimenta o Research Inbox. A importação continua separada e exige confirmação humana.

Também foi corrigida a integração anterior do Inbox: `researchItems` e `researchHtml` agora são calculados dentro de `renderProspectInbox`, eliminando referência indefinida em runtime.
