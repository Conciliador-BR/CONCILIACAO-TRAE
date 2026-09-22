import { ref } from 'vue'

const createFeedbackActionId = () => {
  return globalThis.crypto?.randomUUID?.()
    || `feedback-${Date.now()}-${String(typeof performance !== 'undefined' ? performance.now() : 0).replace('.', '')}`
}

export const useServidorFeedback = () => {
  const mensagem = ref('')
  const sucesso = ref(true)
  const historicoAcoes = ref([])

  const limparMensagem = () => {
    mensagem.value = ''
    sucesso.value = true
  }

  const definirMensagem = (texto, ok = true) => {
    mensagem.value = String(texto || '').trim()
    sucesso.value = !!ok
  }

  const registrarAcao = ({ acao = '', alvo = '', detalhe = '', ok = true } = {}) => {
    historicoAcoes.value.unshift({
      id: createFeedbackActionId(),
      acao,
      alvo,
      detalhe,
      ok: !!ok,
      criadoEm: new Date().toISOString()
    })

    if (historicoAcoes.value.length > 12) {
      historicoAcoes.value.splice(12)
    }
  }

  return {
    mensagem,
    sucesso,
    historicoAcoes,
    limparMensagem,
    definirMensagem,
    registrarAcao
  }
}
