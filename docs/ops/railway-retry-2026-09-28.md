# Railway deployment retry — 2026-09-28

## Contexto

O deployment automático do Railway referente ao `main` em:

`44de9750dfb0d61b13b34bf78e4e69824c95f6cc`

falhou antes da etapa de inicialização/build e não gerou logs de aplicação.

O serviço ativo anterior permaneceu saudável, portanto este retry não altera dados, volume, variáveis, domínio nem configuração de runtime.

## Objetivo deste commit

Gerar um novo evento auditável no `main` para que o Railway tente um deployment limpo do estado atual do repositório.

## Garantias

- nenhum código de negócio alterado;
- nenhuma migração executada;
- nenhuma configuração do Railway alterada;
- nenhum dado persistido alterado;
- CIC-02, Ficha Universal e melhorias de importação permanecem exatamente como estão no `main`;
- o retry só deve validar se o Railway consegue inicializar, buildar e publicar o HEAD atual.

## Estado esperado

1. Railway detecta novo commit no `main`;
2. inicia Build;
3. executa `npm start`;
4. `/health` responde dentro de 30 segundos;
5. deployment assume o tráfego somente após healthcheck aprovado.
