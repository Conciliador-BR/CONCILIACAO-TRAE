import { createClient } from '@supabase/supabase-js'

export const useAuth = () => {
  const config = useRuntimeConfig()
  
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey
  )

  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Verificar sessão atual
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
      return session?.user
    } catch (err) {
      error.value = err.message
      return null
    }
  }

  // Login com email e senha
  const login = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      
      user.value = data.user
      return { success: true, user: data.user }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      
     