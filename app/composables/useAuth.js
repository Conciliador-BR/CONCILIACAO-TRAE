import { ref, readonly, onMounted, getCurrentInstance } from 'vue'
import { supabase as supabaseClient } from '~/composables/PageVendas/useSupabaseConfig.js'

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000
const LAST_ACTIVITY_KEY = 'conciliacao:last-activity'
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

const user = ref(null)
const loading = ref(false)
const error = ref(null)

let authListenerInitialized = false
let inactivityWatcherInitialized = false
let inactivityTimeoutId = null
let authInitializationPromise = null

const clearInactivityTimer = () => {
  if (!process.client || !inactivityTimeoutId) return
  window.clearTimeout(inactivityTimeoutId)
  inactivityTimeoutId = null
}

const clearLastActivity = () => {
  if (!process.client) return
  window.localStorage.removeItem(LAST_ACTIVITY_KEY)
}

const updateLastActivity = () => {
  if (!process.client || !user.value) return
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

const handleInactivityLogout = async () => {
  if (!process.client || !user.value) return
  await supabaseClient.auth.signOut()
  user.value = null
  clearLastActivity()
  clearInactivityTimer()
  if (window.location.pathname !== '/login') {
    await navigateTo('/login')
  }
}

const restartInactivityTimer = () => {
  if (!process.client || !user.value) return

  clearInactivityTimer()

  const lastActivityRaw = window.localStorage.getItem(LAST_ACTIVITY_KEY)
  const lastActivity = Number(lastActivityRaw || Date.now())
  const elapsedTime = Date.now() - lastActivity

  if (elapsedTime >= INACTIVITY_TIMEOUT_MS) {
    void handleInactivityLogout()
    return
  }

  inactivityTimeoutId = window.setTimeout(() => {
    void handleInactivityLogout()
  }, INACTIVITY_TIMEOUT_MS - elapsedTime)
}

const registerActivity = () => {
  if (!process.client || !user.value) return
  updateLastActivity()
  restartInactivityTimer()
}

const handleVisibilityChange = () => {
  if (!process.client || document.hidden || !user.value) return
  restartInactivityTimer()
}

const setupInactivityWatcher = () => {
  if (!process.client || inactivityWatcherInitialized) return

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, registerActivity, { passive: true })
  })
  document.addEventListener('visibilitychange', handleVisibilityChange)
  inactivityWatcherInitialized = true
}

const teardownInactivityWatcher = () => {
  if (!process.client || !inactivityWatcherInitialized) return

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, registerActivity)
  })
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  inactivityWatcherInitialized = false
  clearInactivityTimer()
}

const syncSessionState = (session, options = {}) => {
  const { markActivity = false } = options
  user.value = session?.user ?? null

  if (!process.client) return

  if (session?.user) {
    setupInactivityWatcher()
    if (markActivity) {
      updateLastActivity()
    }
    restartInactivityTimer()
    return
  }

  teardownInactivityWatcher()
  clearLastActivity()
}

export const useAuth = () => {
  const supabase = supabaseClient

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      syncSessionState(session)
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

      syncSessionState(data.session, { markActivity: true })
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

      syncSessionState(data.session, { markActivity: true })
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
      syncSessionState(null)
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
    if (authListenerInitialized) return

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      syncSessionState(session, { markActivity: event === 'SIGNED_IN' })
    })

    authListenerInitialized = true
  }

  const initializeAuth = async () => {
    if (!authInitializationPromise) {
      setupAuthListener()
      authInitializationPromise = checkSession().catch((err) => {
        authInitializationPromise = null
        throw err
      })
    }

    return authInitializationPromise
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      void initializeAuth()
    })
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    login,
    signUp,
    logout,
    resetPassword,
    checkSession,
    initializeAuth
  }
}
