import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

const createDefaultStatus = () => ({
  config: null,
  resumo: {
    totalArquivosRemotos: 0,
    totalArquivosBaixados: 0
  },
  remoteFiles: [],
  downloadedFiles: [],
  logTail: '',
  erros: {
    estrutura: '',
    remoto: '',
    downloads: '',
    log: ''
  }
})

export const useVrDownloads = () => {
  const status = ref(createDefaultStatus())
  const carregandoStatus = ref(false)
  const baixando = ref(false)
  const erro = ref('')

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

  const carregarStatus = async () => {
    carregandoStatus.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/downloads/vr/status', {
        method: 'GET',
        headers: await getAuthHeaders()
      })

      status.value = {
        ...createDefaultStatus(),
        ...(data || {}),
        resumo: {
          ...createDefaultStatus().resumo,
          ...(data?.resumo || {})
        },
        erros: {
          ...createDefaultStatus().erros,
          ...(data?.erros || {})
        }
      }

      return status.value
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao carregar o status da VR.')
      throw new Error(erro.value)
    } finally {
      carregandoStatus.value = false
    }
  }

  const baixarArquivos = async (payload = {}) => {
    baixando.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/downloads/vr/baixar', {
        method: 'POST',
        body: payload,
        headers: await getAuthHeaders()
      })

      status.value = {
        ...status.value,
        downloadedFiles: Array.isArray(data?.downloadedFiles) ? data.downloadedFiles : status.value.downloadedFiles,
        logTail: String(data?.logTail || status.value.logTail || ''),
        resumo: {
          ...status.value.resumo,
          ...(data?.resumo || {})
        }
      }

      return data
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao baixar arquivos da VR.')
      throw new Error(erro.value)
    } finally {
      baixando.value = false
    }
  }

  const arquivosTxtBaixados = computed(() => {
    return (status.value.downloadedFiles || []).filter(item => String(item?.fileName || '').toLowerCase().endsWith('.txt'))
  })

  return {
    status,
    erro,
    carregandoStatus,
    baixando,
    arquivosTxtBaixados,
    carregarStatus,
    baixarArquivos
  }
}
