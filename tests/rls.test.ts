/**
 * Test de aislamiento RLS — corre contra un Supabase REAL.
 *
 * Skip-guard: si no hay NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY,
 * los tests se saltan — así `vitest run` offline no falla.
 *
 * Qué prueba:
 *   1. User A puede ver SUS documentos
 *   2. User B NO puede ver documentos de Org A (aunque conozca el doc.id)
 *   3. User B NO puede ver Org A (aunque conozca el org.id)
 *   4. User B NO puede insertarse como miembro de Org A
 *
 * Limpieza: borra users + orgs + docs en afterAll (idempotente).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const canRun = !!(SUPABASE_URL && ANON_KEY && SERVICE_KEY)
const skip = !canRun

if (skip) {
  console.log('⚠ Skipping RLS tests: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
}

describe.skipIf(skip)('RLS isolation between organizations', () => {
  const stamp = Date.now()
  const emailA = `rls-test-a-${stamp}@nlg-test.com`
  const emailB = `rls-test-b-${stamp}@nlg-test.com`
  const password = `TestPwd_${stamp}!`

  let adminClient: SupabaseClient
  let userAId = ''
  let userBId = ''
  let orgAId = ''
  let orgBId = ''
  let docAId = ''

  beforeAll(async () => {
    adminClient = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } })

    const { data: a, error: aErr } = await adminClient.auth.admin.createUser({
      email: emailA, password, email_confirm: true
    })
    if (aErr || !a.user) throw new Error('No se pudo crear user A: ' + aErr?.message)
    userAId = a.user.id

    const { data: b, error: bErr } = await adminClient.auth.admin.createUser({
      email: emailB, password, email_confirm: true
    })
    if (bErr || !b.user) throw new Error('No se pudo crear user B: ' + bErr?.message)
    userBId = b.user.id

    const { data: orgA, error: orgAErr } = await adminClient
      .from('mt_organizations')
      .insert({ name: `RLS Test Org A ${stamp}`, created_by: userAId })
      .select('id')
      .single()
    if (orgAErr || !orgA) throw new Error('No se pudo crear Org A: ' + orgAErr?.message)
    orgAId = orgA.id

    await adminClient.from('mt_org_members').insert({
      org_id: orgAId, user_id: userAId, role: 'owner', joined_at: new Date().toISOString()
    })

    const { data: orgB, error: orgBErr } = await adminClient
      .from('mt_organizations')
      .insert({ name: `RLS Test Org B ${stamp}`, created_by: userBId })
      .select('id')
      .single()
    if (orgBErr || !orgB) throw new Error('No se pudo crear Org B: ' + orgBErr?.message)
    orgBId = orgB.id

    await adminClient.from('mt_org_members').insert({
      org_id: orgBId, user_id: userBId, role: 'owner', joined_at: new Date().toISOString()
    })

    const { data: doc, error: docErr } = await adminClient
      .from('mt_documents')
      .insert({
        org_id: orgAId,
        title: 'Secreto de Org A',
        content: 'Solo miembros de Org A pueden ver esto',
        created_by: userAId
      })
      .select('id')
      .single()
    if (docErr || !doc) throw new Error('No se pudo crear doc A: ' + docErr?.message)
    docAId = doc.id
  })

  it('User A puede ver sus propios documentos', async () => {
    const clientA = createClient(SUPABASE_URL!, ANON_KEY!)
    const { error: loginErr } = await clientA.auth.signInWithPassword({ email: emailA, password })
    expect(loginErr).toBeNull()

    const { data, error } = await clientA.from('mt_documents').select('id, title').eq('org_id', orgAId)
    if (error) throw new Error(`SELECT mt_documents falló para user A: ${error.message} (code: ${error.code})`)
    expect(data).toBeTruthy()
    expect(data!.length).toBeGreaterThan(0)
    expect(data!.find(d => d.id === docAId)).toBeTruthy()
  })

  it('User B NO puede ver documentos de Org A (aunque pida por org_id)', async () => {
    const clientB = createClient(SUPABASE_URL!, ANON_KEY!)
    await clientB.auth.signInWithPassword({ email: emailB, password })

    const { data } = await clientB.from('mt_documents').select('id, title').eq('org_id', orgAId)
    expect(data ?? []).toEqual([])
  })

  it('User B NO puede ver Org A por id directo', async () => {
    const clientB = createClient(SUPABASE_URL!, ANON_KEY!)
    await clientB.auth.signInWithPassword({ email: emailB, password })

    const { data } = await clientB.from('mt_organizations').select('id, name').eq('id', orgAId)
    expect(data ?? []).toEqual([])
  })

  it('User B NO puede leer doc de Org A por document.id directo', async () => {
    const clientB = createClient(SUPABASE_URL!, ANON_KEY!)
    await clientB.auth.signInWithPassword({ email: emailB, password })

    const { data } = await clientB.from('mt_documents').select('id, title, content').eq('id', docAId)
    expect(data ?? []).toEqual([])
  })

  it('User B NO puede auto-insertarse como miembro de Org A', async () => {
    const clientB = createClient(SUPABASE_URL!, ANON_KEY!)
    await clientB.auth.signInWithPassword({ email: emailB, password })

    const { data, error } = await clientB
      .from('mt_org_members')
      .insert({ org_id: orgAId, user_id: userBId, role: 'member', joined_at: new Date().toISOString() })
      .select()
    expect(data).toBeFalsy()
    expect(error).toBeTruthy()
  })

  it('Anon (sin login) no ve nada de Org A', async () => {
    const anon = createClient(SUPABASE_URL!, ANON_KEY!)
    const { data: orgs } = await anon.from('mt_organizations').select('id')
    expect(orgs ?? []).toEqual([])

    const { data: docs } = await anon.from('mt_documents').select('id').eq('id', docAId)
    expect(docs ?? []).toEqual([])
  })

  afterAll(async () => {
    if (!adminClient) return
    if (docAId) await adminClient.from('mt_documents').delete().eq('id', docAId)
    if (orgAId) await adminClient.from('mt_org_members').delete().eq('org_id', orgAId)
    if (orgBId) await adminClient.from('mt_org_members').delete().eq('org_id', orgBId)
    if (orgAId) await adminClient.from('mt_organizations').delete().eq('id', orgAId)
    if (orgBId) await adminClient.from('mt_organizations').delete().eq('id', orgBId)
    if (userAId) await adminClient.auth.admin.deleteUser(userAId)
    if (userBId) await adminClient.auth.admin.deleteUser(userBId)
  })
})
