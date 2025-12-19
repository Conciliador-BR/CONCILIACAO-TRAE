import { watch } from 'vue'
import { useSecureLogger } from '~/composables/useSecureLogger'
import { useEstadosBasicos } from './useEstadosBasicos'
import { useBuscaVendasSupabase } from './useBuscaVendasSupabase'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { useProcessamentoDados } from './useProcessamentoDados'
import { useCalculosTotais } from './useCalculosTotais'
import { usePaginacao } from './usePaginacao'
import { useFiltros } from './useFiltros'
import { useFormatacaoDados } from './useFormatacaoDados'
import { useDepositosExtrato } from './useDepositosExtrato'
import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

export const useBuscaVendasPrevistas = () => {
  const { log: logSecure } = useSecureLogger()
  const { empresaSelecionada } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()
  
  // Importar todos os composables
  const estados = useEstadosBasicos()
  const { fetchVendasSupabase } = useBuscaVendasSupabase()
  const { processarDadosVendas, agruparDadosVendas, agruparDadosRecebimentos, ordenarMovimentacoesPorData } = useProcessamentoDados()
  const { fetchRecebimentos } = useRecebimentosCRUD()
  const totais = useCalculosTotais(estados)
  const paginacao = usePaginacao(estados, totais)
  const filtros = useFiltros()
  const { formatarData } = useFormatacaoDados()
  const depositosExtrato = useDepositosExtrato()

  // Função principal para buscar movimentações
  const fetchMovimentacoes = async (filtrosBusca = {}, forcarRecarregamento = false) => {
    try {
      // Verificar se precisa recarregar dados
      const empresaAtual = empresaSelecionada.value
      const dataInicial = filtrosGlobais.dataInicial
      const dataFinal = filtrosGlobais.dataFinal
      
      // Se foi forçado o recarregamento, marcar no estado
      if (forcarRecarregamento) {
        estados.forcarRecarregamentoDados()
      }
      
      // Verificar se precisa recarregar
      const precisaRecarregar = estados.precisaRecarregar(empresaAtual, dataInicial, dataFinal)
      
      if (!precisaRecarregar) {
        return estados.movimentacoes.value
      }
      
      estados.loading.value = true
      estados.error.value = null
      
      // Preparar filtros com dados globais (priorizando os filtros passados se existirem)
      const filtrosCompletos = {
        ...filtrosBusca,
        dataInicial: filtrosBusca.dataInicial || dataInicial,
        dataFinal: filtrosBusca.dataFinal || dataFinal
      }
      
      // Buscar recebimentos diretamente do Supabase (usar data_recebimento)
      const dadosRecebimentos = await fetchRecebimentos()
      
      // Carregar dados do extrato detalhado para calcular depósitos (só se necessário)
      if (!depositosExtrato.temDadosCarregados.value || forcarRecarregamento) {
        await depositosExtrato.carregarDadosExtrato(filtrosCompletos)
      }
      
      if (dadosRecebimentos.length === 0) {
        estados.movimentacoes.value = []
        return []
      }
      
      // Agrupar por data_recebimento e adquirente
      const dadosAgrupados = agruparDadosRecebimentos(dadosRecebimentos)
      
      // Buscar depósitos agrupados do extrato
      const depositosAgrupados = depositosExtrato.buscarDepositosAgrupadosPorData(dataInicial, dataFinal)

      // Criar um conjunto de todas as chaves únicas (Data + Adquirente)
      const todasChaves = new Set([
        ...Object.keys(dadosAgrupados),
        ...Object.keys(depositosAgrupados)
      ])

      // Converter para array processando cada chave
      const movimentacoesArray = Array.from(todasChaves).map(chave => {
        const dadosVenda = dadosAgrupados[chave] || {}
        const dadosDeposito = depositosAgrupados[chave] || {}

        // Dados base (priorizar venda, senão depósito)
        const data = dadosVenda.data || dadosDeposito.data
        const adquirente = dadosVenda.adquirente || dadosDeposito.adquirente
        const empresa = dadosVenda.empresa || empresaAtual

        // Valores
        const prev = Number(dadosVenda.previsto || 0)
        const debAnt = Number(dadosVenda.debitosAntecipacao || 0)
        
        // Adicionar débitos do extrato (ex: aluguel POS) aos débitos existentes
        const debExtrato = Number(dadosDeposito.totalDebitos || 0)
        const deb = Number(dadosVenda.debitos || 0) + debExtrato
        
        const dep = Number(dadosDeposito.totalDepositos || 0) // Usar total do agrupamento
        
        // Novo cálculo: saldo = previsto - debitosAntecipacao - debitos - deposito
        const saldoCalculado = prev - debAnt - deb - dep
        
        // Determinar status baseado nas regras
        let statusCalculado = 'Pendente'
        
        // Regra 3: Se não tem depósito, status = Pendente (fundo amarelo)
        if (!dep || dep === 0) {
          statusCalculado = 'Pendente'
        } else {
          // Regra 2: Status baseado na diferença do saldo
          const diferenca = Math.abs(saldoCalculado)
          
          if (diferenca <= 0.50) {
            // Zerado ou até 0,50 centavos = Consistente (fundo verde claro)
            statusCalculado = 'Consistente'
          } else {
            // Acima de 0,50 = Inconsistente (fundo vermelho)
            statusCalculado = 'Inconsistente'
          }
        }
        
        return {
          id: dadosVenda.id || `ext_${chave}`,
          empresa,
          banco: 'BANCO PADRÃO',
          agencia: '0001',
          conta: '12345-6',
          data,
          adquirente,
          previsto: prev,
          debitosAntecipacao: debAnt,
          debitos: deb,
          deposito: dep,
          saldoConciliacao: saldoCalculado,
          status: statusCalculado,
          quantidadeRecebimentos: dadosVenda.quantidadeRecebimentos || 0,
          quantidadeTransacoes: dadosDeposito.quantidadeTransacoes || 0
        }
      })
      
      // Ordenar por data
      const movimentacoesOrdenadas = ordenarMovimentacoesPorData(movimentacoesArray)
      
      estados.movimentacoes.value = movimentacoesOrdenadas
      
      // Marcar dados como carregados no cache
      estados.marcarDadosCarregados(empresaAtual, dataInicial, dataFinal)
      
      return movimentacoesOrdenadas
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

  // Função para forçar recarregamento (chamada pelo botão aplicar filtro)
  const forcarRecarregamentoDados = async (filtrosBusca = {}) => {
    return await fetchMovimentacoes(filtrosBusca, true)
  }

  // Configurar filtros com as funções corretas
  const filtrarVendasPorDataWrapper = (dataClicada) => {
    return filtros.filtrarVendasPorData(dataClicada, fetchMovimentacoes)
  }

  const aplicarFiltrosGlobaisWrapper = (dadosFiltros) => {
    // Usar a função que força recarregamento para filtros globais
    return filtros.aplicarFiltrosGlobais(dadosFiltros, forcarRecarregamentoDados)
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
    
    // Estados de depósitos
    temDadosExtrato: depositosExtrato.temDadosCarregados,
    totalDepositosPeriodo: depositosExtrato.totalDepositosPeriodo,
    
    // Métodos
    fetchMovimentacoes,
    forcarRecarregamentoDados,
    processarDadosVendas: () => processarDadosVendas(estados),
    setPage: paginacao.setPage,
    setItemsPerPage: paginacao.setItemsPerPage,
    updateMovimentacao,
    deleteMovimentacao,
    formatarData,
    filtrarVendasPorData: filtrarVendasPorDataWrapper,
    aplicarFiltrosGlobais: aplicarFiltrosGlobaisWrapper,
    configurarListenerGlobal,
    
    // Métodos de cache
    precisaRecarregar: estados.precisaRecarregar,
    marcarDadosCarregados: estados.marcarDadosCarregados,
    limparCache: estados.limparCache,
    
    // Estados de cache
    dadosCarregados: estados.dadosCarregados,
    
    // Métodos de depósitos
    buscarDepositosPorDataAdquirente: depositosExtrato.buscarDepositosPorDataAdquirente,
    buscarDepositosAgrupadosPorData: depositosExtrato.buscarDepositosAgrupadosPorData,
    carregarDadosExtrato: depositosExtrato.carregarDadosExtrato
  }
}
