import { ref } from 'vue'
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
      const filtrosData = {
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      }

      let allData = []

      const isTodasEmpresas = !filtrosGlobais.empresaSelecionada

      if (isTodasEmpresas) {
        allData = await buscarTodasEmpresas(filtrosData)
      } else {
        allData = await buscarEmpresaEspecifica(filtrosData)
      }

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