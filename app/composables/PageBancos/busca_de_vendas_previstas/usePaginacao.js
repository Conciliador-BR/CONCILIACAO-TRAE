export const usePaginacao = (estados, totais) => {
  // Funções de paginação
  const setPage = (page) => {
    if (page >= 1 && page <= totais.totalPages.value) {
      estados.currentPage.value = page
    }
  }
  
  const setItemsPerPage = (items) => {
    estados.itemsPerPage.value = items
    estados.currentPage.value = 1 // Resetar para primeira página
  }

  return {
    setPage,
    setItemsPerPage
  }
}