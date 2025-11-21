import { computed } from 'vue'

export const useAnaliseDeVendasCalculos = (analisePorBandeira, dreConsolidada, analiseTemporal) => {
  const lucratividadePorBandeira = computed(() => {
    if (!analisePorBandeira.value || analisePorBandeira.value.length === 0) return []
    return analisePorBandeira.value.map(b => ({
      bandeira: b.bandeira,
      margemBruta: b.margemBruta || 0,
      taxaEfetiva: (b.custoTaxa / b.receitaBruta * 100) || 0,
      receitaBruta: b.receitaBruta,
      receitaLiquida: b.receitaLiquida,
      custoTaxa: b.custoTaxa,
      quantidade: b.quantidade,
      classificacao: (b.margemBruta || 0) >= 95 ? 'Alta' : (b.margemBruta || 0) >= 90 ? 'Média' : 'Baixa',
    })).sort((a, b) => b.margemBruta - a.margemBruta)
  })

  const analiseModalidades = computed(() => {
    const modalidades = {}
    if (!analisePorBandeira.value) return []
    analisePorBandeira.value.forEach(b => {
      if (b.modalidades) {
        Object.values(b.modalidades).forEach(m => {
          if (!modalidades[m.modalidade]) modalidades[m.modalidade] = { modalidade: m.modalidade, quantidade: 0, receitaBruta: 0, receitaLiquida: 0, custoTaxa: 0, taxaEfetiva: 0 }
          const ref = modalidades[m.modalidade]
          ref.quantidade += m.quantidade
          ref.receitaBruta += m.receitaBruta
          ref.receitaLiquida += m.receitaLiquida
          ref.custoTaxa += m.custoTaxa
        })
      }
    })
    Object.values(modalidades).forEach(m => { m.taxaEfetiva = m.receitaBruta > 0 ? (m.custoTaxa / m.receitaBruta * 100) : 0; m.margemBruta = m.receitaBruta > 0 ? ((m.receitaLiquida / m.receitaBruta) * 100) : 0 })
    return Object.values(modalidades).sort((a, b) => b.receitaBruta - a.receitaBruta)
  })

  const indicadoresFinanceiros = computed(() => {
    if (!dreConsolidada.value) return { receitaBruta: 0, receitaLiquida: 0, custoTaxa: 0, margemBruta: 0, taxaEfetiva: 0, ticketMedioBruto: 0, ticketMedioLiquido: 0, totalTransacoes: 0 }
    const total = dreConsolidada.value
    const quantidade = total.quantidade || 0
    return {
      receitaBruta: total.receitaBruta || 0,
      receitaLiquida: total.receitaLiquida || 0,
      custoTaxa: total.custoTaxa || 0,
      margemBruta: total.margemBruta || 0,
      taxaEfetiva: total.taxaEfetiva || 0,
      ticketMedioBruto: quantidade > 0 ? (total.receitaBruta / quantidade) : 0,
      ticketMedioLiquido: quantidade > 0 ? (total.receitaLiquida / quantidade) : 0,
      totalTransacoes: quantidade
    }
  })

  const comparativosTemporais = computed(() => {
    if (!analiseTemporal.value || analiseTemporal.value.length < 2) return { percentReceita: 0, percentCustos: 0, mesAtual: '', mesAnterior: '' }
    const periodos = analiseTemporal.value
    const atual = periodos[periodos.length - 1]
    const anterior = periodos[periodos.length - 2]
    const percentReceita = anterior.receitaBruta > 0 ? ((atual.receitaBruta - anterior.receitaBruta) / anterior.receitaBruta * 100) : 0
    const percentCustos = anterior.custoTaxa > 0 ? ((atual.custoTaxa - anterior.custoTaxa) / anterior.custoTaxa * 100) : 0
    const [anoA, mesA] = (atual.periodo || '').split('-').map(Number)
    const [anoB, mesB] = (anterior.periodo || '').split('-').map(Number)
    const mesAtual = isNaN(anoA) ? '' : new Date(anoA, (mesA || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
    const mesAnterior = isNaN(anoB) ? '' : new Date(anoB, (mesB || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
    return { percentReceita, percentCustos, mesAtual, mesAnterior }
  })

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0)
  const formatarPercentual = (valor) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((valor || 0) / 100)

  const gerarFeedbackTemporal = () => {
    const c = comparativosTemporais.value
    const receitasTexto = c.percentReceita >= 0 ? `Suas vendas cresceram ${formatarPercentual(c.percentReceita)} em relação ao mês de ${c.mesAnterior}` : `Suas vendas diminuíram ${formatarPercentual(Math.abs(c.percentReceita))} em relação ao mês de ${c.mesAnterior}`
    const custosTexto = c.percentCustos >= 0 ? `Suas despesas aumentaram ${formatarPercentual(c.percentCustos)} em relação ao mês de ${c.mesAnterior}` : `Suas despesas diminuíram ${formatarPercentual(Math.abs(c.percentCustos))} em relação ao mês de ${c.mesAnterior}`
    return { receitasTexto, custosTexto, ...c }
  }

  return { lucratividadePorBandeira, analiseModalidades, indicadoresFinanceiros, comparativosTemporais, formatarMoeda, formatarPercentual, gerarFeedbackTemporal }
}