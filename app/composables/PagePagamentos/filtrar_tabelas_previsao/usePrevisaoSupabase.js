import { ref, computed } from 'vue'
import { usePagamentosCRUD } from './usePagamentosCRUD'
import { usePagamentosFilters } from './usePagamentosFilters'
import { usePrevisaoColuna } from './usePrevisaoColuna'
import { useEmpresaHelpers } from './useEmpresaHelpers'

export const usePrevisaoSupabase = () => {
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const vendas = ref([])
  const vendasOriginais = ref([]) // Armazenar dados originais
  
  // Estados para paginação
  const currentPage = ref(1)
  const itemsPerPage = ref(30)
  const availablePageSizes = [10, 20, 30, 50, 100]
  
  // Usar os composables componentizados
  const {
    loading: crudLoading,
    error: crudError,
    fetchPagamentos
  } = usePagamentosCRUD()

  const {
    filtroAtivo,
    aplicarFiltros: aplicarFiltrosLogic,
    limparFiltros
  } = usePagamentosFilters()

  const { calcularPrevisaoVenda, inicializar } = usePrevisaoColuna()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  
  // Função para buscar vendas com controle de estado
  const fetchVendas = async (forceReload = false) => {
    console.log('🔄 [PAGAMENTOS] === FETCH VENDAS CHAMADO ===')
    console.log('📊 [PAGAMENTOS] Vendas originais atuais:', vendasOriginais.value.length)
    console.log('🔄 [PAGAMENTOS] Force reload:', forceReload)
    console.log('📅 [PAGAMENTOS] Filtros ativos:', filtroAtivo.value)
    
    // Se já temos dados carregados e não é um reload forçado, não recarregar
    if (vendasOriginais.value.length > 0 && !forceReload) {
      console.log('⚠️ [PAGAMENTOS] Dados já carregados, mantendo estado atual')
      return
    }
    
    try {
      console.log('🚀 [PAGAMENTOS] Buscando vendas do CRUD...')
      
      // Inicializar cálculo de previsões se necessário
      await inicializar()
      
      // Passar filtros de data para o fetchPagamentos
      const filtrosParaBusca = {
        dataInicial: filtroAtivo.value.dataInicial,
        dataFinal: filtroAtivo.value.dataFinal
      }
      
      console.log('📅 [PAGAMENTOS] Passando filtros para busca:', filtrosParaBusca)
      
      const vendasCarregadas = await fetchPagamentos(filtrosParaBusca)
      console.log('✅ [PAGAMENTOS] Vendas carregadas do CRUD:', vendasCarregadas.length)
      
      // Calcular previsões para cada venda
      const vendasComPrevisao = vendasCarregadas.map(venda => {
        try {
          const previsaoCalculada = calcularPrevisaoVenda(venda)
          return {
            ...venda,
            previsaoPgto: venda.previsaoPgto || previsaoCalculada || null
          }
        } catch (error) {
          console.warn('⚠️ [PAGAMENTOS] Erro ao calcular previsão para venda:', venda.id, error)
          return {
            ...venda,
            previsaoPgto: venda.previsaoPgto || null
          }
        }
      })
      
      vendasOriginais.value = vendasComPrevisao
      console.log('💾 [PAGAMENTOS] Vendas originais atualizadas:', vendasOriginais.value.length)
      
      // Só resetar vendas se não há filtros ativos
      if (!filtroAtivo.value.empresa && !filtroAtivo.value.matriz && !filtroAtivo.value.modalidade && !filtroAtivo.value.bandeira && !filtroAtivo.value.dataVenda && !filtroAtivo.value.vendaBruta && !filtroAtivo.value.nsu && !filtroAtivo.value.dataInicial && !filtroAtivo.value.dataFinal) {
        vendas.value = [...vendasOriginais.value]
        console.log('📋 [PAGAMENTOS] Vendas exibidas (sem filtros):', vendas.value.length)
      } else {
        console.log('🔍 [PAGAMENTOS] Reaplicando filtros existentes...')
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
        console.log('📊 [PAGAMENTOS] Vendas filtradas após reload:', vendas.value.length)
      }
    } catch (err) {
      console.error('❌ [PAGAMENTOS] Erro ao buscar vendas:', err)
      error.value = err.message || 'Erro ao carregar vendas'
      vendas.value = []
    }
  }
  
  // Função para aplicar filtros
  const aplicarFiltros = async (filtros = {}) => {
    console.log('🔍 [PAGAMENTOS] === APLICANDO FILTROS ===')
    console.log('📋 [PAGAMENTOS] Filtros recebidos:', filtros)
    console.log('📊 [PAGAMENTOS] Vendas originais disponíveis:', vendasOriginais.value.length)
    
    // ✅ VERIFICAR SE É "TODAS AS EMPRESAS" (empresa vazia ou não definida)
    const isTodasEmpresas = !filtros.empresa || filtros.empresa === '' || filtros.empresa === 'todas'
    
    if (isTodasEmpresas) {
      console.log('🌍 [PAGAMENTOS] === TODAS AS EMPRESAS SELECIONADAS ===')
      console.log('🔄 [PAGAMENTOS] Forçando reload para buscar todas as empresas...')
      
      // Limpar filtros ativos antes do reload
      filtroAtivo.value = {
        empresa: '',
        matriz: '',
        modalidade: filtros.modalidade || '',
        bandeira: filtros.bandeira || '',
        dataVenda: filtros.dataVenda || '',
        vendaBruta: filtros.vendaBruta || '',
        nsu: filtros.nsu || '',
        dataInicial: filtros.dataInicial || '',
        dataFinal: filtros.dataFinal || ''
      }
      
      // Para "Todas as Empresas", sempre forçar reload e não aplicar filtros específicos
      await fetchVendas(true)
      
      // Aplicar filtros locais APÓS o reload
      if (filtroAtivo.value.modalidade || filtroAtivo.value.bandeira || filtroAtivo.value.dataVenda || filtroAtivo.value.vendaBruta || filtroAtivo.value.nsu || filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
        console.log('🔍 [PAGAMENTOS] Aplicando filtros locais...')
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
      }
      
      console.log('📊 [PAGAMENTOS] Vendas finais (todas empresas):', vendas.value.length)
      return
    }

    // ✅ EMPRESA ESPECÍFICA SELECIONADA
    // Obter dados completos da empresa (nome e matriz)
    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    
    if (!empresaCompleta) {
      console.log('❌ [PAGAMENTOS] Não foi possível obter dados da empresa')
      return
    }
    
    // Preparar filtros completos
    const filtrosCompletos = {
      empresa: empresaCompleta.nome,
      matriz: empresaCompleta.matriz,
      modalidade: filtros.modalidade || '',
      bandeira: filtros.bandeira || '',
      dataVenda: filtros.dataVenda || '',
      vendaBruta: filtros.vendaBruta || '',
      nsu: filtros.nsu || '',
      dataInicial: filtros.dataInicial || '',
      dataFinal: filtros.dataFinal || ''
    }
    
    // Atualizar filtros ativos ANTES do reload para evitar loop
    filtroAtivo.value = { ...filtrosCompletos }
    
    // Forçar reload dos dados para empresa específica
    await fetchVendas(true)
    
    // Os filtros já foram aplicados no fetchVendas através do filtroAtivo.value
    console.log('📊 [PAGAMENTOS] Vendas finais (empresa específica):', vendas.value.length)
  }
  
  // Computed para paginação
  const totalItems = computed(() => vendas.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  
  const paginatedVendas = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return vendas.value.slice(start, end)
  })
  
  // Computed para totais (baseado em TODAS as vendas, não apenas a página atual)
  const vendaBrutaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      return total + (parseFloat(venda.valor_bruto || venda.vendaBruta) || 0)
    }, 0)
  })
  
  const vendaLiquidaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      return total + (parseFloat(venda.valor_liquido || venda.vendaLiquida) || 0)
    }, 0)
  })
  
  // Novo: Total de MDR
  const totalMdr = computed(() => {
    return vendas.value.reduce((total, venda) => {
      return total + (parseFloat(venda.despesa_mdr || venda.despesaMdr) || 0)
    }, 0)
  })
  
  // Novo: Média de Taxa MDR
  const mediaTaxaMdr = computed(() => {
    const vendasComTaxa = vendas.value.filter(venda => (venda.taxa_mdr || venda.taxaMdr) && (venda.taxa_mdr || venda.taxaMdr) > 0)
    if (vendasComTaxa.length === 0) return 0
    
    const somaTaxas = vendasComTaxa.reduce((total, venda) => {
      return total + (parseFloat(venda.taxa_mdr || venda.taxaMdr) || 0)
    }, 0)
    
    return somaTaxas / vendasComTaxa.length
  })
  
  // Funções de paginação
  const setPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  const setItemsPerPage = (size) => {
    if (availablePageSizes.includes(size)) {
      itemsPerPage.value = size
      currentPage.value = 1 // Reset para primeira página
    }
  }
  
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }
  
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }
  
  return {
    // Estados
    loading: computed(() => loading.value || crudLoading.value),
    error: computed(() => error.value || crudError.value),
    previsoes: paginatedVendas, // Retorna vendas paginadas
    allPrevisoes: vendas, // Todas as vendas para cálculos
    vendasOriginais,
    filtroAtivo,
    
    // Paginação
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    availablePageSizes,
    
    // Computed
    vendaBrutaTotal,
    vendaLiquidaTotal,
    totalMdr,
    mediaTaxaMdr,
    
    // Métodos
    fetchPrevisoes: fetchVendas,
    aplicarFiltros,
    limparFiltros,
    setPage,
    setItemsPerPage,
    nextPage,
    prevPage
  }
}