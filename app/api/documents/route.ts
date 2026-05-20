import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationForUser } from '@/lib/db/organizations'
import { createDocument } from '@/lib/db/documents'
import { logAction } from '@/lib/db/audit'

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(10000).default('')
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const membership = await getOrganizationForUser(supabase, user.id)
  if (!membership) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const doc = await createDocument(
      supabase,
      membership.org_id,
      user.id,
      parsed.data.title,
      parsed.data.content
    )
    await logAction({
      orgId: membership.org_id,
      userId: user.id,
      action: 'create',
      resourceType: 'document',
      resourceId: doc.id,
      metadata: { title: parsed.data.title }
    })
    return NextResponse.json({ doc }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
