import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase de forma lazy
let supabaseClient = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const config = useRuntimeConfig()
    
    if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
      throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.')
    }
    
    supabaseClient = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
  }
  
  return supabaseClient
}

// Usar Proxy para criar acesso lazy ao cliente Supabase
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient()
    return client[prop]
  }
})