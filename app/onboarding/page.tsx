'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell, FormField, fieldClass, btnPrimary } from '@/components/AuthShell'

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: orgName.trim() })
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? 'Error creando organización')
      setLoading(false)
      return
    }
    router.push('/documents')
    router.refresh()
  }

  return (
    <AuthShell
      eyebrow="Onboarding"
      title="Creá tu workspace"
      subtitle="Dale un nombre a tu organización. Vas a ser owner — podés invitar miembros después."
      footer={
        <span className="text-white/40 text-xs">
          La organización queda atada a tu cuenta. Nadie de afuera puede verla.
        </span>
      }
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        <FormField label="Nombre de la organización" hint="máx. 100 chars">
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            className={fieldClass}
            placeholder="Mi Empresa"
            maxLength={100}
            autoFocus
            required
          />
        </FormField>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading || !orgName.trim()} className={btnPrimary}>
          {loading ? 'Creando workspace…' : 'Crear workspace →'}
        </button>
      </form>
    </AuthShell>
  )
}
