'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, FormField, fieldClass, btnPrimary } from '@/components/AuthShell'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/documents')
    router.refresh()
  }

  return (
    <AuthShell
      eyebrow="Login"
      title="Iniciar sesión"
      subtitle="Entrá a tu workspace para ver los documentos de tu organización."
      footer={
        <>
          ¿Sin cuenta?{' '}
          <Link href="/register" className="text-emerald-400 hover:underline">Crear cuenta</Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <FormField label="Email">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="vos@empresa.com"
            required
          />
        </FormField>
        <FormField label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="••••••••"
            required
          />
        </FormField>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>
      </form>
    </AuthShell>
  )
}
