'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewDocumentPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content })
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Error guardando documento')
      setLoading(false)
      return
    }

    router.push('/documents')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/documents" className="text-xs font-mono text-white/45 hover:text-white inline-block mb-4">
        ← Documentos
      </Link>
      <h1 className="font-display text-2xl font-bold mb-1">Nuevo documento</h1>
      <p className="text-white/55 text-sm mb-7">Este documento se va a guardar en tu organización. Nadie de afuera de tu workspace puede verlo.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wide text-white/70 mb-1.5">Título</span>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition"
            placeholder="Brief de campaña Q4"
            maxLength={200}
            autoFocus
            required
          />
        </label>
        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Contenido</span>
            <span className="text-[11px] text-white/35 font-mono">{content.length}/10000</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={9}
            maxLength={10000}
            className="w-full bg-black/40 border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition resize-y"
            placeholder="Escribí el contenido del documento…"
          />
        </label>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-lg px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition active:translate-y-px"
          >
            {loading ? 'Guardando…' : 'Guardar documento'}
          </button>
          <Link
            href="/documents"
            className="text-white/65 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg px-5 py-2.5 text-sm transition flex items-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
