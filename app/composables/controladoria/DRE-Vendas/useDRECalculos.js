import { computed } from 'vue'

export const useDRECalculos = (analisePorBandeira, dreConsolidada, analiseTemporal) => {
  
  // Computed para análise de lucratividade por bandeira
  const lucratividadePorBandeira = computed(() => {
    if (!analisePorBandeira.value || analisePorBandeira.value.length === 0) {
      return []
    }
    
    return analisePorBandeira.value.map(bandeira => {
      const margemBruta = bandeira.margemBruta || 0
      const taxaEfetiva = (bandeira.custoTaxa / bandeira.receitaBruta * 100) || 0
      
      return {
        bandeira: bandeira.bandeira,
        margemBruta: margemBruta,
        taxaEfetiva: taxaEfetiva,
        receitaBruta: bandeira.receitaBruta,
        receitaLiquida: bandeira.receitaLiquida,
        custoTaxa: bandeira.custoTaxa,
        quantidade: bandeira.quantidade,
        // Classificação de lucratividade
        classificacao: margemBruta >= 95 ? 'Alta' : margemBruta >= 90 ? 'Média' : 'Baixa',
        corLucratividade: margemBruta >= 95 ? '#10b981' : margemBruta >= 90 ? '#f59e0b' : '#ef4444'
      }
    }).sort((a, b) => b.margemBruta - a.margemBruta)
  })
  
  // Computed para análise de modalidades de pagamento
  const analiseModalidades = computed(() => {
    const modalidades = {}
    
    if (!analisePorBandeira.value) return []
    
    analisePorBandeira.value.forEach(bandeira => {
      if (bandeira.modalidades) {
        Object.values(bandeira.modalidades).forEach(modal => {
          if (!modalidades[modal.modalidade]) {
            modalidades[modal.modalidade] = {
              modalidade: modal.modalidade,
              quantidade: 0,
              receitaBruta: 0,
              receitaLiquida: 0,
              custoTaxa: 0,
              taxaEfetiva: 0
            }
          }
          
          const mod = modalidades[modal.modalidade]
          mod.quantidade += modal.quantidade
          mod.receitaBruta += modal.receitaBruta
          mod.receitaLiquida += modal.receitaLiquida
          mod.custoTaxa += modal.custoTaxa
        })
      }
    })
    
    // Calcular taxas efetivas
    Object.values(modalidades).forEach(modal => {
      modal.taxaEfetiva = modal.receitaBruta > 0 ? (modal.custoTaxa / modal.receitaBruta * 100) : 0
      modal.margemBruta = modal.receitaBruta > 0 ? ((modal.receitaLiquida / modal.receitaBruta) * 100) : 0
    })
    
    return Object.values(modalidades).sort((a, b) => b.receitaBruta - a.receitaBruta)
  })
  
  // Computed para indicadores financeiros
  const indicadoresFinanceiros = computed(() => {
    if (!dreConsolidada.value) {
      return {
        receitaBruta: 0,
        receitaLiquida: 0,
        custoTaxa: 0,
        margemBruta: 0,
        taxaEfetiva: 0,
        ticketMedioBruto: 0,
        ticketMedioLiquido: 0,
        totalTransacoes: 0
      }
    }
    
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
  
  // Computed para tendências
  const tendencias = computed(() => {
    if (!analiseTemporal.value || analiseTemporal.value.length < 2) {
      return {
        crescimentoReceita: 0,
        crescimentoMargem: 0,
        tendenciaMargem: 'estável',
        tendenciaReceita: 'estável'
      }
    }
    
    const periodos = analiseTemporal.value
    const periodoAtual = periodos[periodos.length - 1]
    const periodoAnterior = periodos[periodos.length - 2]
    
    const crescimentoReceita = periodoAnterior.receitaBruta > 0 
      ? ((periodoAtual.receitaBruta - periodoAnterior.receitaBruta) / periodoAnterior.receitaBruta * 100)
      : 0
      
    const crescimentoMargem = periodoAnterior.margemBruta > 0
      ? ((periodoAtual.margemBruta - periodoAnterior.margemBruta) / periodoAnterior.margemBruta * 100)
      : 0
    
    return {
      crescimentoReceita,
      crescimentoMargem,
      tendenciaMargem: crescimentoMargem > 5 ? 'alta' : crescimentoMargem < -5 ? 'baixa' : 'estável',
      tendenciaReceita: crescimentoReceita > 10 ? 'alta' : crescimentoReceita < -10 ? 'baixa' : 'estável'
    }
  })

  const comparativosTemporais = computed(() => {
    if (!analiseTemporal.value || analiseTemporal.value.length < 2) {
      return {
        percentReceita: 0,
        percentCustos: 0,
        mesAtual: '',
        mesAnterior: ''
      }
    }
    const periodos = analiseTemporal.value
    const atual = periodos[periodos.length - 1]
    const anterior = periodos[periodos.length - 2]
    const percentReceita = anterior.receitaBruta > 0 
      ? ((atual.receitaBruta - anterior.receitaBruta) / anterior.receitaBruta * 100) 
      : 0
    const percentCustos = anterior.custoTaxa > 0 
      ? ((atual.custoTaxa - anterior.custoTaxa) / anterior.custoTaxa * 100) 
      : 0
    const [anoA, mesA] = (atual.periodo || '').split('-').map(Number)
    const [anoB, mesB] = (anterior.periodo || '').split('-').map(Number)
    const mesAtual = isNaN(anoA) ? '' : new Date(anoA, (mesA || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
    const mesAnterior = isNaN(anoB) ? '' : new Date(anoB, (mesB || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
    return { percentReceita, percentCustos, mesAtual, mesAnterior }
  })

  const gerarFeedbackTemporal = () => {
    const c = comparativosTemporais.value
    const receitasTexto = c.percentReceita >= 0 
      ? `Suas vendas cresceram ${formatarPercentual(c.percentReceita)} em relação ao mês de ${c.mesAnterior}`
      : `Suas vendas diminuíram ${formatarPercentual(Math.abs(c.percentReceita))} em relação ao mês de ${c.mesAnterior}`
    const custosTexto = c.percentCustos >= 0 
      ? `Suas despesas aumentaram ${formatarPercentual(c.percentCustos)} em relação ao mês de ${c.mesAnterior}`
      : `Suas despesas diminuíram ${formatarPercentual(Math.abs(c.percentCustos))} em relação ao mês de ${c.mesAnterior}`
    return { receitasTexto, custosTexto, ...c }
  }
  
  // Função auxiliar para formatação monetária
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor || 0)
  }
  
  // Função auxiliar para formatação percentual
  const formatarPercentual = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format((valor || 0) / 100)
  }
  
  // Função para calcular comparação entre períodos
  const calcularComparacaoPeriodos = (periodoAtual, periodoAnterior) => {
    if (!periodoAnterior || periodoAnterior.receitaBruta === 0) {
      return {
        variacaoReceita: 0,
        variacaoMargem: 0,
        status: 'neutro'
      }
    }
    
    const variacaoReceita = ((periodoAtual.receitaBruta - periodoAnterior.receitaBruta) / periodoAnterior.receitaBruta) * 100
    const variacaoMargem = ((periodoAtual.margemBruta - periodoAnterior.margemBruta) / periodoAnterior.margemBruta) * 100
    
    return {
      variacaoReceita,
      variacaoMargem,
      status: variacaoReceita > 0 ? 'positivo' : variacaoReceita < 0 ? 'negativo' : 'neutro'
    }
  }
  
  // Função para gerar resumo executivo
  const gerarResumoExecutivo = () => {
    const indicadores = indicadoresFinanceiros.value
    const lucratividade = lucratividadePorBandeira.value
    const tend = tendencias.value
    
    return {
      resumo: `Receita Bruta: ${formatarMoeda(dreConsolidada.value.receitaBruta)} | Receita Líquida: ${formatarMoeda(dreConsolidada.value.receitaLiquida)} | Margem: ${formatarPercentual(indicadores.margemBruta)}`,
      destaques: [
        `Ticket Médio: ${formatarMoeda(indicadores.ticketMedioBruto)}`,
        `Taxa Efetiva: ${formatarPercentual(indicadores.taxaEfetiva)}`,
        `Total Transações: ${indicadores.totalTransacoes.toLocaleString('pt-BR')}`
      ],
      alertas: [
        ...(tend.crescimentoMargem < -5 ? ['Margem em queda'] : []),
        ...(indicadores.taxaEfetiva > 5 ? ['Taxas elevadas'] : []),
        ...(lucratividade.length > 0 && lucratividade[0].margemBruta < 90 ? ['Lucratividade baixa'] : [])
      ]
    }
  }
  
  return {
    // Computed
    lucratividadePorBandeira,
    analiseModalidades,
    indicadoresFinanceiros,
    tendencias,
    comparativosTemporais,
    
    // Funções
    formatarMoeda,
    formatarPercentual,
    calcularComparacaoPeriodos,
    gerarResumoExecutivo,
    gerarFeedbackTemporal
  }
}