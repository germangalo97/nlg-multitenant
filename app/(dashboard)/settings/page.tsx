import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationForUser } from '@/lib/db/organizations'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getOrganizationForUser(supabase, user.id)
  if (!membership) redirect('/onboarding')

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-400/80 mb-1">Workspace settings</p>
      <h1 className="font-display text-2xl font-bold mb-7">{membership.organization.name}</h1>

      <div className="grid gap-3">
        <Row label="Tu rol" value={
          <span className="bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded text-xs font-mono uppercase">
            {membership.role}
          </span>
        } />
        <Row label="Email" value={<code className="font-mono text-sm">{user.email}</code>} />
        <Row label="User ID" value={<code className="font-mono text-xs text-white/55 break-all">{user.id}</code>} />
        <Row label="Organization ID" value={<code className="font-mono text-xs text-white/55 break-all">{membership.org_id}</code>} />
        <Row label="Workspace creado" value={
          <span className="text-sm text-white/70">
            {new Date(membership.organization.created_at).toLocaleString('es-UY', { dateStyle: 'long', timeStyle: 'short' })}
          </span>
        } />
      </div>

      <section className="mt-8 bg-emerald-400/[0.04] border border-emerald-400/15 rounded-xl p-5">
        <h2 className="font-display font-semibold text-emerald-300 mb-2">RLS Policies aplicadas</h2>
        <p className="text-sm text-white/65 leading-snug mb-3">
          Las siguientes políticas se aplican en cada query desde el cliente. Anon (sin login) no ve nada; usuarios autenticados solo ven lo que su <code className="font-mono text-emerald-300 text-[0.85em]">user_id</code> tiene en <code className="font-mono text-emerald-300 text-[0.85em]">mt_org_members</code>.
        </p>
        <ul className="text-xs font-mono text-white/55 space-y-1.5 leading-relaxed">
          <li>· <span className="text-white/75">mt_organizations</span>: SELECT solo si user es miembro</li>
          <li>· <span className="text-white/75">mt_org_members</span>: SELECT solo de la org del user</li>
          <li>· <span className="text-white/75">mt_documents</span>: SELECT/INSERT solo en la org del user, soft delete por creador</li>
          <li>· <span className="text-white/75">mt_audit_log</span>: SELECT solo de la org del user, INSERT solo service role</li>
        </ul>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between items-baseline gap-3 border-b border-white/[0.05] pb-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/55">{label}</span>
      <span>{value}</span>
    </div>
  )
}
