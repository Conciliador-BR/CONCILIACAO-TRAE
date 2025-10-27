import { computed } from 'vue'

export const useCalculosTotais = (estados) => {
  // Computed para dados paginados
  const dadosPaginados = computed(() => {
    const inicio = (estados.currentPage.value - 1) * estados.itemsPerPage.value
    const fim = inicio + estados.itemsPerPage.value
    return estados.movimentacoes.value.slice(inicio, fim)
  })
  
  // Computed para totais
  const totalItems = computed(() => estados.movimentacoes.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / estados.itemsPerPage.value))
  
  const totalCreditos = computed(() => {
    return estados.movimentacoes.value.reduce((total, mov) => total + (mov.deposito || 0), 0)
  })
  
  const totalDebitos = computed(() => {
    return estados.movimentacoes.value.reduce((total, mov) => total + (mov.debitos || 0), 0)
  })
  
  const saldoTotal = computed(() => {
    return estados.movimentacoes.value.reduce((total, mov) => total + (mov.saldoConciliacao || 0), 0)
  })
  
  const mediaCreditos = computed(() => {
    const creditos = estados.movimentacoes.value.filter(mov => mov.deposito > 0)
    if (creditos.length === 0) return 0
    return totalCreditos.value / creditos.length
  })
  
  // Novos campos para o footer
  const totalGeralPrevisto = computed(() => {
    return estados.movimentacoes.value.reduce((total, mov) => total + (mov.previsto || 0), 0)
  })
  
  const totalDiasComPrevisao = computed(() => {
    const datasUnicas = new Set(estados.movimentacoes.value.map(mov => mov.data))
    return datasUnicas.size
  })
  
  const totalVendasPrevistas = computed(() => {
    return estados.movimentacoes.value.reduce((total, mov) => total + (mov.quantidadeVendas || 0), 0)
  })

  return {
    dadosPaginados,
    totalItems,
    totalPages,
    totalCreditos,
    totalDebitos,
    saldoTotal,
    mediaCreditos,
    totalGeralPrevisto,
    totalDiasComPrevisao,
    totalVendasPrevistas
  }
}