'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell, FormField, fieldClass, btnPrimary } from '@/components/AuthShell'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Error creando cuenta')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <AuthShell
      eyebrow="Crear cuenta"
      title="Empezá tu workspace"
      subtitle="Vas a crear tu organización en el próximo paso. Toda tu data va a estar aislada del resto."
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">Iniciar sesión</Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
        <FormField label="Password" hint="mín. 6 chars">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </FormField>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? 'Creando…' : 'Crear cuenta →'}
        </button>
      </form>
    </AuthShell>
  )
}
