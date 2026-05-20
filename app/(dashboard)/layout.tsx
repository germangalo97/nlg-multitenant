import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationForUser } from '@/lib/db/organizations'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getOrganizationForUser(supabase, user.id)
  if (!membership) redirect('/onboarding')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-white/[0.07] bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href="/documents" className="flex items-center gap-2 font-display font-bold">
              <span className="bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 px-1.5 py-0.5 rounded text-[0.65rem] font-mono uppercase tracking-wider">
                org
              </span>
              <span className="text-[0.95rem]">{membership.organization.name}</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 text-[0.83rem] text-white/55">
              <Link href="/documents" className="hover:text-white px-3 py-1.5 rounded-md hover:bg-white/[0.04] transition">Documentos</Link>
              <Link href="/settings" className="hover:text-white px-3 py-1.5 rounded-md hover:bg-white/[0.04] transition">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs font-mono text-white/35">{user.email}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-xs text-white/50 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-md px-2.5 py-1.5 transition">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">{children}</main>
      <footer className="border-t border-white/[0.05] px-6 py-4 text-center text-xs text-white/35">
        Demo abierta · <a className="hover:text-emerald-400" href="https://github.com/germangalo97/nlg-multitenant" target="_blank" rel="noopener">Código fuente</a> · <a className="hover:text-emerald-400" href="https://nlgsystems.io/portafolio" target="_blank" rel="noopener">Portafolio NLG Systems</a>
      </footer>
    </div>
  )
}
