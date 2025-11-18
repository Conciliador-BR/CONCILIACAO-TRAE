import { ref } from 'vue'
import { useAPIsupabase } from '../../../composables/useAPIsupabase'
import { mapSenha } from './mappers.js'
import { createUpsertOperations } from './operations.js'
import { createQueryOperations } from './queries.js'

export const useSenhasSupabase = () => {
  const { supabase, error: apiError } = useAPIsupabase()

  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)
  const resumo = ref({ processadas: 0, sucesso: 0, falha: 0, erros: [] })

  const state = { loading, error, success, resumo }

  const operations = createUpsertOperations(supabase, state)
  const queries = createQueryOperations(supabase)

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
    loading,
    error,
    success,
    resumo,
    mapSenha,
    ...operations,
    ...queries,
    salvarSenhasNoSupabase,
    enviarSenha,
    enviarSenhasLote
  }
}
