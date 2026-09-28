# TERR-01A — Territory Readiness

Status: **concluída na fase A**

## Objetivo

Começar Territory Intelligence sem inventar latitude/longitude e sem contratar um provedor de mapas antes de a carteira possuir qualidade geográfica suficiente.

## Entrega

- parser determinístico de cidade/UF a partir dos campos já existentes;
- suporte aditivo a `cidadeUf`, `cidade/city`, `uf/state`, endereço e CEP quando presentes;
- classificação de prontidão: cidade/UF, endereço completo, localização incompleta e UF inválida;
- visão de cobertura territorial na fila de Prospecção;
- concentração por cidade/UF, número de contas, clientes/prospects e frota registrada;
- filtro da fila de prospecção por cidade/UF;
- nenhuma coordenada criada por heurística.

## Regra crítica

**TERR-01A não faz geocoding.** Cidade/UF é tratada como evidência comercial disponível; latitude/longitude somente serão aceitas quando vierem de fonte verificável ou provedor de geocoding aprovado.

## Próxima fase

TERR-01B poderá adicionar mapa e proximidade somente depois de:

1. cobertura geográfica suficiente na base;
2. política de endereço/geocoding;
3. seleção de um provedor;
4. cache e limites de custo;
5. consentimento/privacidade adequados;
6. teste de precisão e fallback.

## Segurança e integridade

- nenhum envio de endereços a terceiro nesta fase;
- nenhum secret/API key;
- sem mutação dos leads;
- sem segunda base de clientes;
- filtro é apenas uma projeção da mesma carteira.

## Testes

- normalização Maringá - PR e Cascavel/PR;
- cidade sem UF continua incompleta;
- agrupamento e contagem por território;
- clientes/prospects separados no agregado;
- frota somada somente quando explicitamente registrada;
- filtro territorial;
- imutabilidade da carteira;
- shell/PWA inclui o serviço.

## Rollback

Reverter a fase remove painel/filtro e serviço de readiness. Nenhum dado de cliente precisa ser migrado ou apagado.
