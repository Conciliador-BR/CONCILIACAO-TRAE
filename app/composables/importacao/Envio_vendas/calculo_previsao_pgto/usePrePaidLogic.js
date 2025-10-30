import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Lógica específica para transações pré-pagas
 */
export const usePrePaidLogic = () => {
  const { criarDataSegura, formatarDataParaBanco } = useDateUtils()
  const { adicionarDiasUteis } = useHolidayUtils()

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
   */
  const calcularPrevisaoPrePago = (venda) => {
    const tipoPrePago = getTipoPrePago(venda.modalidade)
    const dataVenda = venda.data_venda ?? venda.dataVenda ?? venda.data
    
    if (!dataVenda) {
      return null
    }

    // Converter data de venda para formato de previsão
    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate) {
      return null
    }

    let dataPrevisao
    
    if (tipoPrePago === 'debito') {
      // 1- pré-pago débito = débito (+1 dia útil)
      dataPrevisao = adicionarDiasUteis(dataVendaDate, 1)
    } else if (tipoPrePago === 'credito') {
      // 2- pré-pago crédito = crédito (2 dias úteis)
      dataPrevisao = adicionarDiasUteis(dataVendaDate, 2)
    } else {
      // Pré-pago genérico (mesmo dia)
      dataPrevisao = new Date(dataVendaDate)
    }

    return formatarDataParaBanco(dataPrevisao)
  }

  return {
    isPrePago,
    getTipoPrePago,
    calcularPrevisaoPrePago
  }
}