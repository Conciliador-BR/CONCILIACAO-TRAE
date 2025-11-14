import { ref } from 'vue'
import { usePagamentosMapping } from './usePagamentosMapping'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useAllCompaniesDataFetcher } from './useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'

export const usePagamentosCRUD = () => {
  const loading = ref(false)
  const error = ref(null)
  const { mapFromDatabase } = usePagamentosMapping()
  const { filtrosGlobais } = useEmpresaHelpers()
  const { buscarTodasEmpresas } = useAllCompaniesDataFetcher()
  const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()

  const fetchPagamentos = async (filtros = {}) => {
    try {
      loading.value = true
      error.value = null
      
      
      
      // Preparar filtros completos incluindo datas dos filtros globais
      const filtrosCompletos = {
        ...filtros,
        dataInicial: filtros.dataInicial || filtrosGlobais.dataInicial,
        dataFinal: filtros.dataFinal || filtrosGlobais.dataFinal
      }
      
      
      
      let vendasCarregadas = []
      
      // Verificar se é "todas as empresas" ou empresa específica
      const empresaId = filtrosGlobais.empresaSelecionada
      const isTodasEmpresas = !empresaId || 
                             empresaId === '' || 
                             empresaId === 'todas' ||
                             empresaId === null ||
                             empresaId === undefined
      
      
      
      if (isTodasEmpresas) {
        vendasCarregadas = await buscarTodasEmpresas(filtrosCompletos)
      } else {
        vendasCarregadas = await buscarEmpresaEspecifica(filtrosCompletos)
      }
      
      // Mapear dados para formato padrão
      const vendasMapeadas = vendasCarregadas.map(venda => mapFromDatabase(venda))
      
      return vendasMapeadas
      
    } catch (err) {
      error.value = err.message || 'Erro ao carregar pagamentos'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchPagamentos
  }
}