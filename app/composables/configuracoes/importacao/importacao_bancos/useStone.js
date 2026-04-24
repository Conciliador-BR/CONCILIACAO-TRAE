import { ref } from 'vue'
import { useStoneOfx } from './Detectador_Adquirentes/Stone/useStoneOfx'
import { useStonePdf } from './Detectador_Adquirentes/Stone/useStonePdf'

export const useStone = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const ofx = useStoneOfx()
  const pdf = useStonePdf()

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const resultado = await ofx.processarOFX(arquivo)
      if (resultado?.sucesso) {
        transacoes.value = resultado.transacoes || []
      } else if (resultado?.erro) {
        erro.value = resultado.erro
      }
      return resultado
    } catch (e) {
      erro.value = e.message || 'Erro ao processar OFX Stone'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const resultado = await pdf.processarPDF(arquivo)
      if (resultado?.sucesso) {
        transacoes.value = resultado.transacoes || []
      } else if (resultado?.erro) {
        erro.value = resultado.erro
      }
      return resultado
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF Stone'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX,
    processarPDF
  }
}
