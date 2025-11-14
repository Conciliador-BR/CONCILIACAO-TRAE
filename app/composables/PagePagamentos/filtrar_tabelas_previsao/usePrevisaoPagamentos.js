import { ref, computed, watch, onUnmounted } from 'vue'
import { useVendas } from '../useVendas'
import { useTaxas } from '../useTaxas'
import { usePrevisaoColuna } from './usePrevisaoColuna'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'

export const usePrevisaoPagamentos = () => {
  // Estados reativos
  const loading = ref(false)
  const error = ref(null)
  const vendasPrevisao = ref([])
  
  // Usar composables
  const { vendas, fetchVendas, aplicarFiltros } = useVendas()
  const { taxas, fetchTaxas } = useTaxas()
  const { calcularPrevisaoVenda, inicializar } = usePrevisaoColuna()
  const { empresaSelecionada } = useEmpresas()
  const { filtrosGlobais, escutarEvento } = useGlobalFilters()
  
  // Variável para armazenar a função de cleanup do watcher
  let stopWatchingEmpresa
  
  // Computed para vendas com previsão calculada
  const vendasComPrevisao = computed(() => {
    if (!vendas.value || vendas.value.length === 0) { return [] }
    
    if (!taxas.value || taxas.value.length === 0) {
      return vendas.value.map(venda => ({
        ...venda,
        previsaoPgto: 'Taxa não cadastrada'
      }))
    }
    
    return vendas.value.map(venda => {
      try {
        const previsao = calcularPrevisaoVenda(venda)
        
        return {
          ...venda,
          previsaoPgto: previsao
        }
      } catch (error) {
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
      
      
      // Inicializar taxas primeiro (primeira carga)
      await inicializar()

      // Forçar recarga das taxas atuais (localStorage/Supabase) ANTES de calcular
      await fetchTaxas()
      
      // Aplicar filtros globais ao buscar vendas
      if (filtrosGlobais.dataInicial || filtrosGlobais.dataFinal || filtrosGlobais.empresaSelecionada) {
        await aplicarFiltros({
          empresa: filtrosGlobais.empresaSelecionada,
          dataInicial: filtrosGlobais.dataInicial,
          dataFinal: filtrosGlobais.dataFinal
        })
      } else {
        // Buscar vendas sem filtros
        await fetchVendas()
      }
      
      // As previsões são calculadas automaticamente via computed
      vendasPrevisao.value = vendasComPrevisao.value
      
    } catch (err) {
      error.value = err.message || 'Erro ao carregar dados'
    } finally {
      loading.value = false
    }
  }

  // Configurar watcher com cleanup
  const setupWatcher = () => {
    stopWatchingEmpresa = watch(empresaSelecionada, async (novaEmpresa) => {
      if (novaEmpresa) { await fetchVendasPrevisao() }
    })
  }

  // Função para limpar watchers
  const cleanup = () => {
    if (stopWatchingEmpresa) {
      stopWatchingEmpresa()
      stopWatchingEmpresa = null
    }
  }

  // Função para remover venda
  const removerVenda = (vendaId) => {
    const index = vendasPrevisao.value.findIndex(v => v.id === vendaId)
    if (index > -1) { vendasPrevisao.value.splice(index, 1) }
  }

  // Configurar watcher na inicialização
  setupWatcher()

  // Listener para filtros globais
  let stopListeningGlobalFilters
  
  const setupGlobalFilterListener = () => {
    stopListeningGlobalFilters = escutarEvento('filtrar-pagamentos', async () => { await fetchVendasPrevisao() })
  }

  // Função para limpar todos os watchers e listeners
  const cleanupAll = () => {
    cleanup()
    if (stopListeningGlobalFilters) {
      stopListeningGlobalFilters()
      stopListeningGlobalFilters = null
    }
  }

  // Configurar listener de filtros globais
  setupGlobalFilterListener()

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
    removerVenda,
    cleanup: cleanupAll
  }
}