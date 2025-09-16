import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'

export const useBancosSupabase = () => {
  const { supabase } = useAPIsupabase()
  const { empresaSelecionada } = useEmpresas()
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const movimentacoes = ref([])
  
  // Estados para paginação
  const currentPage = ref(1)
  const itemsPerPage = ref(30)
  const availablePageSizes = [10, 20, 30, 50, 100]
  
  // Função para buscar movimentações bancárias do Supabase
  const fetchMovimentacoes = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('🔄 Buscando movimentações bancárias do Supabase...')
      
      // Buscar movimentações diretamente do Supabase
      let query = supabase
        .from('movimentacoes_bancarias')
        .select('*')
        .order('data_movimentacao', { ascending: false })
      
      // Filtrar por empresa se selecionada
      if (empresaSelecionada.value) {
        query = query.eq('empresa', empresaSelecionada.value)
      }
      
      const { data: movimentacoesData, error: supabaseError } = await query
      
      if (supabaseError) {
        throw new Error(`Erro do Supabase: ${supabaseError.message}`)
      }
      
      console.log('✅ Movimentações carregadas do Supabase:', movimentacoesData?.length || 0)
      
      // Mapear campos para compatibilidade
      movimentacoes.value = movimentacoesData.map(movimentacao => ({
        ...movimentacao,
        // Mapear campos para compatibilidade
        dataMovimentacao: movimentacao.data_movimentacao,
        valorCredito: movimentacao.valor_credito,
        valorDebito: movimentacao.valor_debito,
        saldoAnterior: movimentacao.saldo_anterior,
        saldoAtual: movimentacao.saldo_atual,
        numeroDocumento: movimentacao.numero_documento,
        tipoOperacao: movimentacao.tipo_operacao
      }))
      
    } catch (err) {
      console.error('💥 Erro ao buscar movimentações:', err)
      error.value = err.message || 'Erro ao carregar movimentações'
      movimentacoes.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Computed para paginação
  const totalItems = computed(() => movimentacoes.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  
  const paginatedMovimentacoes = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return movimentacoes.value.slice(start, end)
  })
  
  // Computed para totais
  const totalCreditos = computed(() => {
    return movimentacoes.value.reduce((total, mov) => {
      return total + (parseFloat(mov.valor_credito) || 0)
    }, 0)
  })
  
  const totalDebitos = computed(() => {
    return movimentacoes.value.reduce((total, mov) => {
      return total + (parseFloat(mov.valor_debito) || 0)
    }, 0)
  })
  
  const saldoTotal = computed(() => {
    return totalCreditos.value - totalDebitos.value
  })
  
  const mediaCreditos = computed(() => {
    const creditosComValor = movimentacoes.value.filter(mov => mov.valor_credito && mov.valor_credito > 0)
    if (creditosComValor.length === 0) return 0
    
    return totalCreditos.value / creditosComValor.length
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
      currentPage.value = 1
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
    movimentacoes: paginatedMovimentacoes,
    allMovimentacoes: movimentacoes,
    
    // Paginação
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    availablePageSizes,
    
    // Computed
    totalCreditos,
    totalDebitos,
    saldoTotal,
    mediaCreditos,
    
    // Métodos
    fetchMovimentacoes,
    setPage,
    setItemsPerPage,
    nextPage,
    prevPage
  }
}