import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

const createDefaultStatus = () => ({
  config: null,
  lookup: {
    adquirente: 'alelo',
    empresaNome: '',
    ec: '',
    cnpj: ''
  },
  resumo: {
    totalArquivosRemotos: 0,
    totalArquivosProcessados: 0,
    totalSelecionados: 0,
    totalTransferidos: 0
  },
  remoteFiles: [],
  processedFiles: [],
  logTail: '',
  erros: {
    estrutura: '',
    remoto: '',
    processados: '',
    log: ''
  }
})

export const useAleloDownloads = () => {
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

  const mergeStatus = (data) => {
    status.value = {
      ...createDefaultStatus(),
      ...status.value,
      ...(data || {}),
      lookup: {
        ...createDefaultStatus().lookup,
        ...status.value.lookup,
        ...(data?.lookup || {})
      },
      resumo: {
        ...createDefaultStatus().resumo,
        ...status.value.resumo,
        ...(data?.resumo || {})
      },
      erros: {
        ...createDefaultStatus().erros,
        ...(data?.erros || {})
      }
    }
  }

  const carregarStatus = async (payload = {}) => {
    carregandoStatus.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/downloads/alelo/status', {
        method: 'GET',
        query: payload,
        headers: await getAuthHeaders()
      })
      mergeStatus(data)
      return status.value
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao carregar o status da Alelo.')
      throw new Error(erro.value)
    } finally {
      carregandoStatus.value = false
    }
  }

  const baixarArquivos = async (payload = {}) => {
    baixando.value = true
    erro.value = ''

    try {
      const data = await $fetch('/api/configuracoes/importacao/downloads/alelo/baixar', {
        method: 'POST',
        body: payload,
        headers: await getAuthHeaders()
      })
      mergeStatus(data)
      return data
    } catch (err) {
      erro.value = normalizeError(err, 'Falha ao transferir arquivos Alelo e NAIP.')
      throw new Error(erro.value)
    } finally {
      baixando.value = false
    }
  }

  return {
    status,
    erro,
    carregandoStatus,
    baixando,
    carregarStatus,
    baixarArquivos
  }
}
