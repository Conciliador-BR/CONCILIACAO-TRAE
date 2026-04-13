import { ref } from 'vue'
import { useProcessamentoArquivos } from './useProcessamentoArquivos'
import { useEnvioVendas } from './useEnvioVendas'
import { usePrevisaoPagamento } from './usePrevisaoPagamento'

export const useImportacao = () => {
  // Usar os composables componentizados
  const {
    importando,
    vendasProcessadas,
    progresso,
    operadoras,
    processarArquivo,
    lerArquivo
  } = useProcessamentoArquivos()

  const {
    enviando,
    enviarVendasParaSupabase
  } = useEnvioVendas()

  const {
    calcularPrevisaoVenda,
    carregarTaxas
  } = usePrevisaoPagamento()

  return {
    // Estados
    importando,
    enviando,
    vendasProcessadas,
    progresso,
    operadoras,
    
    // Métodos
    processarArquivo,
    enviarVendasParaSupabase,
    lerArquivo,
    calcularPrevisaoVenda,
    carregarTaxas
  }
}