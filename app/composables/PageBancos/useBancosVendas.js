// Arquivo principal que utiliza os composables componentizados
import { useBuscaVendasPrevistas } from './busca_de_vendas_previstas/useBuscaVendasPrevistas'

export const useBancosVendas = () => {
  // Delegar toda a funcionalidade para o composable componentizado
  return useBuscaVendasPrevistas()
}