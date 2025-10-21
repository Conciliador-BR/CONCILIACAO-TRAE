import { ref } from 'vue'
import { useVendasMapping } from './useVendasMapping'
import { useEmpresaHelpers } from './filtrar_tabelas/useEmpresaHelpers'
import { useAllCompaniesDataFetcher } from './filtrar_tabelas/useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from './filtrar_tabelas/useSpecificCompanyDataFetcher'
import { useVendasCRUDOperations } from './filtrar_tabelas/useVendasCRUDOperations'

// Buscar vendas com filtro por empresa e EC
export const useVendasCRUD = () => {
  const loading = ref(false)
  const error = ref(null)
  const { mapFromDatabase } = useVendasMapping()
  const { filtrosGlobais } = useEmpresaHelpers()
  const { buscarTodasEmpresas } = useAllCompaniesDataFetcher()
  const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()
  const { 
    loading: crudLoading, 
    error: crudError, 
    createVenda, 
    updateVenda, 
    deleteVenda 
  } = useVendasCRUDOperations()

  const fetchVendas = async () => {
    loading.value = true
    error.value = null

    try {
      // Preparar filtros de data para passar para as funções de busca
      const filtrosData = {
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      }
      
      let allData = []
      
      // Verificar se "Todas as Empresas" está selecionado (empresaSelecionada vazio)
      if (!filtrosGlobais.empresaSelecionada) {
        allData = await buscarTodasEmpresas(filtrosData)
      } else {
        // Lógica para empresa específica
        allData = await buscarEmpresaEspecifica(filtrosData)
      }

      const vendasMapeadas = allData.map(mapFromDatabase)
      return vendasMapeadas
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
    fetchVendas,
    createVenda,
    updateVenda,
    deleteVenda,
    // Expor também os estados do CRUD
    crudLoading,
    crudError
  }
}