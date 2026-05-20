import type { SupabaseClient } from '@supabase/supabase-js'

export type Membership = {
  org_id: string
  role: 'owner' | 'member'
  organization: { id: string; name: string; created_at: string }
}

export async function createOrganization(
  db: SupabaseClient,
  userId: string,
  name: string
): Promise<{ id: string }> {
  const { data: org, error: orgError } = await db
    .from('mt_organizations')
    .insert({ name, created_by: userId })
    .select('id')
    .single()

  if (orgError || !org) {
    throw new Error(orgError?.message ?? 'Error creando organización')
  }

  const { error: memberError } = await db
    .from('mt_org_members')
    .insert({
      org_id: org.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString()
    })

  if (memberError) {
    throw new Error(memberError.message)
  }

  return { id: org.id }
}

export async function getOrganizationForUser(
  db: SupabaseClient,
  userId: string
): Promise<Membership | null> {
  const { data, error } = await db
    .from('mt_org_members')
    .select('org_id, role, mt_organizations!inner(id, name, created_at)')
    .eq('user_id', userId)
    .not('joined_at', 'is', null)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const orgRel = (data as { mt_organizations: { id: string; name: string; created_at: string } | { id: string; name: string; created_at: string }[] }).mt_organizations
  const organization = Array.isArray(orgRel) ? orgRel[0] : orgRel
  if (!organization) return null

  return {
    org_id: data.org_id as string,
    role: data.role as 'owner' | 'member',
    organization
  }
}
