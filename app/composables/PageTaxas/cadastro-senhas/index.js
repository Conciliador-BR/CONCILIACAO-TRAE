import { ref } from 'vue'
import { useAPIsupabase } from '../../../composables/useAPIsupabase'
import { mapSenha } from './mappers.js'
import { createUpsertOperations } from './operations.js'
import { createQueryOperations } from './queries.js'

/**
 * Composable principal para operações de senhas no Supabase
 * Integra todos os módulos componentizados
 */
export const useSenhasSupabase = () => {
  const { supabase, error: apiError } = useAPIsupabase()

  // Estados reativos
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)
  const resumo = ref({ processadas: 0, sucesso: 0, falha: 0, erros: [] })

  const state = { loading, error, success, resumo }

  // Criar operações CRUD
  const operations = createUpsertOperations(supabase, state)
  
  // Criar operações de busca
  const queries = createQueryOperations(supabase)

  // === Aliases de compatibilidade (mantêm nomes antigos usados nos componentes) ===
  const salvarSenhasNoSupabase = async (senhas, options = {}) => {
    return await operations.upsertSenhas(senhas, options)
  }

  const enviarSenha = async (senha, options = {}) => {
    return await operations.upsertSenha(senha, options)
  }

  const enviarSenhasLote = async (senhas, options = {}) => {
    return await operations.upsertSenhas(senhas, options)
  }

  return {
    // Estados
    loading,
    error,
    success,
    resumo,
    
    // Utilitários
    mapSenha,
    
    // Operações principais
    ...operations,
    ...queries,
    
    // Aliases de compatibilidade
    salvarSenhasNoSupabase,
    enviarSenha,
    enviarSenhasLote
  }
}