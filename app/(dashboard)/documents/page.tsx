import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationForUser } from '@/lib/db/organizations'
import { listDocuments } from '@/lib/db/documents'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getOrganizationForUser(supabase, user.id)
  if (!membership) redirect('/onboarding')

  const docs = await listDocuments(supabase, membership.org_id)

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-7">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-400/80 mb-1">Workspace · {membership.organization.name}</p>
          <h1 className="font-display text-3xl font-bold">Documentos</h1>
        </div>
        <Link
          href="/documents/new"
          className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-lg px-4 py-2.5 text-sm transition active:translate-y-px"
        >
          + Nuevo documento
        </Link>
      </header>

      {docs.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/55 mb-2">Aún no hay documentos en este workspace.</p>
          <Link href="/documents/new" className="text-emerald-400 hover:underline text-sm font-medium">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map(doc => (
            <article
              key={doc.id}
              className="group bg-gradient-to-b from-white/[0.025] to-transparent border border-white/[0.07] hover:border-emerald-400/30 rounded-xl p-5 transition"
            >
              <h2 className="font-display font-semibold text-[1.05rem] text-white mb-1.5 line-clamp-2">{doc.title}</h2>
              {doc.content && (
                <p className="text-white/55 text-sm leading-relaxed line-clamp-3 mb-3">{doc.content}</p>
              )}
              <p className="text-white/30 text-[11px] font-mono">
                {new Date(doc.created_at).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </article>
          ))}
        </div>
      )}

      <section className="mt-10 grid sm:grid-cols-2 gap-3">
        <div className="bg-emerald-400/[0.04] border border-emerald-400/15 rounded-xl p-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/70 mb-1.5">RLS activo</p>
          <p className="text-sm text-white/70 leading-snug">
            Estos {docs.length} {docs.length === 1 ? 'documento' : 'documentos'} están filtrados por <code className="font-mono text-emerald-300 text-[0.85em]">org_id = {membership.org_id.slice(0, 8)}…</code>. Otro user en otra org obtendría 0 filas aunque conozca el UUID.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1.5">Verificá vos mismo</p>
          <p className="text-sm text-white/65 leading-snug">
            Abrí una ventana incógnita, registrate con otro email, creá otra org. Vas a ver una lista vacía acá — no podés ver estos documentos aunque tengas el <code className="font-mono text-[0.85em]">org_id</code>.
          </p>
        </div>
      </section>
    </div>
  )
}
