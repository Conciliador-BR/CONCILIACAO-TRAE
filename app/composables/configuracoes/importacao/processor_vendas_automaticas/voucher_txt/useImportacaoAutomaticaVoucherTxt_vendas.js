import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useImportacaoAutomaticaVoucherTxtVendas = () => {
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

  const normalizeError = (err, fallback) => String(err?.data?.statusMessage || err?.message || fallback)

  const parseDateInput = (value) => {
    const text = String(value || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
    return text.replace(/-/g, '')
  }

  const filtrarArquivos = (arquivos = [], filtros = {}) => {
    const cnpj = String(filtros?.cnpj || '').replace(/\D/g, '')
    const start = parseDateInput(filtros?.dataInicial)
    const end = parseDateInput(filtros?.dataFinal)

    return (arquivos || []).filter((item) => {
      const fileName = String(item?.fileName || '')
      const originalStem = String(item?.originalStem || '')
      const referenceDate = String(item?.referenceDate || '')
      const cnpjFolder = String(item?.cnpjFolder || '').replace(/\D/g, '')

      if (!fileName.toLowerCase().endsWith('.txt')) return false
      if (cnpj && cnpjFolder && cnpjFolder !== cnpj) return false
      if (cnpj && !cnpjFolder && !originalStem.includes(cnpj)) return false
      if (start && referenceDate && referenceDate < start) return false
      if (end && referenceDate && referenceDate > end) return false
      if ((start || end) && !referenceDate) return false
      return true
    })
  }

  const carregarArquivosDisponiveis = async (adquirente, filtros = {}) => {
    carregandoArquivos.value = true
    erro.value = ''

    try {
      const data = await $fetch(`/api/configuracoes/importacao/downloads/${adquirente}/status`, {
        method: 'GET',
        headers: await getAuthHeaders(),
        query: {
          empresaNome: String(filtros?.empresaNome || '').trim(),
          ec: String(filtros?.ec || '').trim(),
          cnpj: String(filtros?.cnpj || '').replace(/\D/g, '')
        }
      })

      arquivosDisponiveis.value = filtrarArquivos(
        Array.isArray(data?.processedFiles) ? data.processedFiles : [],
        filtros
      )

      return arquivosDisponiveis.value
    } catch (err) {
      erro.value = normalizeError(err, `Falha ao listar arquivos de ${adquirente}.`)
      throw new Error(erro.value)
    } finally {
      carregandoArquivos.value = false
    }
  }

  const importarVendas = async (adquirente, payload = {}) => {
    carregando.value = true
    erro.value = ''

    try {
      return await $fetch(`/api/configuracoes/importacao/${adquirente}/vendas/processar`, {
        method: 'POST',
        body: payload,
        headers: await getAuthHeaders()
      })
    } catch (err) {
      erro.value = normalizeError(err, `Falha ao processar vendas de ${adquirente}.`)
      throw new Error(erro.value)
    } finally {
      carregando.value = false
    }
  }

  const resumoArquivos = computed(() => ({
    total: arquivosDisponiveis.value.length,
    comDataReferencia: arquivosDisponiveis.value.filter((item) => !!item.referenceDate).length
  }))

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
