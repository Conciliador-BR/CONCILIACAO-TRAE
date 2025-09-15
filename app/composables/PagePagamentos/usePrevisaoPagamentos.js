import { ref, computed, watch } from 'vue'
import { useVendas } from '../useVendas'
import { useTaxas } from '../useTaxas'
import { usePrevisaoColuna } from './usePrevisaoColuna'
import { useEmpresas } from '../useEmpresas'

export const usePrevisaoPagamentos = () => {
  // Estados reativos
  const loading = ref(false)
  const error = ref(null)
  const vendasPrevisao = ref([])
  
  // Usar composables
  const { vendas, fetchVendas } = useVendas()
  const { taxas, fetchTaxas } = useTaxas()
  const { calcularPrevisaoVenda, inicializar } = usePrevisaoColuna()
  const { empresaSelecionada } = useEmpresas()
  
  // Computed para vendas com previsão calculada
  const vendasComPrevisao = computed(() => {
    if (!vendas.value || vendas.value.length === 0) {
      console.log('📋 Nenhuma venda disponível')
      return []
    }
    
    if (!taxas.value || taxas.value.length === 0) {
      console.log('📋 Nenhuma taxa disponível')
      return vendas.value.map(venda => ({
        ...venda,
        previsaoPgto: 'Taxa não cadastrada'
      }))
    }
    
    console.log('🧮 Calculando previsões para', vendas.value.length, 'vendas')
    
    return vendas.value.map(venda => {
      try {
        const previsao = calcularPrevisaoVenda(venda)
        
        return {
          ...venda,
          previsaoPgto: previsao
        }
      } catch (error) {
        console.error('💥 Erro ao calcular previsão para venda:', venda.id, error)
        return {
          ...venda,
          previsaoPgto: 'Erro'
        }
      }
    })
  })
  
  // Computed para totais
  const vendaBrutaTotal = computed(() => {
    return vendasComPrevisao.value.reduce((total, venda) => {
      return total + (parseFloat(venda.valorBruto) || 0)
    }, 0)
  })
  
  const vendaLiquidaTotal = computed(() => {
    return vendasComPrevisao.value.reduce((total, venda) => {
      return total + (parseFloat(venda.valorLiquido) || 0)
    }, 0)
  })
  
  // Função para buscar vendas e calcular previsões
  const fetchVendasPrevisao = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('🔄 Iniciando busca de vendas e previsões...')
      
      // Inicializar taxas primeiro (primeira carga)
      await inicializar()

      // Forçar recarga das taxas atuais (localStorage/Supabase) ANTES de calcular
      await fetchTaxas()
      
      // Buscar vendas
      await fetchVendas()
      
      // As previsões são calculadas automaticamente via computed
      vendasPrevisao.value = vendasComPrevisao.value
      
      console.log('✅ Vendas e previsões carregadas:', vendasPrevisao.value.length)
      
    } catch (err) {
      console.error('💥 Erro ao buscar vendas/previsões:', err)
      error.value = err.message || 'Erro ao carregar dados'
    } finally {
      loading.value = false
    }
  }
  
  // Watcher para empresa selecionada
  watch(empresaSelecionada, async (novaEmpresa) => {
    if (novaEmpresa) {
      console.log('🏢 Empresa alterada, recarregando dados:', novaEmpresa)
      await fetchVendasPrevisao()
    }
  })
  
  // Função para remover venda
  const removerVenda = (vendaId) => {
    const index = vendasPrevisao.value.findIndex(v => v.id === vendaId)
    if (index > -1) {
      vendasPrevisao.value.splice(index, 1)
      console.log('🗑️ Venda removida:', vendaId)
    }
  }
  
  return {
    // Estados
    loading,
    error,
    vendasPrevisao,
    
    // Computeds
    vendasComPrevisao,
    vendaBrutaTotal,
    vendaLiquidaTotal,
    
    // Métodos
    fetchVendasPrevisao,
    fetchTaxas,
    removerVenda
  }
}