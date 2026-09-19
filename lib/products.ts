import type { SupabaseClient } from '@supabase/supabase-js';

export type Product = 'pricing_desk' | 'search_by_design';

export async function hasProductAccess(supabase: SupabaseClient, workspaceId: string, product: Product): Promise<boolean> {
  const { data } = await supabase
    .from('product_subscriptions')
    .select('status')
    .eq('workspace_id', workspaceId)
    .eq('product', product)
    .maybeSingle();
  return data?.status === 'active';
}

export async function activeProducts(supabase: SupabaseClient, workspaceId: string): Promise<Product[]> {
  const { data } = await supabase
    .from('product_subscriptions')
    .select('product')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');
  return (data ?? []).map((row) => row.product as Product);
}
