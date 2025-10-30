import { useDateUtils } from './useDateUtils.js'
import { useHolidayUtils } from './useHolidayUtils.js'

/**
 * Cálculos principais de previsão de pagamento
 */
export const usePaymentCalculation = () => {
  const { criarDataSegura } = useDateUtils()
  const { ehFeriado } = useHolidayUtils()

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

    // Converter dataVenda para objeto Date de forma segura
    let dataVendaDate = criarDataSegura(dataVenda)
    if (!dataVendaDate || isNaN(dataVendaDate.getTime())) {
      return null
    }
    
    // 1️⃣ Determinar a data de fechamento do lote (último dia do mês da venda)
    const dataFechamentoLote = new Date(dataVendaDate.getFullYear(), dataVendaDate.getMonth() + 1, 0)
    
    // 2️⃣ Calcular data de vencimento: fechamento do lote + data_corte (geralmente 30 dias)
    const dataVencimento = new Date(dataFechamentoLote)
    dataVencimento.setDate(dataVencimento.getDate() + parseInt(dataCorte))
    
    // 3️⃣ Determinar o mês de pagamento (mês seguinte ao vencimento)
    const mesPagamento = dataVencimento.getMonth() + 1
    const anoPagamento = dataVencimento.getFullYear()
    
    // 4️⃣ Encontrar o 1º dia útil do mês de pagamento
    let dataPagamento = new Date(anoPagamento, mesPagamento, 1)
    
    // Ajustar para o primeiro dia útil do mês
    while (dataPagamento.getDay() === 0 || dataPagamento.getDay() === 6 || ehFeriado(dataPagamento)) {
      dataPagamento.setDate(dataPagamento.getDate() + 1)
    }

    // 🔍 DEBUG: Log da lógica de lotes (remover em produção)
    console.log('🧩 Lógica de Lotes:', {
      dataVenda: dataVendaDate.toISOString().split('T')[0],
      fechamentoLote: dataFechamentoLote.toISOString().split('T')[0],
      dataCorte: dataCorte,
      dataVencimento: dataVencimento.toISOString().split('T')[0],
      dataPagamento: dataPagamento.toISOString().split('T')[0]
    })

    return dataPagamento
  }

  return {
    calcularDataPagamento
  }
}