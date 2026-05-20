import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'

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

export type AuditAction = 'create' | 'update' | 'soft_delete' | 'org_created'

export async function logAction(params: {
  orgId: string
  userId: string
  action: AuditAction
  resourceType: 'document' | 'organization'
  resourceId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const db = getServiceClient()
    const row = {
      org_id: params.orgId,
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? null
    }
    await db.from('mt_audit_log').insert(row)
  } catch (err) {
    console.error('[mt-audit] log insert failed:', err instanceof Error ? err.message : String(err))
  }
}
