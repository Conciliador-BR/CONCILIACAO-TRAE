import { watch } from 'vue'
import { useSecureLogger } from '~/composables/useSecureLogger'
import { useEstadosBasicos } from './useEstadosBasicos'
import { useBuscaVendasSupabase } from './useBuscaVendasSupabase'
import { useProcessamentoDados } from './useProcessamentoDados'
import { useCalculosTotais } from './useCalculosTotais'
import { usePaginacao } from './usePaginacao'
import { useFiltros } from './useFiltros'
import { useFormatacaoDados } from './useFormatacaoDados'

export const useBuscaVendasPrevistas = () => {
  const { logSecure } = useSecureLogger()
  
  // Importar todos os composables
  const estados = useEstadosBasicos()
  const { fetchVendasSupabase } = useBuscaVendasSupabase()
  const { processarDadosVendas, agruparDadosVendas, ordenarMovimentacoesPorData } = useProcessamentoDados()
  const totais = useCalculosTotais(estados)
  const paginacao = usePaginacao(estados, totais)
  const filtros = useFiltros()
  const { formatarData } = useFormatacaoDados()

  // Função principal para buscar movimentações
  const fetchMovimentacoes = async (filtrosBusca = {}) => {
    try {
      estados.loading.value = true
      estados.error.value = null
      
      // Buscar dados diretamente do Supabase
      const dadosVendas = await fetchVendasSupabase(filtrosBusca, estados)
      
      if (dadosVendas.length === 0) {
        estados.movimentacoes.value = []
        return []
      }
      
      // Agrupar por data_venda formatada e adquirente
      const dadosAgrupados = agruparDadosVendas(dadosVendas)
      
      // Converter para array e ordenar por data
      const movimentacoesArray = ordenarMovimentacoesPorData(Object.values(dadosAgrupados))
      
      estados.movimentacoes.value = movimentacoesArray
      
      return movimentacoesArray
    } catch (err) {
      estados.error.value = err.message || 'Erro ao processar movimentações'
      logSecure(`❌ Erro ao processar movimentações: ${err.message}`)
      return []
    } finally {
      estados.loading.value = false
    }
  }

  // Funções CRUD (mantendo compatibilidade)
  const updateMovimentacao = async (id, dados) => {
    // Implementar se necessário
  }
  
  const deleteMovimentacao = async (id) => {
    // Implementar se necessário
  }

  // Configurar filtros com as funções corretas
  const filtrarVendasPorDataWrapper = (dataClicada) => {
    return filtros.filtrarVendasPorData(dataClicada, fetchMovimentacoes)
  }

  const aplicarFiltrosGlobaisWrapper = (dadosFiltros) => {
    return filtros.aplicarFiltrosGlobais(dadosFiltros, fetchMovimentacoes)
  }

  const configurarListenerGlobal = () => {
    return filtros.configurarListenerGlobal(aplicarFiltrosGlobaisWrapper)
  }

  return {
    // Estados
    movimentacoes: estados.movimentacoes,
    paginatedMovimentacoes: totais.dadosPaginados, // Dados paginados para compatibilidade
    vendas: estados.vendas,
    vendasOriginais: estados.vendasOriginais,
    loading: estados.loading,
    error: estados.error,
    
    // Paginação
    currentPage: estados.currentPage,
    itemsPerPage: estados.itemsPerPage,
    totalMovimentacoes: totais.totalItems, // Alias para compatibilidade
    totalItems: totais.totalItems,
    totalPages: totais.totalPages,
    availablePageSizes: estados.availablePageSizes,
    
    // Totais
    totalCreditos: totais.totalCreditos,
    totalDebitos: totais.totalDebitos,
    saldoTotal: totais.saldoTotal,
    mediaCreditos: totais.mediaCreditos,
    totalGeralPrevisto: totais.totalGeralPrevisto,
    totalDiasComPrevisao: totais.totalDiasComPrevisao,
    totalVendasPrevistas: totais.totalVendasPrevistas,
    
    // Métodos
    fetchMovimentacoes,
    processarDadosVendas: () => processarDadosVendas(estados),
    setPage: paginacao.setPage,
    setItemsPerPage: paginacao.setItemsPerPage,
    updateMovimentacao,
    deleteMovimentacao,
    formatarData,
    filtrarVendasPorData: filtrarVendasPorDataWrapper,
    aplicarFiltrosGlobais: aplicarFiltrosGlobaisWrapper,
    configurarListenerGlobal
  }
}