# DUTRA OS — Runtime hospedado

> Manifesto operacional. Este arquivo contém apenas localizadores e contratos não secretos. Estado atual deve ser confirmado no Railway antes de ser tratado como verdade operacional.

## Repositório

- GitHub: `ldutrald5/Dutra-Sales-OG-Sitem`
- Branch de produção atual: `main`
- Aplicação: `apps/sistema-og/`
- Start hospedado: `npm start`
- Script hospedado: `scripts/start-og-hosted.mjs`

## Railway

- Workspace: `Lucas Dutra's Projects`
- Projeto: `Dutra Sales OG`
- Project ID: `02a559fd-b4a6-457a-81dd-6501a0e23bdb`
- Environment: `production`
- Environment ID: `976ea20f-7cac-4d48-83c5-1ccffb1cd7f9`
- Service: `sistema-og`
- Service ID: `f5bf6592-1ef6-40d0-89d4-518c65fae12d`

## Endereços

- Aplicação: `https://sistema-og-production.up.railway.app`
- Página auxiliar de acesso móvel: `https://sistema-og-production.up.railway.app/celular`
- Health endpoint: `/health`

O domínio acima é um localizador conhecido. Antes de entregar ao usuário como "link atual funcionando", confirmar no Railway:
1. último deploy = SUCCESS;
2. domínio continua ligado ao serviço;
3. health check está saudável.

## Runtime

- Start command no Railway: `npm start`
- Porta esperada no ambiente atual: variável `PORT`
- Host hospedado: definido pelo launcher para `0.0.0.0`
- Health path: `/health`

## Autenticação de acesso

O servidor hospedado exige um código/token de acesso para rotas protegidas.

- Nome da variável secreta: `OG_ACCESS_TOKEN`
- Compatibilidade interna: o launcher converte para `OG_LOCAL_ACCESS_TOKEN`
- O valor **não deve ser salvo neste repositório**.

O valor deve permanecer no gerenciador de variáveis do Railway ou outro cofre de segredos aprovado.

## Persistência — atenção

No momento da criação deste manifesto, o serviço Railway foi observado sem volume persistente anexado.

O launcher usa `RAILWAY_VOLUME_MOUNT_PATH` quando existe e, caso contrário, cai em `/data/sistema-og`. Sem volume/database durável confirmado, não tratar o filesystem do container como armazenamento definitivo de CRM.

Antes de migrar operação comercial real para a instância hospedada, verificar e implementar persistência durável conforme a arquitetura aprovada.

## Regra para agentes

Para qualquer pergunta sobre "sistema online", "celular", "deploy", "status", "domínio", "logs" ou "Railway":

1. ativar `dutra-runtime-operator`;
2. ler este manifesto;
3. consultar Railway ao vivo;
4. consultar GitHub quando houver dúvida de versão/commit;
5. só então responder ou executar mudança autorizada.

Nunca confiar apenas em uma URL lembrada de conversa anterior.
