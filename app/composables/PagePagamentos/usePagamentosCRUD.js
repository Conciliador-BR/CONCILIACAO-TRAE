import { ref } from 'vue'
import { usePagamentosMapping } from './usePagamentosMapping'
import { useEmpresaHelpers } from './filtrar_tabelas/useEmpresaHelpers'
import { useAllCompaniesDataFetcher } from './filtrar_tabelas/useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from './filtrar_tabelas/useSpecificCompanyDataFetcher'

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
      
      console.log('🔄 [PAGAMENTOS] === INICIANDO BUSCA DE PAGAMENTOS ===')
      console.log('📋 [PAGAMENTOS] Filtros recebidos:', filtros)
      console.log('🏢 [PAGAMENTOS] Empresa selecionada:', filtrosGlobais.empresaSelecionada)
      console.log('📅 [PAGAMENTOS] Filtros globais de data:', {
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      })
      
      // Preparar filtros completos incluindo datas dos filtros globais
      const filtrosCompletos = {
        ...filtros,
        dataInicial: filtros.dataInicial || filtrosGlobais.dataInicial,
        dataFinal: filtros.dataFinal || filtrosGlobais.dataFinal
      }
      
      console.log('📋 [PAGAMENTOS] Filtros completos a serem aplicados:', filtrosCompletos)
      
      let vendasCarregadas = []
      
      // Verificar se é "todas as empresas" ou empresa específica
      const empresaId = filtrosGlobais.empresaSelecionada
      const isTodasEmpresas = !empresaId || 
                             empresaId === '' || 
                             empresaId === 'todas' ||
                             empresaId === null ||
                             empresaId === undefined
      
      console.log('🔍 [PAGAMENTOS] Empresa ID:', empresaId)
      console.log('🔍 [PAGAMENTOS] Tipo:', typeof empresaId)
      console.log('🔍 [PAGAMENTOS] É todas as empresas?', isTodasEmpresas)
      
      if (isTodasEmpresas) {
        console.log('🌍 [PAGAMENTOS] Buscando TODAS as empresas com filtros:', filtrosCompletos)
        vendasCarregadas = await buscarTodasEmpresas(filtrosCompletos)
      } else {
        console.log('🏢 [PAGAMENTOS] Buscando empresa específica com filtros:', filtrosCompletos)
        vendasCarregadas = await buscarEmpresaEspecifica(filtrosCompletos)
      }
      
      console.log(`✅ [PAGAMENTOS] Total de vendas carregadas: ${vendasCarregadas.length}`)
      
      // Mapear dados para formato padrão
      const vendasMapeadas = vendasCarregadas.map(venda => mapFromDatabase(venda))
      
      console.log(`📊 [PAGAMENTOS] Vendas mapeadas: ${vendasMapeadas.length}`)
      
      return vendasMapeadas
      
    } catch (err) {
      console.error('❌ [PAGAMENTOS] Erro ao buscar pagamentos:', err)
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