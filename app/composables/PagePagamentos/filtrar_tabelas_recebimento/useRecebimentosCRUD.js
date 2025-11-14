import { ref } from 'vue'
const __recebimentosCache = new Map()
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useAllCompaniesDataFetcher } from './useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'

export const useRecebimentosCRUD = () => {
  const loading = ref(false)
  const error = ref(null)
  const { filtrosGlobais } = useEmpresaHelpers()
  const { buscarTodasEmpresas } = useAllCompaniesDataFetcher()
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

      const isTodasEmpresas = !filtrosGlobais.empresaSelecionada
      const chave = JSON.stringify({
        empresaSelecionada: filtrosGlobais.empresaSelecionada || '',
        dataInicial: filtrosData.dataInicial || '',
        dataFinal: filtrosData.dataFinal || ''
      })
      if (__recebimentosCache.has(chave)) {
        return __recebimentosCache.get(chave)
      }

      if (isTodasEmpresas) {
        allData = await buscarTodasEmpresas(filtrosData)
      } else {
        allData = await buscarEmpresaEspecifica(filtrosData)
      }

      __recebimentosCache.set(chave, allData)
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