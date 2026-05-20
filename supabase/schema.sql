-- Multi-tenant Workspace — schema multi-tenant con prefijo mt_
-- Ejecutar este SQL en Supabase SQL Editor del proyecto destino.

create extension if not exists "pgcrypto";

-- Organizaciones (tenants)
create table if not exists mt_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Miembros de organización
create table if not exists mt_org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references mt_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique(org_id, user_id)
);

create index if not exists idx_mt_org_members_user_id on mt_org_members(user_id);
create index if not exists idx_mt_org_members_org_id on mt_org_members(org_id);

-- Documentos (scoped por org)
create table if not exists mt_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references mt_organizations(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  content text not null default '',
  created_by uuid not null references auth.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mt_documents_org_id on mt_documents(org_id);
create index if not exists idx_mt_documents_alive on mt_documents(org_id, created_at desc) where deleted_at is null;

-- Audit log (solo escribe el service role; usuarios solo SELECT)
create table if not exists mt_audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid not null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mt_audit_log_org_id on mt_audit_log(org_id);
create index if not exists idx_mt_audit_log_created_at on mt_audit_log(created_at desc);
