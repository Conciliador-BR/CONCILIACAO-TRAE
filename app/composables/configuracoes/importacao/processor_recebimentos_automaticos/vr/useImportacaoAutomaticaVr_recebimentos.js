import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useImportacaoAutomaticaVrRecebimentos = () => {
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

  const carregarArquivosDisponiveis = async () => {
    carregandoArquivos.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/downloads/vr/status', {
        method: 'GET',
        headers: await getAuthHeaders()
      })

      arquivosDisponiveis.value = Array.isArray(data?.downloadedFiles)
        ? data.downloadedFiles.filter(item => String(item?.fileName || '').toLowerCase().endsWith('.txt'))
        : []

      return arquivosDisponiveis.value
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao listar arquivos baixados da VR.')
      throw new Error(erro.value)
    } finally {
      carregandoArquivos.value = false
    }
  }

  const importarRecebimentos = async (payload = {}) => {
    carregando.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/vr/recebimentos/processar', {
        method: 'POST',
        body: payload,
        headers: await getAuthHeaders()
      })

      return data
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao processar recebimentos da VR.')
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
    importarRecebimentos
  }
}
