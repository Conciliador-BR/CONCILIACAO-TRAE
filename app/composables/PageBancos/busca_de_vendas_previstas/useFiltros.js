import { useSecureLogger } from '~/composables/useSecureLogger'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

export const useFiltros = () => {
  const { log: logSecure } = useSecureLogger()
  const { filtrosGlobais, escutarEvento } = useGlobalFilters()

  // Função para filtrar vendas por data específica
  const filtrarVendasPorData = async (dataClicada, fetchMovimentacoes) => {
    try {
      logSecure(`🔍 Filtrando vendas por data: ${dataClicada}`)
      
      // Converter data de DD/MM/YYYY para YYYY-MM-DD
      const [dia, mes, ano] = dataClicada.split('/')
      const dataFormatada = `${ano}-${mes}-${dia}`
      
      // Aplicar filtro global de data
      filtrosGlobais.dataInicial = dataFormatada
      filtrosGlobais.dataFinal = dataFormatada
      
      // Buscar vendas com o filtro aplicado
      await fetchMovimentacoes({
        dataInicial: dataFormatada,
        dataFinal: dataFormatada
      })
      
      logSecure(`✅ Filtro de data aplicado: ${dataFormatada}`)
    } catch (err) {
      logSecure(`❌ Erro ao filtrar vendas por data: ${err.message}`)
    }
  }

  // Função para aplicar filtros globais recebidos
  const aplicarFiltrosGlobais = async (dadosFiltros, fetchMovimentacoes) => {
    try {
      logSecure('🔍 Aplicando filtros globais nas movimentações bancárias')
      
      // Buscar movimentações com os filtros aplicados
      await fetchMovimentacoes({
        dataInicial: dadosFiltros.dataInicial || '',
        dataFinal: dadosFiltros.dataFinal || ''
      })
      
      logSecure('✅ Filtros globais aplicados com sucesso')
    } catch (err) {
      logSecure(`❌ Erro ao aplicar filtros globais: ${err.message}`)
    }
  }

  // Função para configurar listener de eventos globais
  const configurarListenerGlobal = (aplicarFiltrosGlobais) => {
    const removeFiltrarBancos = escutarEvento('filtrar-bancos', aplicarFiltrosGlobais)
    
    return () => {
      removeFiltrarBancos()
    }
  }

  return {
    filtrarVendasPorData,
    aplicarFiltrosGlobais,
    configurarListenerGlobal
  }
}
