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
    console.log('🔄 === FETCH VENDAS CHAMADO ===')
    console.log('📊 Vendas originais atuais:', vendasOriginais.value.length)
    console.log('🔄 Force reload:', forceReload)
    
    // Se já temos dados carregados e não é um reload forçado, não recarregar
    if (vendasOriginais.value.length > 0 && !forceReload) {
      console.log('⚠️ Dados já carregados, mantendo estado atual')
      return
    }
    
    try {
      console.log('🚀 Buscando vendas do CRUD...')
      const vendasCarregadas = await fetchVendasCRUD()
      console.log('✅ Vendas carregadas do CRUD:', vendasCarregadas.length)
      
      vendasOriginais.value = vendasCarregadas
      console.log('💾 Vendas originais atualizadas:', vendasOriginais.value.length)
      
      // Só resetar vendas se não há filtros ativos
      if (!filtroAtivo.value.empresa && !filtroAtivo.value.matriz && !filtroAtivo.value.dataInicial && !filtroAtivo.value.dataFinal) {
        vendas.value = [...vendasOriginais.value]
        console.log('📋 Vendas exibidas (sem filtros):', vendas.value.length)
      } else {
        console.log('🔍 Reaplicando filtros existentes...')
        // Reaplicar filtros existentes SEM chamar aplicarFiltros novamente
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
        console.log('📊 Vendas filtradas após reload:', vendas.value.length)
      }
    } catch (err) {
      console.error('❌ Erro ao buscar vendas:', err)
    }
  }

  // Função para aplicar filtros
  const aplicarFiltros = async (filtros = {}) => {
    console.log('🔍 === APLICANDO FILTROS ===')
    console.log('📋 Filtros recebidos:', filtros)
    console.log('📊 Vendas originais disponíveis:', vendasOriginais.value.length)
    
    // ✅ VERIFICAR SE É "TODAS AS EMPRESAS" (empresa vazia ou não definida)
    const isTodasEmpresas = !filtros.empresa || filtros.empresa === '' || filtros.empresa === 'todas'
    
    if (isTodasEmpresas) {
      console.log('🌍 === TODAS AS EMPRESAS SELECIONADAS ===')
      console.log('🔄 Forçando reload para buscar todas as empresas...')
      
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
        console.log('📅 Aplicando apenas filtros de data...')
        const vendasFiltradas = aplicarFiltrosLogic(vendasOriginais.value, filtroAtivo.value)
        vendas.value = vendasFiltradas
      }
      
      console.log('📊 Vendas finais (todas empresas):', vendas.value.length)
      return
    }
    
    // ✅ EMPRESA ESPECÍFICA SELECIONADA
    console.log('🏢 === EMPRESA ESPECÍFICA SELECIONADA ===')
    
    // Obter dados completos da empresa (nome e matriz)
    console.log('🏢 Obtendo dados completos da empresa selecionada...')
    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    
    if (!empresaCompleta) {
      console.log('❌ Não foi possível obter dados da empresa')
      return
    }
    
    console.log('✅ Empresa completa obtida:', empresaCompleta)
    
    // Preparar filtros completos
    const filtrosCompletos = {
      empresa: empresaCompleta.nome,
      matriz: empresaCompleta.matriz,
      dataInicial: filtros.dataInicial || '',
      dataFinal: filtros.dataFinal || ''
    }
    
    console.log('📋 Filtros completos preparados:', filtrosCompletos)
    
    // Atualizar filtros ativos ANTES do reload para evitar loop
    filtroAtivo.value = { ...filtrosCompletos }
    
    // Forçar reload dos dados para empresa específica
    console.log('🔄 Forçando reload dos dados para empresa específica...')
    await fetchVendas(true)
    
    // Os filtros já foram aplicados no fetchVendas através do filtroAtivo.value
    console.log('📊 Vendas finais (empresa específica):', vendas.value.length)
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