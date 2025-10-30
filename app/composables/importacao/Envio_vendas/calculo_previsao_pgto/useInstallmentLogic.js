import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Lógica específica para transações parceladas
 */
export const useInstallmentLogic = () => {
  const { criarDataSegura, adicionarMeses, formatarDataParaBanco } = useDateUtils()
  const { ajustarParaProximoDiaUtil, adicionarDiasCorridos } = useHolidayUtils()

  // Cache para controlar parcelas já processadas
  const parcelasProcessadas = new Map()

  /**
   * Função para verificar se é modalidade parcelada
   */
  const isParcelado = (modalidade) => {
    if (!modalidade) return false
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    return modalidadeNormalizada.includes('parcelado')
  }

  /**
   * Função para limpar cache de parcelas processadas
   */
  const limparCacheParcelas = () => {
    parcelasProcessadas.clear()
    console.log('🧹 Cache de parcelas processadas limpo')
  }

  /**
   * 📦 CALCULA PREVISÃO PARA VENDAS PARCELADAS - LÓGICA REAL DAS OPERADORAS
   * 
   * Lógica implementada (baseada nas informações das adquirentes):
   * - 1ª parcela: data da venda + 30 dias úteis
   * - 2ª parcela: data da venda + 60 dias úteis  
   * - 3ª parcela: data da venda + 90 dias úteis
   * - 4ª parcela: data da venda + 120 dias úteis
   * - E assim por diante (incremento de 30 dias úteis)
   * 
   * Exemplo: Venda 01/04/2025 (3x)
   * - 1ª: 01/04 + 30 dias úteis
   * - 2ª: 01/04 + 60 dias úteis
   * - 3ª: 01/04 + 90 dias úteis
   */
  const calcularPrevisaoParcelada = (venda) => {
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
    const nsu = venda.nsu
    const valorBruto = venda.valor_bruto || 0

    if (!dataVenda) return null
    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate) return null

    // Criar chave única para identificar o grupo de parcelas (NSU + data)
    const chaveGrupo = `${nsu}_${dataVenda}`

    // Verificar se já processamos parcelas deste grupo
    if (!parcelasProcessadas.has(chaveGrupo)) {
      parcelasProcessadas.set(chaveGrupo, {
        parcelas: [],
        proximaParcela: 0
      })
    }
    
    const grupoInfo = parcelasProcessadas.get(chaveGrupo)

    grupoInfo.parcelas.push({
      valor: valorBruto,
      venda: venda
    })
    
    // Determinar qual parcela é esta baseada na ordem de processamento
    const numeroParcela = grupoInfo.proximaParcela
    grupoInfo.proximaParcela++

    // Nova lógica: 30/60/90/120 dias corridos conforme adquirentes
    // 1ª parcela = 30 dias corridos, 2ª = 60 dias corridos, etc.
    const diasCorridos = (numeroParcela + 1) * 30
    const dataPagamentoTemp = adicionarDiasCorridos(dataVendaDate, diasCorridos)
    const dataPagamento = ajustarParaProximoDiaUtil(dataPagamentoTemp)

    // Debug
    console.log('🧩 Lógica PARCELADA (30/60/90/120):', {
      dataVenda: dataVendaDate.toISOString().split('T')[0],
      numeroParcela: numeroParcela + 1,
      diasCorridos: diasCorridos,
      dataPagamento: dataPagamento.toISOString().split('T')[0]
    })

    return formatarDataParaBanco(dataPagamento)
  }

  /**
   * 🧩 FUNÇÃO DE TESTE PARA VALIDAR A NOVA LÓGICA (30/60/90/120 DIAS CORRIDOS + AJUSTE)
   */
  const testarLogicaReal = (dataVenda, numeroParcelas = 3) => {
    console.log('🧪 TESTANDO NOVA LÓGICA DAS OPERADORAS (30/60/90/120 DIAS CORRIDOS + AJUSTE)')
    console.log('=' .repeat(60))
    
    const dataVendaDate = new Date(dataVenda)
    console.log(`📅 Venda: ${dataVendaDate.toLocaleDateString('pt-BR')} (${numeroParcelas}x)`)
    console.log('')
    
    for (let parcela = 1; parcela <= numeroParcelas; parcela++) {
      // Nova lógica: 30/60/90/120 dias corridos + ajuste para dia útil
      const diasCorridos = parcela * 30
      const dataPagamentoTemp = adicionarDiasCorridos(dataVendaDate, diasCorridos)
      const dataPagamento = ajustarParaProximoDiaUtil(dataPagamentoTemp)
    
      console.log(`${parcela}ª Parcela: +${diasCorridos} dias corridos + ajuste = ${dataPagamento.toLocaleDateString('pt-BR')}`)
    }
    
    console.log('=' .repeat(60))
  }

  /**
   * Função de teste para casos específicos
   */
  const testarLogicaLotes = () => {
    console.log('🎯 TESTANDO CASOS REAIS COM NOVA LÓGICA:')
    console.log('')
    
    // Caso 1: 01/04/2025
    console.log('📦 CASO 1: Venda 01/04/2025')
    console.log('Nova lógica: 30/60/90 dias corridos + ajuste')
    testarLogicaReal('2025-04-01', 3)
    console.log('')
    
    // Caso 2: 02/04/2025  
    console.log('📦 CASO 2: Venda 02/04/2025')
    console.log('Nova lógica: 30/60/90 dias corridos + ajuste')
    testarLogicaReal('2025-04-02', 3)
  }

  return {
    isParcelado,
    limparCacheParcelas,
    calcularPrevisaoParcelada,
    testarLogicaReal,
    testarLogicaLotes
  }
}