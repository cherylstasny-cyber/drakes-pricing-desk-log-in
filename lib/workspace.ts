import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Shared identity helper: every product (Pricing Desk, Search by Design)
 * reads/writes through the same workspace a user belongs to. Existing
 * Pricing Desk pages don't call this yet (they're still static empty
 * states), so adding it here doesn't change any current behavior --
 * it's available for both product lines to adopt.
 */
export async function getOrCreateWorkspaceId(supabase: SupabaseClient, userId: string, userEmail: string): Promise<string> {
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (membership?.workspace_id) return membership.workspace_id as string;

  const localPart = (userEmail.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'user';
  const slug = `${localPart}-${Math.random().toString(36).slice(2, 8)}`;

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ name: `${localPart}'s workspace`, slug, created_by: userId })
    .select('id')
    .single();

  if (error || !workspace) {
    throw new Error(`Could not create a workspace: ${error?.message ?? 'unknown error'}`);
  }

  return workspace.id as string;
}
