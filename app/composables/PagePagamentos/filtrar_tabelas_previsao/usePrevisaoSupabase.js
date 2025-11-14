import { ref, computed } from 'vue'
const __previsaoCache = new Map()
const __makeKey = (f) => JSON.stringify({
  empresa: f.empresa || '',
  matriz: f.matriz || '',
  modalidade: f.modalidade || '',
  bandeira: f.bandeira || '',
  dataVenda: f.dataVenda || '',
  vendaBruta: f.vendaBruta || '',
  nsu: f.nsu || '',
  dataInicial: f.dataInicial || '',
  dataFinal: f.dataFinal || ''
})
const __lsKey = (k) => `previsao_cache_${k}`
const __getFromLS = (k) => {
  try {
    if (!process.client) return null
    const raw = localStorage.getItem(__lsKey(k))
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}
const __saveToLS = (k, v) => {
  try {
    if (!process.client) return
    localStorage.setItem(__lsKey(k), JSON.stringify(v))
  } catch (e) {}
}
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
    const chave = __makeKey(filtroAtivo.value)
    if (!forceReload) {
      if (__previsaoCache.has(chave)) {
        const cached = __previsaoCache.get(chave)
        vendasOriginais.value = cached.originais
        vendas.value = cached.filtradas
        return
      }
      const lsCached = __getFromLS(chave)
      if (lsCached) {
        vendasOriginais.value = lsCached.originais
        vendas.value = lsCached.filtradas
        __previsaoCache.set(chave, lsCached)
        return
      }
    }
    
    try {
      // Inicializar cálculo de previsões se necessário
      await inicializar()
      
      // Passar filtros de data para o fetchPagamentos
      const filtrosParaBusca = {
        dataInicial: filtroAtivo.value.dataInicial,
        dataFinal: filtroAtivo.value.dataFinal
      }
      
      const vendasCarregadas = await fetchPagamentos(filtrosParaBusca)
      
      // Calcular previsões para cada venda
      const vendasComPrevisao = vendasCarregadas.map(venda => {
        try {
          const previsaoCalculada = calcularPrevisaoVenda(venda)
          return {
            ...venda,
            previsaoPgto: venda.previsaoPgto || previsaoCalculada || null
          }
        } catch (error) {
          return {
            ...venda,
            previsaoPgto: venda.previsaoPgto || null
          }
        }
      })
      
      vendasOriginais.value = vendasComPrevisao
      
      // Só resetar vendas se não há filtros ativos
      if (!filtroAtivo.value.empresa && !filtroAtivo.value.matriz && !filtroAtivo.value.modalidade && !filtroAtivo.value.bandeira && !filtroAtivo.value.dataVenda && !filtroAtivo.value.vendaBruta && !filtroAtivo.value.nsu && !filtroAtivo.value.dataInicial && !filtroAtivo.value.dataFinal) {
        vendas.value = [...vendasOriginais.value]
      } else {
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
      }
      const bundle = { originais: vendasOriginais.value, filtradas: vendas.value }
      __previsaoCache.set(chave, bundle)
      __saveToLS(chave, bundle)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar vendas'
      vendas.value = []
    }
  }
  
  // Função para aplicar filtros
  const aplicarFiltros = async (filtros = {}) => {
    // ✅ VERIFICAR SE É "TODAS AS EMPRESAS" (empresa vazia ou não definida)
    const isTodasEmpresas = !filtros.empresa || filtros.empresa === '' || filtros.empresa === 'todas'
    
    if (isTodasEmpresas) {
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
      const chave = __makeKey(filtroAtivo.value)
      if (__previsaoCache.has(chave)) {
        const cached = __previsaoCache.get(chave)
        vendasOriginais.value = cached.originais
        vendas.value = cached.filtradas
      } else {
        const lsCached = __getFromLS(chave)
        if (lsCached) {
          vendasOriginais.value = lsCached.originais
          vendas.value = lsCached.filtradas
          __previsaoCache.set(chave, lsCached)
        } else {
          await fetchVendas(true)
        }
      }
      
      // Aplicar filtros locais APÓS o reload
      if (filtroAtivo.value.modalidade || filtroAtivo.value.bandeira || filtroAtivo.value.dataVenda || filtroAtivo.value.vendaBruta || filtroAtivo.value.nsu || filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
      }
      return
    }

    // ✅ EMPRESA ESPECÍFICA SELECIONADA
    // Obter dados completos da empresa (nome e matriz)
    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    
    if (!empresaCompleta) { return }
    
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
    
    filtroAtivo.value = { ...filtrosCompletos }
    const chave = __makeKey(filtroAtivo.value)
    if (__previsaoCache.has(chave)) {
      const cached = __previsaoCache.get(chave)
      vendasOriginais.value = cached.originais
      vendas.value = cached.filtradas
    } else {
      const lsCached = __getFromLS(chave)
      if (lsCached) {
        vendasOriginais.value = lsCached.originais
        vendas.value = lsCached.filtradas
        __previsaoCache.set(chave, lsCached)
      } else {
        await fetchVendas(true)
      }
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