import { computed } from 'vue'

export const useResumoFinanceiro = (vendas) => {
  // Calcular resumo financeiro baseado nas regras específicas
  const resumoCalculado = computed(() => {
    if (!vendas.value || !Array.isArray(vendas.value) || vendas.value.length === 0) {
      return {
        vendasBrutas: 0,
        qtdVendasBrutas: 0,
        taxa: 0,
        taxaMedia: 0,
        vendasLiquidas: 0,
        qtdVendasLiquidas: 0,
        debitos: 0,
        qtdDebitos: 0,
        rejeitados: 0,
        qtdRejeitados: 0,
        totalLiquido: 0
      }
    }

    // 1. Vendas Brutas - somar coluna venda bruta (vendaBruta)
    const vendasBrutas = vendas.value.reduce((sum, venda) => {
      return sum + (parseFloat(venda.vendaBruta) || 0)
    }, 0)

    // 2. Taxa - somar coluna despesa MDR (despesaMdr)
    const taxa = vendas.value.reduce((sum, venda) => {
      return sum + (parseFloat(venda.despesaMdr) || 0)
    }, 0)

    // 3. Débitos - modalidades: mensalidade, ajustes, aluguel de maquina, aluguel, descontos
    const modalidadesDebito = ['mensalidade', 'ajustes', 'aluguel de maquina', 'aluguel', 'descontos']
    const bandeirasDebito = ['mensalidade', 'ajustes', 'aluguel de maquina', 'aluguel', 'descontos']
    
    const vendasDebito = vendas.value.filter(venda => {
      const modalidade = (venda.modalidade || '').toLowerCase()
      const bandeira = (venda.bandeira || '').toLowerCase()
      
      return modalidadesDebito.some(mod => modalidade.includes(mod)) ||
             bandeirasDebito.some(band => bandeira.includes(band))
    })
    
    // Considerar valores negativos como positivos para débitos
    const debitos = vendasDebito.reduce((sum, venda) => {
      const valor = parseFloat(venda.vendaBruta) || 0
      return sum + Math.abs(valor) // Converter negativo para positivo
    }, 0)

    // 4. Vendas Líquidas = Vendas Brutas - Taxa
    const vendasLiquidas = vendasBrutas - taxa

    // 5. Rejeitados - deixar zerado por enquanto
    const rejeitados = 0

    // 6. Total Líquido = Venda Líquida - Débitos
    const totalLiquido = vendasLiquidas - debitos

    // Calcular taxa média
    const taxaMedia = vendasBrutas > 0 ? ((taxa / vendasBrutas) * 100) : 0

    return {
      vendasBrutas,
      qtdVendasBrutas: vendas.value.length,
      taxa,
      taxaMedia: parseFloat(taxaMedia.toFixed(2)),
      vendasLiquidas,
      qtdVendasLiquidas: vendas.value.length,
      debitos,
      qtdDebitos: vendasDebito.length,
      rejeitados,
      qtdRejeitados: 0,
      totalLiquido
    }
  })

  return {
    resumoCalculado
  }
}