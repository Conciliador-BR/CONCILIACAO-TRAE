import { ref } from 'vue'
import { useVendasCRUD } from './PageVendas/useVendasCRUD'
import { useVendasFilters } from './PageVendas/useVendasFilters'
import { useVendasCalculos } from './PageVendas/useVendasCalculos'
import { useEmpresaHelpers } from './PageVendas/filtrar_tabelas/useEmpresaHelpers'

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

  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()

  // Função para buscar vendas com controle de estado
  const fetchVendas = async (forceReload = false) => {
    // Se já temos dados carregados e não é um reload forçado, não recarregar
    if (vendasOriginais.value.length > 0 && !forceReload) {
      return
    }
    
    try {
      const vendasCarregadas = await fetchVendasCRUD()
      
      vendasOriginais.value = vendasCarregadas
      
      // Só resetar vendas se não há filtros ativos
      if (!filtroAtivo.value.empresa && !filtroAtivo.value.matriz && !filtroAtivo.value.dataInicial && !filtroAtivo.value.dataFinal) {
        vendas.value = [...vendasOriginais.value]
      } else {
        // Reaplicar filtros existentes SEM chamar aplicarFiltros novamente
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
      }
    } catch (err) {
      console.error('❌ Erro ao buscar vendas:', err)
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
        dataInicial: filtros.dataInicial || '',
        dataFinal: filtros.dataFinal || ''
      }
      
      // Para "Todas as Empresas", sempre forçar reload e não aplicar filtros específicos
      await fetchVendas(true)
      
      // Aplicar apenas filtros de data (se houver) APÓS o reload
      if (filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
      }
      
      return
    }
    
    // ✅ EMPRESA ESPECÍFICA SELECIONADA
    // Obter dados completos da empresa (nome e matriz)
    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    
    if (!empresaCompleta) {
      return
    }
    
    // Preparar filtros completos
    const filtrosCompletos = {
      empresa: empresaCompleta.nome,
      matriz: empresaCompleta.matriz,
      dataInicial: filtros.dataInicial || '',
      dataFinal: filtros.dataFinal || ''
    }
    
    // Atualizar filtros ativos ANTES do reload para evitar loop
    filtroAtivo.value = { ...filtrosCompletos }
    
    // Forçar reload dos dados para empresa específica
    await fetchVendas(true)
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