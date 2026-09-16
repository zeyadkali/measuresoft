import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'tt_supabase_url';
const STORAGE_KEY_KEY = 'tt_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && key.length > 10);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (
    cachedClient &&
    (cachedClient as unknown as { supabaseUrl?: string }).supabaseUrl === url
  ) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  cachedClient = null; // force recreate
}

export function clearSupabaseCredentials() {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
}

export interface SupabaseBackupRecord {
  id: string;
  name: string;
  created_at: string;
  data: {
    version: number;
    appName: string;
    exportedAt: string;
    presets: unknown[];
    config: unknown;
  };
}

export async function listSupabaseBackups(): Promise<SupabaseBackupRecord[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { data, error } = await client
    .from('tt_backups')
    .select('id, name, created_at, data')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseBackupRecord[];
}

export async function uploadSupabaseBackup(
  name: string,
  backupData: SupabaseBackupRecord['data']
): Promise<SupabaseBackupRecord> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { data: userData } = await client.auth.getUser();
  const userId = userData?.user?.id || null;

  const { data, error } = await client
    .from('tt_backups')
    .insert([
      {
        name,
        data: backupData,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as SupabaseBackupRecord;
}

export async function deleteSupabaseBackup(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { error } = await client.from('tt_backups').delete().eq('id', id);
  if (error) throw error;
}

export async function getCurrentSupabaseUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}
