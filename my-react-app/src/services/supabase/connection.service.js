import { getSupabaseConfigurationError, supabaseConfig } from '../../config/supabase'

export async function testSupabaseConnection() {
  const configurationError = getSupabaseConfigurationError()
  if (configurationError) {
    return {
      status: 'not-configured',
      message: configurationError,
    }
  }

  try {
    const response = await fetch(`${supabaseConfig.url}/auth/v1/health`, {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        status: 'error',
        message: `Supabase health tra ve HTTP ${response.status}${body ? `: ${body}` : '.'}`,
      }
    }

    return {
      status: 'connected',
      message: 'Da ket noi thanh cong Den Supabase.',
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Khong the ket noi Den Supabase.',
    }
  }
}
