# Package 02R — Auth + Organization Pilot

Esta pasta contém o contrato versionado do piloto de identidade. A migration **não é aplicada automaticamente** pelo DUTRA OS atual.

## Fronteira

- Supabase Auth é a origem da identidade do usuário.
- `profiles.id` referencia `auth.users.id`.
- `organization_members` define a associação explícita entre usuário e organização.
- RLS usa membership ativa para leitura da organização.
- O navegador não recebe `service_role`.
- Criação de organização, criação de membership e elevação de papel ficam fora do cliente público neste incremento.
- O token Cloudflare atual continua sendo uma ponte de compatibilidade até o corte explícito de um Package posterior.

## Bootstrap seguro

O primeiro bootstrap deve ser executado em ambiente administrativo controlado: criar usuário no Auth, inserir Profile, criar Organization e inserir OrganizationMember owner. O Package 02R não implementa auto-signup que possa criar organizações arbitrárias.

## Rollback

A migration não toca `state.leads`, localStorage, IndexedDB, JSON local ou KV. Antes de aplicação remota, rollback é simplesmente não aplicar. Após aplicação em ambiente piloto vazio, remover policies/tabelas na ordem inversa somente por migration de rollback revisada.

## Pendência ambiental

`OQ-PKG02-001` só pode ser encerrada quando existir um projeto Supabase escolhido e um ensaio real confirmar migration, Auth, RLS e bootstrap. Até lá, este pacote mantém o caminho remoto desligado.
