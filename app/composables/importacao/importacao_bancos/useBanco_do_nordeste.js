import { ref } from 'vue'
import { useBancoDoNordesteCsv } from './Detectador_Adquirentes/Banco_do_Nordeste/useBancoDoNordesteCsv'

export const useBanco_do_nordeste = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const csv = useBancoDoNordesteCsv()

  const processarCSV = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const r = await csv.processarCSV(arquivo)
      if (r.sucesso) {
        transacoes.value = r.transacoes
      } else {
        erro.value = r.erro || 'Erro ao processar CSV'
      }
      return r
    } catch (e) {
      erro.value = e.message || 'Erro ao processar CSV'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return { processando, erro, transacoes, processarCSV }
}
