import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 border-b border-white/[0.07]">
        <Link href="/" className="font-display font-bold text-[15px] flex items-center gap-2">
          <span className="text-emerald-400">🔒</span>
          <span>Multi-tenant Workspace</span>
          <span className="text-white/40 text-xs font-mono ml-1">· NLG Systems</span>
        </Link>
      </header>
      <main className="flex-1 grid lg:grid-cols-[1fr_1.1fr]">
        <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-black via-[#08110d] to-black p-12 border-r border-white/[0.06]">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-400/80">Demo NLG · Row Level Security</p>
            <h2 className="mt-4 font-display text-3xl leading-tight max-w-md">
              Dos organizaciones.<br/>
              <span className="text-emerald-400">Cero forma</span> de cruzar datos.
            </h2>
            <p className="mt-4 text-white/55 text-sm leading-relaxed max-w-md">
              Cada documento, miembro y log queda atado a su <code className="font-mono text-emerald-300 text-[0.85em] bg-white/5 px-1.5 py-0.5 rounded">org_id</code>. Las RLS policies de Supabase rechazan cualquier query que intente leer datos de otra organización — incluso si el atacante conoce el UUID exacto.
            </p>
          </div>
          <div className="space-y-3 text-xs font-mono text-white/40 leading-relaxed">
            <div className="border-l-2 border-emerald-500/40 pl-3">
              <div className="text-white/70">policy "members can view org documents"</div>
              <div>  on mt_documents for select</div>
              <div>  using (org_id in (select org_id from mt_org_members</div>
              <div>    where user_id = auth.uid()))</div>
            </div>
          </div>
        </aside>
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-400/80 mb-2">{eyebrow}</p>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-white/55 text-sm mt-1.5 mb-7">{subtitle}</p>
            {children}
            <div className="mt-7 text-sm text-white/50 text-center">{footer}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

export function FormField({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</span>
        {hint && <span className="text-[11px] text-white/35 font-mono">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

export const fieldClass =
  'w-full bg-black/40 border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-[0.92rem] font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition'

export const btnPrimary =
  'w-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-lg py-2.5 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-px'
