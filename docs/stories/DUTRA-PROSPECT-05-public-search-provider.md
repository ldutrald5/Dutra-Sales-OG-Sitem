# DUTRA-PROSPECT-05 — Public Search Provider

## Objetivo
Conectar o contrato de pesquisa do DUTRA OS a um provider público real sem acoplar o navegador a uma chave/API específica.

## Contrato
O adapter recebe uma função `searchFn` injetada pelo runtime seguro. O cliente apenas monta a consulta e normaliza resultados públicos em candidatos com fonte. Nenhuma chave fica no bundle e nenhuma descoberta entra automaticamente no CRM.

## Prova real
Em 2026-09-28 o provider Firecrawl instalado foi consultado em modo web para “transportadora Maringá PR frota caminhões logística” e retornou resultados públicos com URL e trechos, incluindo páginas de transportadoras e Cocamar Transportes. Isso valida a disponibilidade da fonte externa; a conexão de produção deve ocorrer no servidor/integração aprovada, não com segredo no browser.

## Próximo
PROSPECT-06: endpoint server-side provider-neutral, limites/custos e persistência da fila de pesquisa.
