-- RLS policies para multi-tenant
-- Ejecutar DESPUÉS de schema.sql.

-- Habilitar RLS en las 4 tablas
alter table mt_organizations enable row level security;
alter table mt_org_members enable row level security;
alter table mt_documents enable row level security;
alter table mt_audit_log enable row level security;

-- Helper SECURITY DEFINER que devuelve los org_id del user actual.
-- Evita recursión: si una policy hace SELECT contra mt_org_members,
-- esa SELECT a su vez chequea la policy → loop infinito. Esta función
-- bypasea RLS via SECURITY DEFINER pero solo expone IDs del user actual.
create or replace function public.mt_user_org_ids(uid uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from public.mt_org_members
  where user_id = uid and joined_at is not null
$$;

revoke all on function public.mt_user_org_ids(uuid) from public;
grant execute on function public.mt_user_org_ids(uuid) to authenticated;

-- mt_organizations: solo miembros ven su org
create policy "members can view their org"
  on mt_organizations for select
  using (id in (select public.mt_user_org_ids((select auth.uid()))));

create policy "auth can create org"
  on mt_organizations for insert
  with check (created_by = (select auth.uid()));

create policy "owner can update org"
  on mt_organizations for update
  using (created_by = (select auth.uid()));

-- mt_org_members
create policy "members can view org members"
  on mt_org_members for select
  using (org_id in (select public.mt_user_org_ids((select auth.uid()))));

-- Solo te podés insertar a vos mismo (no a otros) — la lógica de invitar
-- queda fuera del scope demo; en producción esto sería con un endpoint
-- service-role + token de invitación.
create policy "user can insert themselves"
  on mt_org_members for insert
  with check (user_id = (select auth.uid()));

-- mt_documents
create policy "members can view org documents"
  on mt_documents for select
  using (
    deleted_at is null
    and org_id in (select public.mt_user_org_ids((select auth.uid())))
  );

create policy "members can create documents"
  on mt_documents for insert
  with check (
    created_by = (select auth.uid())
    and org_id in (select public.mt_user_org_ids((select auth.uid())))
  );

create policy "creator can soft delete their documents"
  on mt_documents for update
  using (created_by = (select auth.uid()))
  with check (
    org_id in (select public.mt_user_org_ids((select auth.uid())))
  );

-- mt_audit_log: solo SELECT para miembros; INSERT bloqueado (solo service role escribe)
create policy "members can view org audit log"
  on mt_audit_log for select
  using (org_id in (select public.mt_user_org_ids((select auth.uid()))));
