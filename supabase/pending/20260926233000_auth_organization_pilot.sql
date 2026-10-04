begin;

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_org_idx
  on public.organization_members(user_id, organization_id)
  where status = 'active';

create or replace function public.is_active_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

revoke all on function public.is_active_organization_member(uuid) from public;
grant execute on function public.is_active_organization_member(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;

create policy organizations_select_member
  on public.organizations for select
  to authenticated
  using (public.is_active_organization_member(id));

create policy profiles_select_self
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy organization_members_select_self
  on public.organization_members for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.organizations from anon;
revoke all on public.profiles from anon;
revoke all on public.organization_members from anon;

grant select on public.organizations to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.organization_members to authenticated;

comment on table public.organizations is 'Package 02R organization boundary. Creation/bootstrap is server/admin controlled.';
comment on table public.profiles is 'Application profile keyed 1:1 to auth.users.';
comment on table public.organization_members is 'Explicit user-to-organization membership used by RLS.';

commit;
