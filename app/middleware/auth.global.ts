import { supabase as supabaseClient } from '~/composables/PageVendas/useSupabaseConfig.js'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path.startsWith('/reset-password')) return
  const { data: { session } } = await supabaseClient.auth.getSession()
  if (!session) return navigateTo('/login')
})