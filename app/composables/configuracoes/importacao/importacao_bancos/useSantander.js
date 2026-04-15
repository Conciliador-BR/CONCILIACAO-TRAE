import { ref } from 'vue'
import { useSantanderOfx } from './Detectador_Adquirentes/Santander/useSantanderOfx'

export const useSantander = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const ofx = useSantanderOfx()

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
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX
  }
}
