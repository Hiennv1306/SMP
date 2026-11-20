import { createClient } from '@supabase/supabase-js'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseUrl = configuredUrl
  ? configuredUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  : undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseConfig = {
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
}

export function getSupabaseConfigurationError() {
  if (!supabaseUrl) {
    return 'VITE_SUPABASE_URL chua Duoc cau hinh.'
  }

  if (!supabaseAnonKey) {
    return 'VITE_SUPABASE_ANON_KEY chua Duoc cau hinh.'
  }

  return null
}

export const supabase = supabaseConfig.isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
