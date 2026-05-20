'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    // Si hay confirmación por email, intentamos login directo (la demo lo permite si Supabase Auth no exige confirmación)
    const { error: signinError } = await supabase.auth.signInWithPassword({ email, password })
    if (signinError) {
      setError('Cuenta creada. Revisá tu mail para confirmar el acceso.')
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
