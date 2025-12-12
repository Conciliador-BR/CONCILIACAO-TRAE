import { ref } from 'vue'
import { useSafraPdf } from './Detectador_Adquirentes/Safra/useSafraPdf'
import { useSafraTxt } from './Detectador_Adquirentes/Safra/useSafraTxt'

export const useSafra = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const { processarPDF } = useSafraPdf()
  const { processarTXT } = useSafraTxt()

  const processarPDFSafra = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const r = await processarPDF(arquivo)
      if (r.sucesso) { transacoes.value = r.transacoes }
      return r
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const processarTXTSafra = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const r = await processarTXT(arquivo)
      if (r.sucesso) { transacoes.value = r.transacoes }
      return r
    } catch (e) {
      erro.value = e.message || 'Erro ao processar TXT'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarPDF: processarPDFSafra,
    processarTXT: processarTXTSafra
  }
}
