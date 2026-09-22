import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useValidacaoTabelas = () => {
  const { supabase } = useAPIsupabase()

  // Função para testar se a tabela existe
  const testarTabela = async (nomeTabela) => {
    try {
      console.log('🔍 Testando existência da tabela: %s', nomeTabela)
      
      // Tentar fazer uma consulta simples para verificar se a tabela existe
      const { data, error: testError } = await supabase
        .from(nomeTabela)
        .select('*')
        .limit(1)
      
      if (testError) {
        console.error('❌ Tabela %s não existe ou não é acessível:', nomeTabela, testError)
        return { existe: false, erro: testError.message }
      }
      
      console.log('✅ Tabela %s existe e é acessível', nomeTabela)
      return { existe: true, erro: null }
    } catch (err) {
      console.error('❌ Erro ao testar tabela %s:', nomeTabela, err)
      return { existe: false, erro: err.message }
    }
  }

  // Função para verificar se tabela existe em diferentes formatos
  const verificarTabelaFormatos = async (nomeBase) => {
    const formatos = [
      nomeBase.toUpperCase(),
      nomeBase.toLowerCase(),
      nomeBase
    ]

    for (const formato of formatos) {
      try {
        const { data, error } = await supabase
          .from(formato)
          .select('*')
          .limit(1)
        
        if (!error) {
          console.log('✅ Tabela encontrada no formato: %s', formato)
          return { existe: true, nomeTabela: formato, erro: null }
        }
      } catch (e) {
        // Continuar tentando outros formatos
      }
    }

    return { existe: false, nomeTabela: null, erro: 'Tabela não encontrada em nenhum formato' }
  }

  return {
    testarTabela,
    verificarTabelaFormatos
  }
}
