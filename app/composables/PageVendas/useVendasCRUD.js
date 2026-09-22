import { ref } from 'vue'
import { useVendasMapping } from './useVendasMapping'
import { useEmpresaHelpers } from './filtrar_tabelas/useEmpresaHelpers'
import { useSpecificCompanyDataFetcher } from './filtrar_tabelas/useSpecificCompanyDataFetcher'
import { useVendasCRUDOperations } from './filtrar_tabelas/useVendasCRUDOperations'
import { useAuth } from '../useAuth'
import { createSingleFlight } from '~/utils/singleFlight'

const carregarVendasCompartilhadas = createSingleFlight()

const VENDAS_LIST_COLUMNS = [
  'id',
  'data_venda',
  'modalidade',
  'nsu',
  'valor_bruto',
  'valor_liquido',
  'taxa_mdr',
  'despesa_mdr',
  'numero_parcelas',
  'bandeira',
  'valor_antecipacao',
  'despesa_antecipacao',
  'valor_liquido_antecipacao',
  'empresa',
  'matriz',
  'adquirente',
  'previsao_pgto',
  'auditoria'
].join(', ')

// Buscar vendas com filtro por empresa e EC
export const useVendasCRUD = () => {
  const loading = ref(false)
  const error = ref(null)
  const { mapFromDatabase } = useVendasMapping()
  const { filtrosGlobais } = useEmpresaHelpers()
  const { user } = useAuth()
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
        dataFinal: filtrosGlobais.dataFinal,
        columns: VENDAS_LIST_COLUMNS
      }
      
      let allData = []
      
      // Sem empresa selecionada nao faz varredura global.
      if (!filtrosGlobais.empresaSelecionada) return []
      const carregar = async () => {
        allData = await buscarEmpresaEspecifica(filtrosData)
        return allData.map(mapFromDatabase)
      }
      // Never share request data between SSR requests or unauthenticated sessions.
      if (!process.client || !user.value?.id) return await carregar()
      const chave = JSON.stringify([user.value.id, filtrosGlobais.empresaSelecionada, filtrosData])
      return await carregarVendasCompartilhadas(chave, carregar)
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
