import { ref } from 'vue'
import { useTribanco_OFX } from './tribanco/useTribanco_OFX'
import { useTribanco_xlsx } from './tribanco/useTribanco_xlsx'

export const useTribanco = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  // Importar processadores específicos
  const processadorOFX = useTribanco_OFX()
  const processadorXLSX = useTribanco_xlsx()

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const resultado = await processadorOFX.processarOFX(arquivo)
      
      if (resultado.sucesso) {
        transacoes.value = resultado.transacoes
      }
      
      return resultado
    } catch (error) {
      erro.value = error.message
      return {
        sucesso: false,
        erro: error.message
      }
    } finally {
      processando.value = false
    }
  }

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const resultado = await processadorXLSX.processarXLSX(arquivo)
      
      if (resultado.sucesso) {
        transacoes.value = resultado.transacoes
      }
      
      return resultado
    } catch (error) {
      erro.value = error.message
      return {
        sucesso: false,
        erro: error.message
      }
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX,
    processarXLSX
  }
}