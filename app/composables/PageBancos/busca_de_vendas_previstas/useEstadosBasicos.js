import { ref } from 'vue'

export const useEstadosBasicos = () => {
  // Estados reativos locais
  const movimentacoes = ref([])
  const vendas = ref([])
  const vendasOriginais = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Estados para paginação
  const currentPage = ref(1)
  const itemsPerPage = ref(30)
  const availablePageSizes = [10, 20, 30, 50, 100]
  
  // Estados para cache
  const dadosCarregados = ref(false)
  const ultimaEmpresaCarregada = ref(null)
  const ultimaDataInicialCarregada = ref(null)
  const ultimaDataFinalCarregada = ref(null)
  const forcarRecarregamento = ref(false)
  
  // Lista das operadoras conhecidas
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  // Função para verificar se precisa recarregar dados
  const precisaRecarregar = (empresaAtual, dataInicial, dataFinal) => {
    // Se foi forçado o recarregamento (botão aplicar filtro)
    if (forcarRecarregamento.value) {
      forcarRecarregamento.value = false
      return true
    }
    
    // Se nunca carregou dados
    if (!dadosCarregados.value) {
      return true
    }
    
    // Se mudou a empresa
    if (ultimaEmpresaCarregada.value !== empresaAtual) {
      return true
    }
    
    // Se mudaram as datas
    if (ultimaDataInicialCarregada.value !== dataInicial || 
        ultimaDataFinalCarregada.value !== dataFinal) {
      return true
    }
    
    return false
  }
  
  // Função para marcar dados como carregados
  const marcarDadosCarregados = (empresa, dataInicial, dataFinal) => {
    dadosCarregados.value = true
    ultimaEmpresaCarregada.value = empresa
    ultimaDataInicialCarregada.value = dataInicial
    ultimaDataFinalCarregada.value = dataFinal
  }
  
  // Função para forçar recarregamento (chamada pelo botão aplicar filtro)
  const forcarRecarregamentoDados = () => {
    forcarRecarregamento.value = true
  }
  
  // Função para limpar cache
  const limparCache = () => {
    dadosCarregados.value = false
    ultimaEmpresaCarregada.value = null
    ultimaDataInicialCarregada.value = null
    ultimaDataFinalCarregada.value = null
    forcarRecarregamento.value = false
  }

  return {
    // Estados
    movimentacoes,
    vendas,
    vendasOriginais,
    loading,
    error,
    
    // Paginação
    currentPage,
    itemsPerPage,
    availablePageSizes,
    
    // Cache
    dadosCarregados,
    ultimaEmpresaCarregada,
    ultimaDataInicialCarregada,
    ultimaDataFinalCarregada,
    forcarRecarregamento,
    
    // Métodos de cache
    precisaRecarregar,
    marcarDadosCarregados,
    forcarRecarregamentoDados,
    limparCache,
    
    // Constantes
    operadorasConhecidas
  }
}