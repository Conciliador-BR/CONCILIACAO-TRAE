import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useValidacaoTabelas = () => {
  // Função para verificar se uma tabela existe
  const verificarTabelaExiste = async (nomeTabela) => {
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      if (!error) {
        return true
      }
      
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        return false
      }
      
      return false
    } catch (err) {
      return false
    }
  }

  return {
    verificarTabelaExiste
  }
}