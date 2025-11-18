import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Cálculos principais de previsão de pagamento
 */
export const usePaymentCalculation = () => {
  const { criarDataSegura } = useDateUtils()
  const { adicionarDiasCorridos } = useHolidayUtils()

  /**
   * Função para calcular data de pagamento
   * 🧩 LÓGICA DE LOTES MENSAIS DAS OPERADORAS
   * 
   * Como funciona na prática:
   * 1. Vendas são agrupadas em LOTES MENSAIS (não por data individual)
   * 2. O lote fecha no ÚLTIMO DIA DO MÊS da venda
   * 3. O prazo (ex: 30 dias) é contado a partir do FECHAMENTO DO LOTE
   * 4. O pagamento ocorre no 1º DIA ÚTIL do mês seguinte ao vencimento
   *
   * Exemplo: Venda em 31/05/2025
   * - Lote fecha: 31/05/2025 (último dia de maio)
   * - Vencimento: 31/05 + 30 dias = 30/06/2025
   * - Pagamento: 1º dia útil de julho = 01/07/2025
   */
  const calcularDataPagamento = (dataVenda, dataCorte, venda = null) => {
    if (!dataVenda || dataCorte === null || dataCorte === undefined) {
      return null
    }

    const dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate || isNaN(dataVendaDate.getTime())) {
      return null
    }

    const dias = parseInt(dataCorte)
    if (!Number.isFinite(dias)) {
      return null
    }

    return adicionarDiasCorridos(dataVendaDate, dias)
  }

  return {
    calcularDataPagamento
  }
}