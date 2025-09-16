import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'

export const usePrevisaoSupabase = () => {
  const { supabase } = useAPIsupabase()
  const { empresaSelecionada } = useEmpresas()
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const vendas = ref([])
  
  // Estados para paginação
  const currentPage = ref(1)
  const itemsPerPage = ref(30)
  const availablePageSizes = [10, 20, 30, 50, 100]
  
  // Função para buscar vendas do Supabase (SEM cálculo de previsão)
  const fetchVendas = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('🔄 Buscando vendas do Supabase...')
      
      // Buscar vendas diretamente do Supabase
      let query = supabase
        .from('vendas_operadora_unica')
        .select('*')
        .order('data_venda', { ascending: false })
      
      // Filtrar por empresa se selecionada
      if (empresaSelecionada.value) {
        query = query.eq('empresa', empresaSelecionada.value)
      }
      
      const { data: vendasData, error: supabaseError } = await query
      
      if (supabaseError) {
        throw new Error(`Erro do Supabase: ${supabaseError.message}`)
      }
      
      console.log('✅ Vendas carregadas do Supabase:', vendasData?.length || 0)
      
      // Apenas mapear campos para compatibilidade (SEM cálculo de previsão)
      vendas.value = vendasData.map(venda => ({
        ...venda,
        // Mapear campos para compatibilidade
        dataVenda: venda.data_venda,
        vendaBruta: venda.valor_bruto,
        vendaLiquida: venda.valor_liquido,
        taxaMdr: venda.taxa_mdr,
        despesaMdr: venda.despesa_mdr,
        numeroParcelas: venda.numero_parcelas
      }))
      
    } catch (err) {
      console.error('💥 Erro ao buscar vendas:', err)
      error.value = err.message || 'Erro ao carregar vendas'
      vendas.value = []
    } finally {
      loading.value = false
    }
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
      return total + (parseFloat(venda.valor_bruto) || 0)
    }, 0)
  })
  
  const vendaLiquidaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      return total + (parseFloat(venda.valor_liquido) || 0)
    }, 0)
  })
  
  // Novo: Total de MDR
  const totalMdr = computed(() => {
    return vendas.value.reduce((total, venda) => {
      return total + (parseFloat(venda.despesa_mdr) || 0)
    }, 0)
  })
  
  // Novo: Média de Taxa MDR
  const mediaTaxaMdr = computed(() => {
    const vendasComTaxa = vendas.value.filter(venda => venda.taxa_mdr && venda.taxa_mdr > 0)
    if (vendasComTaxa.length === 0) return 0
    
    const somaTaxas = vendasComTaxa.reduce((total, venda) => {
      return total + (parseFloat(venda.taxa_mdr) || 0)
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
    loading,
    error,
    previsoes: paginatedVendas, // Retorna vendas paginadas
    allPrevisoes: vendas, // Todas as vendas para cálculos
    
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
    setPage,
    setItemsPerPage,
    nextPage,
    prevPage
  }
}