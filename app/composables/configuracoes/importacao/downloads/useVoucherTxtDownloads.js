import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

const createDefaultStatus = () => ({
  config: null,
  lookup: {
    adquirente: '',
    label: '',
    credentialFieldLabel: '',
    empresaNome: '',
    ec: '',
    encontrouCredencial: false,
    remoteFileName: '',
    credencialId: null
  },
  resumo: {
    totalArquivosServidor: 0,
    totalArquivosProcessados: 0,
    totalSelecionados: 0,
    totalMovidos: 0
  },
  remoteFiles: [],
  downloadedFiles: [],
  processedFiles: [],
  logTail: '',
  erros: {
    estrutura: '',
    credencial: '',
    remoto: '',
    downloads: '',
    log: ''
  }
})

export const useVoucherTxtDownloads = () => {
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

  const carregarStatus = async (adquirente, payload = {}) => {
    carregandoStatus.value = true
    erro.value = ''

    try {
      const data = await $fetch(`/api/configuracoes/importacao/downloads/${adquirente}/status`, {
        method: 'GET',
        query: payload,
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
      erro.value = normalizeError(err, `Falha ao carregar o status de ${adquirente}.`)
      throw new Error(erro.value)
    } finally {
      carregandoStatus.value = false
    }
  }

  const baixarArquivos = async (adquirente, payload = {}) => {
    baixando.value = true
    erro.value = ''

    try {
      const data = await $fetch(`/api/configuracoes/importacao/downloads/${adquirente}/baixar`, {
        method: 'POST',
        body: payload,
        headers: await getAuthHeaders()
      })

      status.value = {
        ...status.value,
        lookup: {
          ...status.value.lookup,
          ...(data?.lookup || {})
        },
        downloadedFiles: Array.isArray(data?.downloadedFiles) ? data.downloadedFiles : status.value.downloadedFiles,
        processedFiles: Array.isArray(data?.processedFiles) ? data.processedFiles : status.value.processedFiles,
        logTail: String(data?.logTail || status.value.logTail || ''),
        resumo: {
          ...status.value.resumo,
          ...(data?.resumo || {})
        }
      }

      return data
    } catch (err) {
      erro.value = normalizeError(err, `Falha ao ler arquivos de ${adquirente}.`)
      throw new Error(erro.value)
    } finally {
      baixando.value = false
    }
  }

  const arquivosTxtDisponiveis = computed(() => {
    return (status.value.downloadedFiles || []).filter((item) => String(item?.fileName || '').toLowerCase().endsWith('.txt'))
  })

  return {
    status,
    erro,
    carregandoStatus,
    baixando,
    arquivosTxtDisponiveis,
    carregarStatus,
    baixarArquivos
  }
}
