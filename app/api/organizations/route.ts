import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createOrganization } from '@/lib/db/organizations'
import { logAction } from '@/lib/db/audit'

const schema = z.object({
  name: z.string().trim().min(1).max(100)
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nombre inválido (1-100 chars)' }, { status: 400 })
  }

  try {
    const org = await createOrganization(supabase, user.id, parsed.data.name)
    await logAction({
      orgId: org.id,
      userId: user.id,
      action: 'org_created',
      resourceType: 'organization',
      resourceId: org.id,
      metadata: { name: parsed.data.name }
    })
    return NextResponse.json({ org }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
