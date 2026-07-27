import { computed } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useUserAccess } from '~/composables/useUserAccess'

export const useScopedTableRead = () => {
  const { isLimitedUser, ensureSession } = useUserAccess()

  const shouldUseScopedRead = computed(() => Boolean(isLimitedUser.value))

  const getAccessToken = async () => {
    await ensureSession()
    const { data: { session } } = await supabase.auth.getSession()
    return String(session?.access_token || '').trim()
  }

  const postScopedRead = async (body) => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.')
    }

    return await $fetch('/api/secure-data/table-read', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body
    })
  }

  const readTablePage = async ({ table, columns = '*', from = 0, to = 999, filters = {} }) => {
    const response = await postScopedRead({
      table,
      columns,
      from,
      to,
      filters
    })

    return Array.isArray(response?.data) ? response.data : []
  }

  const checkTableExists = async (table) => {
    const response = await postScopedRead({
      table,
      existsOnly: true
    })

    return Boolean(response?.exists)
  }

  return {
    shouldUseScopedRead,
    readTablePage,
    checkTableExists
  }
}
