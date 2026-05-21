const MASTER_CONFIG_EMAIL = 'mateusribeiro.contabil@gmail.com'

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const { checkSession } = useAuth()
  const sessionUser = await checkSession()

  if (to.path === '/login') {
    if (sessionUser) return navigateTo('/dashboard')
    return
  }

  if (to.path.startsWith('/reset-password')) return
  if (!sessionUser) return navigateTo('/login')

  const isConfigRoute = to.path.startsWith('/configuracoes')
  const userEmail = String(sessionUser.email || '').toLowerCase()
  const isMasterConfigUser = userEmail === MASTER_CONFIG_EMAIL

  if (isConfigRoute && !isMasterConfigUser) {
    return navigateTo('/')
  }
})
