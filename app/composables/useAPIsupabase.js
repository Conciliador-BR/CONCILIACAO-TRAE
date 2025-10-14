import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

// Criar cliente Supabase de forma lazy (apenas quando necessário)
let supabaseClient = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const config = useRuntimeConfig()
    
    if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
      throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.')
    }
    
    supabaseClient = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
  }
  
  return supabaseClient
}

export const useAPIsupabase = () => {
  const { error: logError } = useSecureLogger()
  const loading = ref(false)
  const error = ref(null)

  // Obter cliente Supabase de forma segura
  const supabase = getSupabaseClient()

  // Função genérica para buscar dados
  const fetchData = async (table, columns = '*', filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      let query = supabase.from(table).select(columns)
      
      // Aplicar filtros se existirem
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value)
        }
      })
      
      const { data, error: fetchError } = await query
      
      if (fetchError) {
        throw fetchError
      }
      
      return data
    } catch (err) {
      error.value = err.message
      logError('Erro ao buscar dados', { table, error: err.message })
      return []
    } finally {
      loading.value = false
    }
  }

  // Função para inserir dados
  const insertData = async (table, data) => {
    loading.value = true
    error.value = null
    
    try {
      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(data)
        .select()
      
      if (insertError) {
        throw insertError
      }
      
      return result
    } catch (err) {
      // CORREÇÃO: Capturar e expor os detalhes do erro do Supabase
      const errorMessage = err.details ? `Detalhes: ${err.details}` : err.message;
      error.value = errorMessage;
      console.error('❌ Erro detalhado ao inserir dados:', {
        message: err.message,
        details: err.details,
        code: err.code,
        fullError: err
      });
      return null
    } finally {
      loading.value = false
    }
  }

  // Função para atualizar dados
  const updateData = async (table, id, data) => {
    loading.value = true
    error.value = null
    
    try {
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
      
      if (updateError) {
        throw updateError
      }
      
      return result
    } catch (err) {
      // CORREÇÃO: Capturar e expor os detalhes do erro do Supabase
      const errorMessage = err.details ? `Detalhes: ${err.details}` : err.message;
      error.value = errorMessage;
      console.error('❌ Erro detalhado ao atualizar dados:', {
        message: err.message,
        details: err.details,
        code: err.code,
        fullError: err
      });
      return null
    } finally {
      loading.value = false
    }
  }

  // Função para deletar dados
  const deleteData = async (table, id) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        throw deleteError
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Erro ao deletar dados:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    supabase,
    loading,
    error,
    fetchData,
    insertData,
    updateData,
    deleteData
  }
}