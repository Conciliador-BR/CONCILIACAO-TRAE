import { createClient } from '@supabase/supabase-js'

export const getSupabaseAdminClient = () => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl
  const supabaseServiceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Chave administrativa do Supabase nao encontrada. Configure SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY no servidor para criar usuarios em Authentication.'
    })
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
