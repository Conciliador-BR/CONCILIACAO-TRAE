import { ref } from 'vue'
import { useBanestesPdf } from './Detectador_Adquirentes/Banestes/useBanestesPdf'
import { useBanestesXlsx } from './Detectador_Adquirentes/Banestes/useBanestesXlsx'

export const useBanestes = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const { processarPDF } = useBanestesPdf()
  const { processarXLSX } = useBanestesXlsx()

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

  const executarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const resultado = await processarXLSX(arquivo)
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
    processarPDF: executarPDF,
    processarXLSX: executarXLSX
  }
}
