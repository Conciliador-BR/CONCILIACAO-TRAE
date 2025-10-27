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
  
  // Lista das operadoras conhecidas
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

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
    
    // Constantes
    operadorasConhecidas
  }
}