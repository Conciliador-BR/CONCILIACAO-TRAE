import { ref } from 'vue'
import { useVendasCRUD } from './PageVendas/useVendasCRUD'
import { useVendasFilters } from './PageVendas/useVendasFilters'
import { useVendasCalculos } from './PageVendas/useVendasCalculos'

// Estados globais compartilhados (singleton)
const vendas = ref([])
const vendasOriginais = ref([]) // Armazenar dados originais

export const useVendas = () => {
  // Usar os composables componentizados
  const {
    loading,
    error,
    fetchVendas: fetchVendasCRUD,
    createVenda,
    updateVenda,
    deleteVenda
  } = useVendasCRUD()

  const {
    filtroAtivo,
    aplicarFiltros: aplicarFiltrosLogic,
    limparFiltros
  } = useVendasFilters()

  const {
    vendaBrutaTotal,
    vendaLiquidaTotal
  } = useVendasCalculos(vendas)

  // Função para buscar vendas com controle de estado
  const fetchVendas = async (forceReload = false) => {
    // Se já temos dados carregados e não é um reload forçado, não recarregar
    if (vendasOriginais.value.length > 0 && !forceReload) {
      console.log('Dados já carregados, mantendo estado atual')
      return
    }
    
    try {
      const vendasCarregadas = await fetchVendasCRUD()
      vendasOriginais.value = vendasCarregadas
      
      // Só resetar vendas se não há filtros ativos
      if (!filtroAtivo.value.empresa && !filtroAtivo.value.dataInicial && !filtroAtivo.value.dataFinal) {
        vendas.value = [...vendasOriginais.value]
      } else {
        // Reaplicar filtros existentes
        aplicarFiltros(filtroAtivo.value)
      }
    } catch (err) {
      console.error('Erro ao buscar vendas:', err)
    }
  }

  // Função para aplicar filtros
  const aplicarFiltros = (filtros = {}) => {
    const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtros)
    vendas.value = vendasFiltradas
  }

  // Função para criar venda com atualização de estado
  const createVendaWithState = async (vendaData) => {
    try {
      const newVenda = await createVenda(vendaData)
      vendas.value.unshift(newVenda)
      vendasOriginais.value.unshift(newVenda)
      return newVenda
    } catch (err) {
      throw err
    }
  }

  // Função para atualizar venda com atualização de estado
  const updateVendaWithState = async (id, vendaData) => {
    try {
      const updatedVenda = await updateVenda(id, vendaData)
      const index = vendas.value.findIndex(v => v.id === id)
      const originalIndex = vendasOriginais.value.findIndex(v => v.id === id)
      
      if (index !== -1) vendas.value[index] = updatedVenda
      if (originalIndex !== -1) vendasOriginais.value[originalIndex] = updatedVenda
      
      return updatedVenda
    } catch (err) {
      throw err
    }
  }

  // Função para deletar venda com atualização de estado
  const deleteVendaWithState = async (id) => {
    try {
      await deleteVenda(id)
      vendas.value = vendas.value.filter(v => v.id !== id)
      vendasOriginais.value = vendasOriginais.value.filter(v => v.id !== id)
      return true
    } catch (err) {
      throw err
    }
  }

  return {
    vendas,
    vendasOriginais,
    loading,
    error,
    filtroAtivo,
    fetchVendas,
    aplicarFiltros,
    limparFiltros,
    createVenda: createVendaWithState,
    updateVenda: updateVendaWithState,
    deleteVenda: deleteVendaWithState,
    vendaBrutaTotal,
    vendaLiquidaTotal
  }
}