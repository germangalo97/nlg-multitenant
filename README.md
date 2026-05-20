# nlg-multitenant

Multi-tenant workspace donde los datos de cada organización están **completamente aislados** vía Row Level Security de Supabase. Un usuario en la Org A no puede ver nada de Org B — ni siquiera conociendo el UUID exacto.

Construido por [NLG Systems](https://nlgsystems.io). Demo abierta para que el escéptico la rompa.

**Live demo:** https://nlg-multitenant.vercel.app  
**Stack:** Next.js 14 · TypeScript · Supabase Auth · RLS Policies · Tailwind CSS · Vercel

---

## Verificalo vos mismo

1. Abrí https://nlg-multitenant.vercel.app
2. Registrá una cuenta A → creá una org → creá un documento "Secreto"
3. Abrí una ventana incógnita → registrá una cuenta B → creá otra org
4. Desde la cuenta B, mirá `/documents` — está vacía
5. Aun copiando el UUID exacto del documento de A en una consulta directa, la fila no es accesible

El test de integración en `tests/rls.test.ts` automatiza exactamente eso contra Supabase real (6 escenarios).

---

## Seguridad implementada

- **Row Level Security** habilitado en las 4 tablas (`mt_organizations`, `mt_org_members`, `mt_documents`, `mt_audit_log`)
- **Policies basadas en `org_id`** del usuario autenticado — sin policy, anon/authenticated no ven nada
- **Helper `mt_user_org_ids()` SECURITY DEFINER** para evitar recursión infinita en policies (pitfall conocido: una policy que lee la misma tabla en su `USING` causa loop)
- **Audit log inmutable** — solo el service role puede insertar; usuarios solo SELECT
- **Soft delete** — los documentos eliminados conservan registro con `deleted_at`
- **Auth con cookies via `@supabase/ssr`** — refresh tokens en cookie httpOnly, middleware actualiza sesión en cada request
- **Zod validation** en todos los API routes antes de cualquier procesamiento
- **Índices** sobre `org_id` y `(org_id, created_at desc) where deleted_at is null` para queries rápidas

---

## Las 4 RLS policies clave

```sql
-- Solo ves docs de las orgs donde sos miembro
create policy "members can view org documents"
  on mt_documents for select
  using (
    deleted_at is null
    and org_id in (select public.mt_user_org_ids(auth.uid()))
  );

-- Solo podés crear docs en tu org, atados a tu user_id
create policy "members can create documents"
  on mt_documents for insert
  with check (
    created_by = auth.uid()
    and org_id in (select public.mt_user_org_ids(auth.uid()))
  );

-- Solo el creador puede borrar (soft delete vía UPDATE deleted_at)
create policy "creator can soft delete their documents"
  on mt_documents for update
  using (created_by = auth.uid());

-- Audit log: lectura solo de tu org; INSERT bloqueado (solo service role)
create policy "members can view org audit log"
  on mt_audit_log for select
  using (org_id in (select public.mt_user_org_ids(auth.uid())));
```

Las policies completas: [`supabase/rls.sql`](./supabase/rls.sql)

---

## Tests

```bash
# Skip-guard si no hay env: offline no rompe
npm test
```

Para correr el test real contra Supabase, exportá tus 3 credenciales y corré vitest:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
npm test
```

Cubre 6 escenarios:

1. User A puede ver SUS propios documentos
2. User B NO puede ver documentos de Org A (vía `org_id`)
3. User B NO puede ver Org A por su `id` directo
4. User B NO puede leer un documento de Org A por su `id` directo
5. User B NO puede auto-insertarse como miembro de Org A (insert blocked)
6. Anon (sin login) no ve absolutamente nada

Los users + orgs + docs creados por el test se borran en `afterAll` — corré en loop sin acumular basura.

---

## Correr localmente

1. Crear proyecto Supabase (o reusar uno existente)
2. Ejecutar `supabase/schema.sql` + `supabase/rls.sql` en el SQL Editor
3. `cp .env.example .env.local` y completar con las 3 keys
4. `npm install && npm run dev`

---

## Deploy

```bash
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

---

## Estructura

```
nlg-multitenant/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Verifica auth + membership
│   │   ├── documents/page.tsx
│   │   ├── documents/new/page.tsx
│   │   └── settings/page.tsx
│   ├── onboarding/page.tsx     # Crear primera org
│   └── api/
│       ├── organizations/route.ts
│       ├── documents/route.ts
│       └── auth/logout/route.ts
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   └── db/{organizations,documents,audit}.ts
├── supabase/
│   ├── schema.sql
│   └── rls.sql
├── tests/
│   └── rls.test.ts
├── middleware.ts
└── vitest.config.ts
```
