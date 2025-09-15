import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'
// Remover: import { usePrevisaoColuna } from './usePrevisaoColuna'

export const usePrevisaoSupabase = () => {
  const { supabase } = useAPIsupabase()
  const { empresaSelecionada } = useEmpresas()
  // Remover: const { inicializar } = usePrevisaoColuna()
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const vendas = ref([])
  
  // Função para buscar vendas do Supabase (SEM cálculo de previsão)
  const fetchVendas = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('🔄 Buscando vendas do Supabase...')
      
      // Remover: await inicializar()
      
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
  
  // Computed para totais
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
  
  return {
    // Estados
    loading,
    error,
    previsoes: vendas,
    
    // Computed
    vendaBrutaTotal,
    vendaLiquidaTotal,
    
    // Métodos
    fetchPrevisoes: fetchVendas
  }
}