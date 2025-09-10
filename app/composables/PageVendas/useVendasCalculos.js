import { computed } from 'vue'

export const useVendasCalculos = (vendas) => {
  // Computed para totais
  const vendaBrutaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      const valor = parseFloat(venda.vendaBruta) || 0
      return total + valor
    }, 0)
  })

  const vendaLiquidaTotal = computed(() => {
    return vendas.value.reduce((total, venda) => {
      const valor = parseFloat(venda.vendaLiquida) || 0
      return total + valor
    }, 0)
  })

  return {
    vendaBrutaTotal,
    vendaLiquidaTotal
  }
}