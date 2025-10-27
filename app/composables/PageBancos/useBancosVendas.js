import { ref, computed, watch } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useSecureLogger } from '~/composables/useSecureLogger'

export const useBancosVendas = () => {
  const { error: logError } = useSecureLogger()
  
  // Usar dados compartilhados da página vendas
  const { vendas, vendasOriginais, loading: vendasLoading, error: vendasError } = useVendas()
  
  // Estados reativos locais
  const movimentacoes = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Estados para paginação
  const currentPage = ref(1)
  const itemsPerPage = ref(30)
  const availablePageSizes = [10, 20, 30, 50, 100]
  
  // Função para normalizar data para formato DD/MM/YYYY
  const formatarData = (data) => {
    if (!data) return null
    
    try {
      // Se já está no formato DD/MM/YYYY, retornar como está
      if (typeof data === 'string' && data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return data
      }
      
      // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
      }
      
      // Se é um objeto Date, converter
      const dateObj = new Date(data)
      if (!isNaN(dateObj.getTime())) {
        const dia = String(dateObj.getDate()).padStart(2, '0')
        const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
        const ano = dateObj.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
      
      return null
    } catch (error) {
      return null
    }
  }
  
  // Função para processar dados de vendas para movimentações bancárias
  const processarDadosVendas = () => {
    // Usar dados de vendas já carregados
    const dadosVendas = vendas.value || vendasOriginais.value || []
    
    if (dadosVendas.length === 0) {
      movimentacoes.value = []
      return []
    }
    
    // Filtrar apenas vendas que têm previsão de pagamento
    const vendasComPrevisao = dadosVendas.filter(venda => 
      venda.previsaoPgto || venda.previsao_pgto || venda.dataPrevisao
    )
    
    if (vendasComPrevisao.length === 0) {
      movimentacoes.value = []
      return []
    }
    
    // Agrupar por data de previsão e adquirente
    const dadosAgrupados = {}
    
    vendasComPrevisao.forEach((venda, index) => {
      const dataPrevisao = venda.previsaoPgto || venda.previsao_pgto || venda.dataPrevisao
      const dataPrevisaoFormatada = formatarData(dataPrevisao)
      const adquirente = venda.adquirente || venda.bandeira || 'Não informado'
      const chave = `${dataPrevisaoFormatada}_${adquirente}`
      
      if (!dataPrevisaoFormatada) {
        return
      }
      
      if (!dadosAgrupados[chave]) {
        dadosAgrupados[chave] = {
          id: `banco_${index}`,
          empresa: venda.empresa || '',
          banco: 'BANCO PADRÃO', // Valor padrão
          agencia: '0001', // Valor padrão
          conta: '12345-6', // Valor padrão
          data: dataPrevisaoFormatada,
          adquirente: adquirente,
          previsto: 0, // Soma das vendas líquidas
          debitos: 0,
          deposito: 0,
          saldoConciliacao: 0,
          status: 'Pendente'
        }
      }
      
      // Somar valor líquido para o previsto
      const valorLiquido = parseFloat(venda.vendaLiquida || venda.valor_liquido || 0)
      dadosAgrupados[chave].previsto += valorLiquido
    })
    
    // Converter objeto agrupado em array
    const movimentacoesProcessadas = Object.values(dadosAgrupados)
    
    // Calcular saldo de conciliação (previsto - débitos + depósito)
    movimentacoesProcessadas.forEach(mov => {
      mov.saldoConciliacao = mov.previsto - mov.debitos + mov.deposito
    })
    
    // Ordenar por data (mais recente primeiro)
    movimentacoesProcessadas.sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/')
      const [diaB, mesB, anoB] = b.data.split('/')
      const dataA = new Date(anoA, mesA - 1, diaA)
      const dataB = new Date(anoB, mesB - 1, diaB)
      return dataB - dataA
    })
    
    movimentacoes.value = movimentacoesProcessadas
    return movimentacoesProcessadas
  }
  
  // Função para buscar movimentações (mantendo compatibilidade)
  const fetchMovimentacoes = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Processar dados de vendas já carregados
      const dados = processarDadosVendas()
      
      return dados
      
    } catch (err) {
      error.value = `Erro ao processar dados: ${err.message}`
      logError('useBancosVendas', 'fetchMovimentacoes', err)
      movimentacoes.value = []
      return []
      
    } finally {
      loading.value = false
    }
  }
  
  // Computed para dados paginados
  const dadosPaginados = computed(() => {
    const inicio = (currentPage.value - 1) * itemsPerPage.value
    const fim = inicio + itemsPerPage.value
    return movimentacoes.value.slice(inicio, fim)
  })
  
  // Computed para totais
  const totalItems = computed(() => movimentacoes.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  
  const totalCreditos = computed(() => {
    return movimentacoes.value.reduce((total, mov) => total + (mov.deposito || 0), 0)
  })
  
  const totalDebitos = computed(() => {
    return movimentacoes.value.reduce((total, mov) => total + (mov.debitos || 0), 0)
  })
  
  const saldoTotal = computed(() => {
    return movimentacoes.value.reduce((total, mov) => total + (mov.saldoConciliacao || 0), 0)
  })
  
  const mediaCreditos = computed(() => {
    const creditos = movimentacoes.value.filter(mov => mov.deposito > 0)
    if (creditos.length === 0) return 0
    return totalCreditos.value / creditos.length
  })
  
  // Novos campos para o footer
  const totalGeralPrevisto = computed(() => {
    return movimentacoes.value.reduce((total, mov) => total + (mov.previsto || 0), 0)
  })
  
  const totalDiasComPrevisao = computed(() => {
    const datasUnicas = new Set(movimentacoes.value.map(mov => mov.data))
    return datasUnicas.size
  })
  
  const totalVendasPrevistas = computed(() => {
    return movimentacoes.value.reduce((total, mov) => total + (mov.quantidadeVendas || 0), 0)
  })
  
  // Funções de paginação
  const setPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  const setItemsPerPage = (items) => {
    itemsPerPage.value = items
    currentPage.value = 1 // Resetar para primeira página
  }
  
  // Funções CRUD (mantendo compatibilidade)
  const updateMovimentacao = async (id, dados) => {
    // Implementar se necessário
  }
  
  const deleteMovimentacao = async (id) => {
    // Implementar se necessário
  }
  
  // Watchers para sincronização automática
  watch([vendas, vendasOriginais], () => {
    processarDadosVendas()
  }, { immediate: true })
  
  // Sincronizar loading e error states
  watch(vendasLoading, (newLoading) => {
    loading.value = newLoading
  })
  
  watch(vendasError, (newError) => {
    error.value = newError
  })
  
  return {
    // Estados
    loading,
    error,
    movimentacoes: dadosPaginados, // Retornar dados paginados
    
    // Paginação
    currentPage,
    itemsPerPage,
    totalMovimentacoes: totalItems, // Alias para compatibilidade
    totalItems,
    totalPages,
    availablePageSizes,
    
    // Totais
    totalCreditos,
    totalDebitos,
    saldoTotal,
    mediaCreditos,
    totalGeralPrevisto,
    totalDiasComPrevisao,
    totalVendasPrevistas,
    
    // Métodos
    fetchMovimentacoes,
    processarDadosVendas,
    setPage,
    setItemsPerPage,
    updateMovimentacao,
    deleteMovimentacao,
    formatarData
  }
}