import { supabase as supabaseClient } from '~/composables/PageVendas/useSupabaseConfig.js'

const MASTER_CONFIG_EMAIL = 'mateusribeiro.contabil@gmail.com'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path.startsWith('/reset-password')) return
  const { data: { session } } = await supabaseClient.auth.getSession()
  if (!session) return navigateTo('/login')

  const isConfigRoute = to.path.startsWith('/configuracoes')
  const userEmail = String(session.user?.email || '').toLowerCase()
  const isMasterConfigUser = userEmail === MASTER_CONFIG_EMAIL

  if (isConfigRoute && !isMasterConfigUser) {
    return navigateTo('/')
  }
})
