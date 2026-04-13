import { usePrevisaoPagamentoCore } from './calculo_previsao_pgto/usePrevisaoPagamentoCore.js'

/**
 * Composable principal para cálculo de previsão de pagamento
 * Agora utiliza a estrutura componentizada para melhor organização e manutenibilidade
 */
export const usePrevisaoPagamento = () => {
  return usePrevisaoPagamentoCore()
}