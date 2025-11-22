import { ref, readonly, onMounted } from 'vue'
import { supabase as supabaseClient } from '~/composables/PageVendas/useSupabaseConfig.js'

export const useAuth = () => {
  const supabase = supabaseClient

  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

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

  const login = async (email, password) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email?.toLowerCase(),
        password
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

  const signUp = async (email, password) => {
    try {
      loading.value = true
      error.value = null

      const redirectTo = process.client ? `${window.location.origin}/` : undefined
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email?.toLowerCase(),
        password,
        options: { emailRedirectTo: redirectTo }
      })

      if (signUpError) throw signUpError

      user.value = data.user || null
      return { success: true, user: data.user }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null

      await supabase.auth.signOut()
      user.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email) => {
    try {
      loading.value = true
      error.value = null

      const redirectTo = process.client ? `${window.location.origin}/reset-password` : undefined
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

      if (resetError) throw resetError
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user ?? null
    })
  }

  onMounted(() => {
    setupAuthListener()
    checkSession()
  })

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    login,
    signUp,
    logout,
    resetPassword,
    checkSession
  }
}