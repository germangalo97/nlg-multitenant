import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'

export type Membership = {
  org_id: string
  role: 'owner' | 'member'
  organization: { id: string; name: string; created_at: string }
}

let serviceClient: SupabaseClient | null = null
function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return serviceClient
}

/**
 * Crea una org y agrega al user como owner.
 *
 * Usa service_role porque es una operación de **provisionamiento**:
 * el user todavía no es miembro de ninguna org, así que las policies
 * basadas en membership tienen un chicken-and-egg que es estándar
 * en SaaS multi-tenant resolver con un endpoint admin-style.
 *
 * El caller (/api/organizations) ya validó la identidad con getUser().
 * Las queries posteriores (documents, settings) sí pasan por RLS.
 */
export async function createOrganization(
  userId: string,
  name: string
): Promise<{ id: string }> {
  const admin = getServiceClient()

  const { data: org, error: orgError } = await admin
    .from('mt_organizations')
    .insert({ name, created_by: userId })
    .select('id')
    .single()

  if (orgError || !org) {
    throw new Error(orgError?.message ?? 'Error creando organización')
  }

  const { error: memberError } = await admin
    .from('mt_org_members')
    .insert({
      org_id: org.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString()
    })

  if (memberError) {
    // Cleanup: borrar la org huérfana
    await admin.from('mt_organizations').delete().eq('id', org.id)
    throw new Error(memberError.message)
  }

  return { id: org.id as string }
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
