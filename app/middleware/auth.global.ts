const MASTER_CONFIG_EMAIL = 'mateusribeiro.contabil@gmail.com'

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const isLandingRoute = to.path === '/'
  const isLoginRoute = to.path === '/login'
  const isResetPasswordRoute = to.path.startsWith('/reset-password')

  const { checkSession } = useAuth()
  const sessionUser = await checkSession()

  if (isLoginRoute) {
    if (sessionUser) return navigateTo('/dashboard')
    return
  }

  if (isLandingRoute || isResetPasswordRoute) return
  if (!sessionUser) return navigateTo('/login')

  const isConfigRoute = to.path.startsWith('/configuracoes')
  const userEmail = String(sessionUser.email || '').toLowerCase()
  const isMasterConfigUser = userEmail === MASTER_CONFIG_EMAIL

  if (isConfigRoute && !isMasterConfigUser) {
    return navigateTo('/dashboard')
  }
})
