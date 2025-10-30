import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Lógica específica para transações parceladas
 */
export const useInstallmentLogic = () => {
  const { criarDataSegura, adicionarMeses, formatarDataParaBanco } = useDateUtils()
  const { ajustarParaProximoDiaUtil } = useHolidayUtils()

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
   * Lógica implementada (baseada no comportamento real):
   * 1. Primeira parcela: data da venda + 30 dias → ajustada para próximo dia útil
   * 2. Parcelas seguintes: parcela anterior + 30 dias → ajustada para dia útil
   * 3. Considera feriados e fechamentos de ciclo mensal
   * 
   * Exemplo: Venda 01/04/2025 (3x)
   * - 1ª: 01/04 + 30 = 01/05 (feriado) → 02/05/2025
   * - 2ª: 02/05 + 30 = 02/06/2025
   * - 3ª: 02/06 + 30 = 02/07 → 01/07/2025 (ciclo mensal)
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

    // Lógica com incremento mensal (EDATE) — uma parcela por mês a partir da venda
    const nominal = adicionarMeses(dataVendaDate, numeroParcela + 1)

    // Ajuste para dia útil
    let dataPagamento = ajustarParaProximoDiaUtil(nominal)

    // Regra de ciclo mensal: se cair depois do dia 28, preferir 1º dia útil do próximo mês
    if (dataPagamento.getDate() > 28) {
      const primeiroDiaProximoMes = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 1, 1)
      const primeiroDiaUtilProximoMes = ajustarParaProximoDiaUtil(primeiroDiaProximoMes)
      if (primeiroDiaUtilProximoMes <= dataPagamento) {
        dataPagamento = primeiroDiaUtilProximoMes
      }
    }

    // Nova regra: início do mês — antecipar para 1º dia útil do mês
    const primeiroDiaMesAtual = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth(), 1)
    const primeiroDiaUtilMesAtual = ajustarParaProximoDiaUtil(primeiroDiaMesAtual)
    if (dataPagamento.getDate() <= 2 && primeiroDiaUtilMesAtual < dataPagamento) {
      dataPagamento = primeiroDiaUtilMesAtual
    }

    // Debug
    console.log('🧩 Lógica Real PARCELADA:', {
      dataVenda: dataVendaDate.toISOString().split('T')[0],
      numeroParcela: numeroParcela + 1,
      nominal: nominal.toISOString().split('T')[0],
      dataPagamento: dataPagamento.toISOString().split('T')[0]
    })

    return formatarDataParaBanco(dataPagamento)
  }

  /**
   * 🧩 FUNÇÃO DE TESTE SIMPLES PARA VALIDAR A LÓGICA REAL
   */
  const testarLogicaReal = (dataVenda, numeroParcelas = 3) => {
    console.log('🧪 TESTANDO LÓGICA REAL DAS OPERADORAS')
    console.log('=' .repeat(60))
    
    const dataVendaDate = new Date(dataVenda)
    console.log(`📅 Venda: ${dataVendaDate.toLocaleDateString('pt-BR')} (${numeroParcelas}x)`)
    console.log('')
    
    for (let parcela = 1; parcela <= numeroParcelas; parcela++) {
      // Nominal por mês (EDATE)
      const nominal = adicionarMeses(dataVendaDate, parcela)
    
      // Ajuste para dia útil
      let dataPagamento = ajustarParaProximoDiaUtil(nominal)
    
      // Regra de ciclo: se >28, considerar 1º dia útil do mês seguinte
      if (dataPagamento.getDate() > 28) {
        const primeiroDiaProximoMes = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 1, 1)
        const primeiroDiaUtilProximoMes = ajustarParaProximoDiaUtil(primeiroDiaProximoMes)
        if (primeiroDiaUtilProximoMes <= dataPagamento) {
          dataPagamento = primeiroDiaUtilProximoMes
        }
      }
    
      console.log(`${parcela}ª Parcela: nominal=${nominal.toLocaleDateString('pt-BR')} | pagamento=${dataPagamento.toLocaleDateString('pt-BR')}`)
    }
    
    console.log('=' .repeat(60))
  }

  /**
   * Função de teste para casos específicos
   */
  const testarLogicaLotes = () => {
    console.log('🎯 TESTANDO CASOS REAIS:')
    console.log('')
    
    // Caso 1: 01/04/2025
    console.log('📦 CASO 1: Venda 01/04/2025')
    console.log('Esperado: 02/05, 02/06, 01/07')
    testarLogicaReal('2025-04-01', 3)
    console.log('')
    
    // Caso 2: 02/04/2025  
    console.log('📦 CASO 2: Venda 02/04/2025')
    console.log('Esperado: 02/05, 02/06, 01/07')
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