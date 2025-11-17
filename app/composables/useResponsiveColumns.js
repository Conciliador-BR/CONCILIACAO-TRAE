import { ref, readonly, onBeforeUnmount } from 'vue'

export const useResponsiveColumns = () => {
  const screenSize = ref('fullhd')
  const windowWidth = ref(1920)

  // Função simples que retorna todas as colunas sempre
  const getVisibleVendasColumns = (allColumns) => {
    return allColumns // Retorna todas as colunas sempre
  }

  // Função simples que retorna todas as colunas sempre
  const getVisibleTaxasColumns = (allColumns) => {
    return allColumns // Retorna todas as colunas sempre
  }

  // Verificar se coluna está visível (sempre true agora)
  const isColumnVisible = (column, type = 'vendas') => {
    return true // Todas as colunas sempre visíveis
  }

  // Larguras fixas sem multiplicadores
  const getResponsiveColumnWidths = (baseWidths, type = 'vendas') => {
    const w = windowWidth.value
    let scale = 1
    if (w < 1280) scale = 0.85
    else if (w < 1536) scale = 0.95
    else if (w < 1920) scale = 1.0
    else if (w < 2560) scale = 1.15
    else scale = 1.25

    const scaled = {}
    Object.keys(baseWidths).forEach(key => {
      const base = baseWidths[key] || 120
      const s = Math.max(80, Math.round(base * scale))
      scaled[key] = s
    })
    return scaled
  }

  // Atualizar tamanho da tela (simplificado)
  const updateScreenSize = () => {
    if (process.client) {
      windowWidth.value = window.innerWidth
      // Atualizar rótulo de tela simples
      screenSize.value = wToLabel(windowWidth.value)
    }
  }

  const wToLabel = (w) => {
    if (w < 1280) return 'hd'
    if (w < 1536) return 'hd+'
    if (w < 1920) return 'fullhd'
    if (w < 2560) return '2k'
    return '4k'
  }

  // Inicializar listener de resize
  const initializeResponsive = () => {
    if (process.client) {
      updateScreenSize()
      window.addEventListener('resize', updateScreenSize)
      
      onBeforeUnmount(() => {
        window.removeEventListener('resize', updateScreenSize)
      })
    }
  }

  return {
    screenSize: readonly(screenSize),
    windowWidth: readonly(windowWidth),
    getVisibleVendasColumns,
    getVisibleTaxasColumns,
    isColumnVisible,
    getResponsiveColumnWidths,
    updateScreenSize,
    initializeResponsive
  }
}