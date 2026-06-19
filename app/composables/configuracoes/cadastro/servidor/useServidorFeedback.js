import { ref } from 'vue'

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
      id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
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
