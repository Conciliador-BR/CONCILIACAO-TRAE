import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { useTaxOperations } from './useTaxOperations.js'
import { usePaymentCalculation } from './usePaymentCalculation.js'
import { usePrePaidLogic } from './usePrePaidLogic.js'
import { useInstallmentLogic } from './useInstallmentLogic.js'
import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Composable principal para cálculo de previsão de pagamento
 * Orquestra todos os outros componentes
 */
export const usePrevisaoPagamentoCore = () => {
  const { insertData } = useAPIsupabase()
  const { taxas, encontrarTaxa, carregarTaxas } = useTaxOperations()
  const { calcularDataPagamento } = usePaymentCalculation()
  const { isPrePago, calcularPrevisaoPrePago } = usePrePaidLogic()
  const { isParcelado, calcularPrevisaoParcelada, limparCacheParcelas, testarLogicaLotes } = useInstallmentLogic()
  const { criarDataSegura, formatarDataParaBanco } = useDateUtils()
  const { adicionarDiasUteis, adicionarDiasCorridos, ajustarParaProximoDiaUtil } = useHolidayUtils()

  /**
   * Função para verificar se é débito simples (não pré-pago)
   */
  const isDebitoSimples = (modalidade) => {
    if (!modalidade) return false
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    
    // Deve conter "debito" mas NÃO deve ser pré-pago
    const contemDebito = modalidadeNormalizada.includes('debito')
    const ehPrePago = modalidadeNormalizada.includes('prepago')
    
    return contemDebito && !ehPrePago
  }

  /**
   * Função para verificar se é crédito à vista (não parcelado, não pré-pago)
   */
  const isCredito = (modalidade) => {
    if (!modalidade) return false
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    
    // Deve conter "credito" mas NÃO deve ser parcelado nem pré-pago
    const contemCredito = modalidadeNormalizada.includes('credito')
    const ehParcelado = modalidadeNormalizada.includes('parcelado')
    const ehPrePago = modalidadeNormalizada.includes('prepago')
    
    return contemCredito && !ehParcelado && !ehPrePago
  }

  /**
   * Calcular previsão para débito simples (D+1 dia útil)
   */
  const calcularPrevisaoDebitoSimples = (venda) => {
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
    
    if (!dataVenda) {
      return null
    }

    // Converter data de venda para formato de previsão
    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate) {
      return null
    }

    // Débito simples: D+1 dia e depois ajustar para próximo dia útil
    const dataVendaMais1 = new Date(dataVendaDate)
    dataVendaMais1.setDate(dataVendaMais1.getDate() + 1)
    
    const dataPrevisao = ajustarParaProximoDiaUtil(dataVendaMais1)
    
    return formatarDataParaBanco(dataPrevisao)
  }

  /**
   * Calcular previsão para crédito à vista (D+31 dias corridos + ajuste para dia útil)
   */
  const calcularPrevisaoCredito = (venda) => {
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
    
    if (!dataVenda) {
      return null
    }

    // Converter data de venda para formato de previsão
    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate) {
      return null
    }

    // Crédito à vista: D+31 dias corridos + ajuste para próximo dia útil
    const dataComDias = adicionarDiasCorridos(dataVendaDate, 31)
    const dataPrevisao = ajustarParaProximoDiaUtil(dataComDias)
    
    return formatarDataParaBanco(dataPrevisao)
  }

  /**
   * Função principal para calcular previsão de venda
   */
  const calcularPrevisaoVenda = (venda) => {
    try {
      const taxa = encontrarTaxa(venda)
      if (!taxa || taxa.data_corte === null || taxa.data_corte === undefined) {
        return null
      }

      const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
      if (!dataVenda) return null

      const ehParcelado = isParcelado(venda.modalidade)
      const nParcelas = parseInt(venda.numero_parcelas) || 1
      if (ehParcelado || nParcelas > 1) {
        return calcularPrevisaoParcelada(venda, taxa.data_corte)
      }

      const dataPrevisaoDate = calcularDataPagamento(dataVenda, taxa.data_corte, venda)
      if (!dataPrevisaoDate) {
        return null
      }
      return formatarDataParaBanco(dataPrevisaoDate)
    } catch (err) {
      console.error('Erro ao calcular previsão de venda:', err)
      return null
    }
  }

  /**
   * Função para criar previsões de pagamento
   */
  const criarPrevisoesPagamento = async (vendasInseridas) => {
    try {
      const previsoes = vendasInseridas.map(venda => {
        // Usar a função de cálculo de previsão
        const dataPrevisaoFormatada = calcularPrevisaoVenda(venda)
        
        if (!dataPrevisaoFormatada) {
          return null
        }
        
        return {
          venda_id: venda.id,
          data_venda: venda.data_venda,
          data_previsao_pagamento: dataPrevisaoFormatada,
          valor_bruto: venda.valor_bruto,
          valor_liquido: venda.valor_liquido,
          empresa: venda.empresa,
          adquirente: venda.adquirente,
          bandeira: venda.bandeira,
          modalidade: venda.modalidade,
          nsu: venda.nsu,
          status_pagamento: 'pendente',
          created_at: new Date().toISOString()
        }
      }).filter(Boolean) // Remove itens null
      
      if (previsoes.length === 0) {
        console.log('Nenhuma previsão válida para inserir')
        return
      }
      
      // Inserir previsões na tabela previsao_pgto
      const resultadoPrevisoes = await insertData('previsao_pgto', previsoes)
      console.log(`${previsoes.length} previsões de pagamento criadas com sucesso`)
      
    } catch (error) {
      console.error('Erro ao criar previsões de pagamento:', error)
      // Não falhar o processo principal se as previsões falharem
    }
  }

  return {
    // Estados
    taxas,
    
    // Métodos principais
    calcularPrevisaoVenda,
    criarPrevisoesPagamento,
    carregarTaxas,
    calcularDataPagamento,
    encontrarTaxa,
    limparCacheParcelas,
    calcularPrevisaoDebitoSimples,
    calcularPrevisaoCredito,
    
    // Métodos auxiliares para pré-pago
    isPrePago,
    isParcelado,
    isDebitoSimples,
    isCredito,
    
    // Função de teste para validar lógica de lotes
    testarLogicaLotes
  }
}