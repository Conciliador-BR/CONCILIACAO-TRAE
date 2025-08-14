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
    return baseWidths // Retorna as larguras base sem modificação
  }

  // Atualizar tamanho da tela (simplificado)
  const updateScreenSize = () => {
    if (process.client) {
      windowWidth.value = window.innerWidth
      screenSize.value = 'fullhd' // Sempre fullhd
    }
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