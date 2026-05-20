import type { SupabaseClient } from '@supabase/supabase-js'

export type Document = {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
}

export async function listDocuments(
  db: SupabaseClient,
  orgId: string
): Promise<Document[]> {
  const { data, error } = await db
    .from('mt_documents')
    .select('id, title, content, created_by, created_at')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data ?? []) as Document[]
}

export async function createDocument(
  db: SupabaseClient,
  orgId: string,
  userId: string,
  title: string,
  content: string
): Promise<{ id: string }> {
  const { data, error } = await db
    .from('mt_documents')
    .insert({ org_id: orgId, title, content, created_by: userId })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Error creando documento')
  return { id: data.id as string }
}

export async function softDeleteDocument(
  db: SupabaseClient,
  documentId: string
): Promise<void> {
  const { error } = await db
    .from('mt_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId)

  if (error) throw new Error(error.message)
}
