import { ref, readonly, onBeforeUnmount } from 'vue'

export const useResponsiveColumns = () => {
  const screenSize = ref('hd')
  const windowWidth = ref(1366)

  // Definir breakpoints de resolução
  const breakpoints = {
    hd: 1366,      // HD - 1366x768
    fullhd: 1920,  // Full HD - 1920x1080
    '2k': 2560,    // 2K - 2560x1440
    '4k': 3840     // 4K - 3840x2160
  }

  // Configuração de colunas visíveis por resolução para GradeVendas
  const vendasColumnsByResolution = {
    hd: ['empresa', 'adquirente', 'bandeira', 'dataVenda', 'vendaBruto', 'vendaLiquido'],
    fullhd: ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'dataVenda', 'vendaBruto', 'taxaMdr', 'vendaLiquido'],
    '2k': ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'dataVenda', 'cancelamento', 'vendaBruto', 'taxaMdr', 'valorTaxa', 'vendaLiquido', 'nsu'],
    '4k': ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'dataVenda', 'cancelamento', 'previsaoPagamento', 'vendaBruto', 'taxaMdr', 'valorTaxa', 'vendaLiquido', 'nsu']
  }

  // Configuração de colunas visíveis por resolução para GradeTaxas
  const taxasColumnsByResolution = {
    hd: ['empresa', 'adquirente', 'bandeira', 'taxa'],
    fullhd: ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'taxa'],
    '2k': ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'taxa', 'dataCorte'],
    '4k': ['empresa', 'adquirente', 'bandeira', 'modalidade', 'parcelas', 'taxa', 'dataCorte']
  }

  // Obter o tamanho da tela baseado na largura
  const getScreenSize = (width) => {
    if (width >= breakpoints['4k']) return '4k'
    if (width >= breakpoints['2k']) return '2k'
    if (width >= breakpoints.fullhd) return 'fullhd'
    return 'hd'
  }

  // Atualizar tamanho da tela
  const updateScreenSize = () => {
    if (process.client) {
      windowWidth.value = window.innerWidth
      screenSize.value = getScreenSize(windowWidth.value)
    }
  }

  // Obter colunas visíveis para vendas
  const getVisibleVendasColumns = (allColumns) => {
    const visibleColumns = vendasColumnsByResolution[screenSize.value] || vendasColumnsByResolution.hd
    return allColumns.filter(column => visibleColumns.includes(column))
  }

  // Obter colunas visíveis para taxas
  const getVisibleTaxasColumns = (allColumns) => {
    const visibleColumns = taxasColumnsByResolution[screenSize.value] || taxasColumnsByResolution.hd
    return allColumns.filter(column => visibleColumns.includes(column))
  }

  // Verificar se coluna está visível
  const isColumnVisible = (column, type = 'vendas') => {
    const columnsByType = type === 'vendas' ? vendasColumnsByResolution : taxasColumnsByResolution
    const visibleColumns = columnsByType[screenSize.value] || columnsByType.hd
    return visibleColumns.includes(column)
  }

  // Computed para larguras de coluna responsivas
  const getResponsiveColumnWidths = (baseWidths, type = 'vendas') => {
    const multipliers = {
      hd: 1,
      fullhd: 1.2,
      '2k': 1.4,
      '4k': 1.6
    }
    
    const multiplier = multipliers[screenSize.value] || 1
    const responsiveWidths = {}
    
    Object.keys(baseWidths).forEach(column => {
      if (isColumnVisible(column, type) || column === 'acoes') {
        responsiveWidths[column] = Math.round(baseWidths[column] * multiplier)
      }
    })
    
    return responsiveWidths
  }

  // Inicializar listener de resize
  const initializeResponsive = () => {
    if (process.client) {
      updateScreenSize()
      window.addEventListener('resize', updateScreenSize)
      
      // Cleanup no onBeforeUnmount
      onBeforeUnmount(() => {
        window.removeEventListener('resize', updateScreenSize)
      })
    }
  }

  return {
    screenSize: readonly(screenSize),
    windowWidth: readonly(windowWidth),
    breakpoints,
    getVisibleVendasColumns,
    getVisibleTaxasColumns,
    isColumnVisible,
    getResponsiveColumnWidths,
    updateScreenSize,
    initializeResponsive
  }
}