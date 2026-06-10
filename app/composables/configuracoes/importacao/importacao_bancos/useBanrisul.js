import { ref } from 'vue'
import { useBanrisulPdf } from './Detectador_Adquirentes/Banrisul/useBanrisulPdf'

export const useBanrisul = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const { processarPDF } = useBanrisulPdf()

  const executarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const resultado = await processarPDF(arquivo)
      if (resultado?.sucesso) {
        transacoes.value = resultado.transacoes || []
      } else if (resultado?.erro) {
        erro.value = resultado.erro
      }
      return resultado
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarPDF: executarPDF
  }
}
