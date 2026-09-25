import { ref } from 'vue'
const __recebimentosCache = new Map()
const dadosRecebimentos = ref([])
const loadingState = ref(false)
const errorState = ref(null)
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'
import { useAuth } from '~/composables/useAuth'
import { createSingleFlight } from '~/utils/singleFlight'

const carregarRecebimentosCompartilhados = createSingleFlight()
let versaoCarga = 0
export const recebimentosDataVersion = ref(0)

export const invalidateRecebimentosCache = () => {
  __recebimentosCache.clear()
  versaoCarga += 1
  recebimentosDataVersion.value += 1
}

export const useRecebimentosCRUD = () => {
  const cacheTtlMs = 30000
  const { filtrosGlobais } = useEmpresaHelpers()
  const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()
  const { user } = useAuth()
  const obterContexto = () => JSON.stringify([
    user.value?.id || '',
    filtrosGlobais.empresaSelecionada || '',
    filtrosGlobais.dataInicial || '',
    filtrosGlobais.dataFinal || filtrosGlobais.dataInicial || ''
  ])

  const fetchRecebimentos = async (forceReload = false) => {
    const versao = ++versaoCarga
    const contexto = obterContexto()
    const usarCache = process.client && Boolean(user.value?.id)
    loadingState.value = true
    errorState.value = null

    try {
      // Apoiar filtro de “um dia só”: se não houver dataFinal, usar dataInicial
      const ini = filtrosGlobais.dataInicial || ''
      const fin = filtrosGlobais.dataFinal || ini || ''

      const filtrosData = {
        dataInicial: ini,
        dataFinal: fin
      }

      let allData = []

      const chave = JSON.stringify({
        usuario: user.value?.id || '',
        empresaSelecionada: filtrosGlobais.empresaSelecionada || '',
        dataInicial: filtrosData.dataInicial || '',
        dataFinal: filtrosData.dataFinal || ''
      })
      const cacheEntry = __recebimentosCache.get(chave)
      if (usarCache && !forceReload && !carregarRecebimentosCompartilhados.has(chave) && cacheEntry && (Date.now() - cacheEntry.timestamp) < cacheTtlMs) {
        dadosRecebimentos.value = cacheEntry.data
        return cacheEntry.data
      }

      if (!filtrosGlobais.empresaSelecionada) {
        dadosRecebimentos.value = []
        return []
      }
      allData = usarCache
        ? await carregarRecebimentosCompartilhados(chave, () => buscarEmpresaEspecifica(filtrosData))
        : await buscarEmpresaEspecifica(filtrosData)
      if (versao !== versaoCarga || contexto !== obterContexto()) return allData

      if (usarCache) {
        __recebimentosCache.delete(chave)
        __recebimentosCache.set(chave, { data: allData, timestamp: Date.now() })
        while (__recebimentosCache.size > 3) {
          __recebimentosCache.delete(__recebimentosCache.keys().next().value)
        }
      }
      dadosRecebimentos.value = allData
      return allData
    } catch (err) {
      if (versao === versaoCarga) errorState.value = err.message
      throw err
    } finally {
      if (versao === versaoCarga) loadingState.value = false
    }
  }

  return {
    dadosRecebimentos,
    loading: loadingState,
    error: errorState,
    fetchRecebimentos
  }
}
