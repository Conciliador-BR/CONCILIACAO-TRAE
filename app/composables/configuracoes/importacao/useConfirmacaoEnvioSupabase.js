import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useConfirmacaoEnvioSupabase = () => {
  const { supabase } = useAPIsupabase()
  const verificandoTabela = ref(false)
  const tabelaExiste = ref(false)
  const erroTabela = ref('')

  const verificarTabelaExiste = async (nomeTabela) => {
    verificandoTabela.value = true
    tabelaExiste.value = false
    erroTabela.value = ''

    try {
      const { error } = await supabase
        .from(nomeTabela)
        .select('*')
        .limit(1)

      if (error) {
        const codigo = String(error?.code || '')
        const mensagem = String(error?.message || '')
        if (codigo === '42P01' || mensagem.toLowerCase().includes('does not exist') || mensagem.toLowerCase().includes('could not find the table')) {
          tabelaExiste.value = false
          return false
        }
        throw error
      }

      tabelaExiste.value = true
      return true
    } catch (error) {
      tabelaExiste.value = false
      erroTabela.value = error?.message || 'Erro ao verificar tabela no Supabase.'
      return false
    } finally {
      verificandoTabela.value = false
    }
  }

  const resetarVerificacaoTabela = () => {
    verificandoTabela.value = false
    tabelaExiste.value = false
    erroTabela.value = ''
  }

  return {
    verificandoTabela,
    tabelaExiste,
    erroTabela,
    verificarTabelaExiste,
    resetarVerificacaoTabela
  }
}
