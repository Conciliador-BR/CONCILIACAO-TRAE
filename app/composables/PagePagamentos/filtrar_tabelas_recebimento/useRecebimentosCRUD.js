import { ref } from 'vue'
const __recebimentosCache = new Map()
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'

export const useRecebimentosCRUD = () => {
  const cacheTtlMs = 30000
  const loading = ref(false)
  const error = ref(null)
  const { filtrosGlobais } = useEmpresaHelpers()
  const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()

  const fetchRecebimentos = async () => {
    loading.value = true
    error.value = null

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
        return cacheEntry.data
      }

      if (!filtrosGlobais.empresaSelecionada) {
        __recebimentosCache.set(chave, { data: [], timestamp: Date.now() })
        return []
      }
      allData = await buscarEmpresaEspecifica(filtrosData)

      __recebimentosCache.set(chave, { data: allData, timestamp: Date.now() })
      return allData
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchRecebimentos
  }
}
