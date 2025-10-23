import { computed } from 'vue'

export const useControladoriaCalculos = (vendasAgrupadas, totaisGerais) => {
  
  // Função para formatar valores monetários
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }
  
  // Função para calcular percentual
  const calcularPercentual = (valor, total) => {
    if (!total || total === 0) return 0
    return ((valor / total) * 100).toFixed(2)
  }
  
  // Computed para estatísticas por bandeira
  const estatisticasPorBandeira = computed(() => {
    return vendasAgrupadas.value.map(grupo => ({
      ...grupo,
      percentualDoTotal: calcularPercentual(grupo.valor_liquido_total, totaisGerais.value.vendaLiquida),
      ticketMedio: grupo.valor_liquido_total > 0 ? (grupo.valor_liquido_total / 1).toFixed(2) : 0, // Assumindo 1 transação por linha
      margemLiquida: calcularPercentual(grupo.valor_liquido_total - grupo.despesa_mdr_total, grupo.valor_bruto_total)
    }))
  })
  
  // Computed para ranking de bandeiras
  const rankingBandeiras = computed(() => {
    return [...vendasAgrupadas.value]
      .sort((a, b) => b.valor_liquido_total - a.valor_liquido_total)
      .slice(0, 5)
      .map((grupo, index) => ({
        posicao: index + 1,
        bandeira: grupo.adquirente,
        valor: grupo.valor_liquido_total,
        percentual: calcularPercentual(grupo.valor_liquido_total, totaisGerais.value.vendaLiquida)
      }))
  })
  
  // Computed para distribuição por modalidade
  const distribuicaoModalidade = computed(() => {
    const total = totaisGerais.value.vendaLiquida
    
    return {
      debito: {
        valor: totaisGerais.value.debito,
        percentual: calcularPercentual(totaisGerais.value.debito, total)
      },
      credito: {
        valor: totaisGerais.value.credito,
        percentual: calcularPercentual(totaisGerais.value.credito, total)
      },
      credito2x: {
        valor: totaisGerais.value.credito2x,
        percentual: calcularPercentual(totaisGerais.value.credito2x, total)
      },
      credito3x: {
        valor: totaisGerais.value.credito3x,
        percentual: calcularPercentual(totaisGerais.value.credito3x, total)
      },
      credito4x6x: {
        valor: totaisGerais.value.credito4x6x,
        percentual: calcularPercentual(totaisGerais.value.credito4x6x, total)
      },
      voucher: {
        valor: totaisGerais.value.voucher,
        percentual: calcularPercentual(totaisGerais.value.voucher, total)
      },
      outros: {
        valor: totaisGerais.value.outros,
        percentual: calcularPercentual(totaisGerais.value.outros, total)
      }
    }
  })
  
  // Computed para métricas de performance
  const metricsPerformance = computed(() => {
    const totalBruto = totaisGerais.value.vendaBruta
    const totalLiquido = totaisGerais.value.vendaLiquida
    const totalMdr = totaisGerais.value.despesaMdr
    
    return {
      taxaMdrMedia: calcularPercentual(totalMdr, totalBruto),
      margemLiquida: calcularPercentual(totalLiquido, totalBruto),
      valorMedioTransacao: totalLiquido > 0 ? (totalLiquido / vendasAgrupadas.value.length).toFixed(2) : 0,
      totalTransacoes: vendasAgrupadas.value.length
    }
  })
  
  return {
    // Computed
    estatisticasPorBandeira,
    rankingBandeiras,
    distribuicaoModalidade,
    metricsPerformance,
    
    // Métodos utilitários
    formatarMoeda,
    calcularPercentual
  }
}