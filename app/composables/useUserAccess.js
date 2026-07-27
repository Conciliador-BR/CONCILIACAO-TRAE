import { computed } from 'vue'
import { useAuth } from './useAuth'

const normalizeEmailList = (value) => {
  return String(value || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export const useUserAccess = () => {
  const config = useRuntimeConfig()
  const { user, checkSession } = useAuth()

  const adminEmails = computed(() => normalizeEmailList(
    config.public?.adminConfigEmails || config.adminConfigEmails || 'mateusribeiro.contabil@gmail.com'
  ))

  const userEmail = computed(() => String(user.value?.email || '').trim().toLowerCase())
  const isMasterUser = computed(() => Boolean(userEmail.value) && adminEmails.value.includes(userEmail.value))
  const isLimitedUser = computed(() => Boolean(userEmail.value) && !isMasterUser.value)
  const canAccessConfig = computed(() => isMasterUser.value)
  const canManageManualTables = computed(() => isMasterUser.value)

  const ensureSession = async () => {
    if (user.value) return user.value
    return await checkSession()
  }

  return {
    user,
    userEmail,
    adminEmails,
    isMasterUser,
    isLimitedUser,
    canAccessConfig,
    canManageManualTables,
    ensureSession
  }
}
