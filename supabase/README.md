# Supabase — canonical backend history

The DUTRA OS repository now distinguishes three different states explicitly.

## 1. Applied live history

`supabase/migrations/` contains the exact migration versions/names and SQL recorded in the live `og-proposal-engine` project during the 2026-10-03 recovery.

This folder is the canonical **applied backend history** used for drift comparison.

## 2. Deployed Edge Functions

`supabase/functions/` contains the source recovered from all active live Edge Functions. Existing Git sources for `sales-execution-gateway` and `call-intelligence` were verified as exact matches before the missing function sources were restored.

## 3. Pending / not applied

`supabase/pending/` contains reviewed migrations that exist as project work but are **not part of the current live migration history**.

The Auth + Organization pilot is currently pending:

`supabase/pending/20260926233000_auth_organization_pilot.sql`

It must not be treated as applied merely because it exists in Git.

A migration do piloto **não é aplicada automaticamente** pelo DUTRA OS atual.

## Auth pilot boundary

The pilot defines:

- Supabase Auth as user identity;
- `profiles.id` → `auth.users.id`;
- `organization_members` membership/roles;
- organization-aware RLS.

Live validation and an explicit rollout decision are still required before promoting/applying it.

## Structural-change pre-flight

Before any new Supabase migration or Edge Function deployment:

1. compare live migration versions against `supabase/migrations/`;
2. compare active live Edge Function source/checksums against `supabase/functions/`;
3. stop if drift exists;
4. create the new change in Git first;
5. validate it in a disposable environment;
6. only then consider production application.

Never use service-role values in browser code or Git.

Never run `supabase db reset --linked` against production.
