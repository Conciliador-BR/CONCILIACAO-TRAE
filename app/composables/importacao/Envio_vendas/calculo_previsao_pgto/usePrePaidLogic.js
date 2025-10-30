import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Lógica específica para transações pré-pagas
 */
export const usePrePaidLogic = () => {
  const { criarDataSegura, formatarDataParaBanco } = useDateUtils()
  const { adicionarDiasCorridos, ajustarParaProximoDiaUtil } = useHolidayUtils()

  /**
   * Função para verificar se é modalidade pré-pago
   */
  const isPrePago = (modalidade) => {
    if (!modalidade) return false
    
    // Normalizar: remover acentos, espaços e caracteres especiais
    const modalidadeNormalizada = modalidade
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z]/g, '') // Remove espaços e caracteres especiais
    
    // Deve conter "prepago" para ser considerado pré-pago
    const ehPrePago = modalidadeNormalizada.includes('prepago')
    
    return ehPrePago
  }

  /**
   * Função para determinar tipo de pré-pago
   */
  const getTipoPrePago = (modalidade) => {
    if (!modalidade) return null
    const modalidadeNormalizada = modalidade.toLowerCase().replace(/[^a-z]/g, '')
    
    if (modalidadeNormalizada.includes('debito') || modalidadeNormalizada.includes('débito')) {
      return 'debito'
    }
    if (modalidadeNormalizada.includes('credito') || modalidadeNormalizada.includes('crédito')) {
      return 'credito'
    }
    return null
  }

  /**
   * Calcular previsão para transações pré-pagas
   * Baseado nas informações das adquirentes:
   * - Débito pré-pago: D+1 dia útil
   * - Crédito pré-pago: D+2 dias úteis
   */
  const calcularPrevisaoPrePago = (venda) => {
    const tipoPrePago = getTipoPrePago(venda.modalidade)
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
    
    console.log('🔍 DEBUG calcularPrevisaoPrePago:', {
      modalidade: venda.modalidade,
      tipoPrePago: tipoPrePago,
      dataVenda: dataVenda,
      nsu: venda.nsu
    })
    
    if (!dataVenda) {
      console.log('❌ PRÉ-PAGO: Data de venda não encontrada')
      return null
    }

    // Converter data de venda para formato de previsão
    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate) {
      return null
    }

    let dataPrevisao
    
    if (tipoPrePago === 'debito') {
      // Pré-pago débito: MESMA LÓGICA DO DÉBITO SIMPLES (D+1 e ajustar para próximo dia útil)
      const dataVendaMais1 = new Date(dataVendaDate)
      dataVendaMais1.setDate(dataVendaMais1.getDate() + 1)
      dataPrevisao = ajustarParaProximoDiaUtil(dataVendaMais1)
    } else if (tipoPrePago === 'credito') {
      // Pré-pago crédito: MESMA LÓGICA DO DÉBITO, mas com D+2 dias corridos + ajuste para próximo dia útil
      const dataVendaMais2 = new Date(dataVendaDate)
      dataVendaMais2.setDate(dataVendaMais2.getDate() + 2)
      dataPrevisao = ajustarParaProximoDiaUtil(dataVendaMais2)
    } else {
      // Genérico: D+1 dia corrido + ajuste para dia útil
      const dataVendaMais1 = new Date(dataVendaDate)
      dataVendaMais1.setDate(dataVendaMais1.getDate() + 1)
      dataPrevisao = ajustarParaProximoDiaUtil(dataVendaMais1)
    }

    const resultado = formatarDataParaBanco(dataPrevisao)
    console.log('✅ PRÉ-PAGO resultado:', {
      tipoPrePago: tipoPrePago,
      dataPrevisao: dataPrevisao.toISOString().split('T')[0],
      resultado: resultado
    })

    return resultado
  }

  return {
    isPrePago,
    getTipoPrePago,
    calcularPrevisaoPrePago
  }
}