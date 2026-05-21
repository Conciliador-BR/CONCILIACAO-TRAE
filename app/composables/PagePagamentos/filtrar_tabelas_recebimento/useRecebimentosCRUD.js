import { ref } from 'vue'
const __recebimentosCache = new Map()
const dadosRecebimentos = ref([])
const loadingState = ref(false)
const errorState = ref(null)
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'

export const useRecebimentosCRUD = () => {
  const cacheTtlMs = 30000
  const { filtrosGlobais } = useEmpresaHelpers()
  const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()

  const fetchRecebimentos = async () => {
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
        empresaSelecionada: filtrosGlobais.empresaSelecionada || '',
        dataInicial: filtrosData.dataInicial || '',
        dataFinal: filtrosData.dataFinal || ''
      })
      const cacheEntry = __recebimentosCache.get(chave)
      if (cacheEntry && (Date.now() - cacheEntry.timestamp) < cacheTtlMs) {
        dadosRecebimentos.value = cacheEntry.data
        return cacheEntry.data
      }

      if (!filtrosGlobais.empresaSelecionada) {
        __recebimentosCache.set(chave, { data: [], timestamp: Date.now() })
        dadosRecebimentos.value = []
        return []
      }
      allData = await buscarEmpresaEspecifica(filtrosData)

      __recebimentosCache.set(chave, { data: allData, timestamp: Date.now() })
      dadosRecebimentos.value = allData
      return allData
    } catch (err) {
      errorState.value = err.message
      throw err
    } finally {
      loadingState.value = false
    }
  }

  return {
    dadosRecebimentos,
    loading: loadingState,
    error: errorState,
    fetchRecebimentos
  }
}
