import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Registro server-side con auto-confirm.
 *
 * Scoped solo a este demo (nlg-multitenant): usamos el service_role para crear
 * el usuario con `email_confirm: true`, así el visitante PyME puede entrar al
 * demo sin esperar mail. Otras apps que comparten este Supabase project
 * (CRM dashboard, etc.) NO se ven afectadas — cada una decide su política.
 */

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(72)
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Email o password inválidos (password mínimo 6 chars)' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (createErr) {
    const status = createErr.message.toLowerCase().includes('already') ? 409 : 400
    return NextResponse.json({ error: createErr.message }, { status })
  }

  const supabase = await createClient()
  const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password })

  if (signinErr) {
    return NextResponse.json(
      { error: 'Cuenta creada, pero no se pudo iniciar sesión: ' + signinErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
