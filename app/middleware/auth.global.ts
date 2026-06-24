export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const config = useRuntimeConfig()
  const adminEmails = String(config.public.adminConfigEmails || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

  const isLandingRoute = to.path === '/'
  const isLoginRoute = to.path === '/login'
  const isResetPasswordRoute = to.path.startsWith('/reset-password')

  const { user, checkSession } = useAuth()
  const sessionUser = user.value || await checkSession()

  if (isLoginRoute) {
    // Mantem a tela de login acessivel para o usuario acionar a entrada manualmente.
    return
  }

  if (isLandingRoute || isResetPasswordRoute) return
  if (!sessionUser) return navigateTo('/login')

  const isConfigRoute = to.path.startsWith('/configuracoes')
  const userEmail = String(sessionUser.email || '').toLowerCase()
  const isMasterConfigUser = adminEmails.includes(userEmail)

  if (isConfigRoute && !isMasterConfigUser) {
    return navigateTo('/dashboard')
  }
})
