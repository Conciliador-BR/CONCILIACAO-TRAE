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
    console.log('🚀 === INICIANDO FETCH VENDAS ===')
    console.log('📋 Filtros globais no início:', filtrosGlobais)
    console.log('🎯 Empresa selecionada:', filtrosGlobais.empresaSelecionada)
    console.log('🔍 Tipo da empresa selecionada:', typeof filtrosGlobais.empresaSelecionada)
    console.log('📏 Comprimento da empresa selecionada:', filtrosGlobais.empresaSelecionada?.length)
    
    loading.value = true
    error.value = null

    try {
      let allData = []
      
      // Verificar se "Todas as Empresas" está selecionado (empresaSelecionada vazio)
      if (!filtrosGlobais.empresaSelecionada) {
        console.log('🌍 === BUSCANDO TODAS AS EMPRESAS ===')
        allData = await buscarTodasEmpresas()
      } else {
        console.log('🏢 === BUSCANDO EMPRESA ESPECÍFICA ===')
        console.log('🎯 ID da empresa para busca específica:', filtrosGlobais.empresaSelecionada)
        // Lógica para empresa específica
        allData = await buscarEmpresaEspecifica()
      }

      console.log(`✅ Total de vendas carregadas: ${allData.length}`)
      const vendasMapeadas = allData.map(mapFromDatabase)
      console.log(`📊 Total de vendas mapeadas: ${vendasMapeadas.length}`)
      return vendasMapeadas
    } catch (err) {
      console.error('❌ Erro no fetchVendas:', err)
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