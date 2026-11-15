import { isSupabaseConfigured, supabase } from '@/services/supabase';

export type SupabaseHealth =
  | { status: 'missing_env' }
  | { status: 'unreachable'; message: string }
  | { status: 'live_no_schema' }
  | { status: 'live' };

/** Probe linked project without exposing keys. */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  if (!isSupabaseConfigured || !supabase) return { status: 'missing_env' };
  try {
    const { error } = await supabase.from('products').select('barcode').limit(1);
    if (!error) return { status: 'live' };
    const msg = error.message || '';
    if (msg.includes('schema cache') || msg.includes('Could not find the table') || error.code === 'PGRST205') {
      return { status: 'live_no_schema' };
    }
    return { status: 'unreachable', message: msg };
  } catch (err) {
    return {
      status: 'unreachable',
      message: err instanceof Error ? err.message : 'unknown',
    };
  }
}
