import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { mapSenha } from './mappers.js'

export const useSenhasSupabase = () => {
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)
  const resumo = ref({ processadas: 0, sucesso: 0, falha: 0, erros: [] })

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession()
    const accessToken = String(data?.session?.access_token || '').trim()

    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.')
    }

    return {
      Authorization: `Bearer ${accessToken}`
    }
  }

  const buscarSenhas = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch('/api/cadastro/senhas', {
        method: 'GET',
        query: {
          empresa: filters.empresa || undefined,
          ec: filters.ec ?? undefined,
          adquirente: filters.adquirente || undefined
        },
        headers: await getAuthHeaders()
      })

      return {
        ok: true,
        data: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0
      }
    } catch (err) {
      error.value = err?.data?.statusMessage || err?.message || 'Erro ao buscar senhas'
      return { ok: false, error: error.value, data: [] }
    } finally {
      loading.value = false
    }
  }

  const salvarSenhasNoSupabase = async (senhas, options = {}) => {
    loading.value = true
    error.value = null
    success.value = false

    try {
      const result = await $fetch('/api/cadastro/senhas', {
        method: 'POST',
        body: {
          senhas
        },
        headers: await getAuthHeaders()
      })

      resumo.value = {
        processadas: result?.processadas || 0,
        sucesso: result?.sucesso || 0,
        falha: result?.falha || 0,
        erros: result?.erros || []
      }
      success.value = !!result?.ok
      return result
    } catch (err) {
      error.value = err?.data?.statusMessage || err?.message || 'Erro ao salvar senhas'
      resumo.value = {
        processadas: senhas?.length || 0,
        sucesso: 0,
        falha: senhas?.length || 0,
        erros: [error.value]
      }
      return { ok: false, ...resumo.value, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const enviarSenha = async (senha, options = {}) => {
    return await salvarSenhasNoSupabase([senha], options)
  }

  const enviarSenhasLote = async (senhas, options = {}) => {
    return await salvarSenhasNoSupabase(senhas, options)
  }

  const upsertSenha = async (senha, options = {}) => {
    return await salvarSenhasNoSupabase([senha], options)
  }

  const upsertSenhas = async (senhas, options = {}) => {
    return await salvarSenhasNoSupabase(senhas, options)
  }

  const removerSenha = async (senha) => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/cadastro/senhas', {
        method: 'DELETE',
        body: {
          id: senha?.id ?? null,
          empresa: senha?.empresa ?? '',
          ec: senha?.ec ?? null,
          adquirente: senha?.adquirente ?? '',
          login: senha?.login ?? '',
          portal: senha?.portal ?? ''
        },
        headers: await getAuthHeaders()
      })

      return result
    } catch (err) {
      error.value = err?.data?.statusMessage || err?.message || 'Erro ao remover senha'
      return { ok: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    success,
    resumo,
    mapSenha,
    buscarSenhas,
    upsertSenha,
    upsertSenhas,
    removerSenha,
    salvarSenhasNoSupabase,
    enviarSenha,
    enviarSenhasLote
  }
}
