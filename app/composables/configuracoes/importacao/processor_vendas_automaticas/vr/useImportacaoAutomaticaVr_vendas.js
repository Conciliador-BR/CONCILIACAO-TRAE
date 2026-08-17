import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useImportacaoAutomaticaVrVendas = () => {
  const carregandoArquivos = ref(false)
  const carregando = ref(false)
  const erro = ref('')
  const arquivosDisponiveis = ref([])

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

  const normalizeError = (err, fallback) => {
    return String(err?.data?.statusMessage || err?.message || fallback)
  }

  const parseDateInput = (value) => {
    const text = String(value || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
    return text.replace(/-/g, '')
  }

  const filtrarArquivosVr = (arquivos = [], filtros = {}) => {
    const cnpj = String(filtros?.cnpj || '').replace(/\D/g, '')
    const start = parseDateInput(filtros?.dataInicial)
    const end = parseDateInput(filtros?.dataFinal)

    return (arquivos || []).filter((item) => {
      const fileName = String(item?.fileName || '')
      const originalStem = String(item?.originalStem || '')
      const referenceDate = String(item?.referenceDate || '')

      if (!fileName.toLowerCase().endsWith('.txt')) return false
      if (cnpj && !originalStem.includes(cnpj)) return false
      if (start && referenceDate && referenceDate < start) return false
      if (end && referenceDate && referenceDate > end) return false
      if ((start || end) && !referenceDate) return false
      return true
    })
  }

  const carregarArquivosDisponiveis = async (filtros = {}) => {
    carregandoArquivos.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/downloads/vr/status', {
        method: 'GET',
        headers: await getAuthHeaders()
      })

      arquivosDisponiveis.value = filtrarArquivosVr(
        Array.isArray(data?.downloadedFiles) ? data.downloadedFiles : [],
        filtros
      )

      return arquivosDisponiveis.value
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao listar arquivos baixados da VR.')
      throw new Error(erro.value)
    } finally {
      carregandoArquivos.value = false
    }
  }

  const importarVendas = async (payload = {}) => {
    carregando.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/vr/vendas/processar', {
        method: 'POST',
        body: payload,
        headers: await getAuthHeaders()
      })

      return data
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao processar vendas da VR.')
      throw new Error(erro.value)
    } finally {
      carregando.value = false
    }
  }

  const resumoArquivos = computed(() => {
    return {
      total: arquivosDisponiveis.value.length,
      comDataReferencia: arquivosDisponiveis.value.filter(item => !!item.referenceDate).length
    }
  })

  return {
    carregandoArquivos,
    carregando,
    erro,
    arquivosDisponiveis,
    resumoArquivos,
    carregarArquivosDisponiveis,
    importarVendas
  }
}
