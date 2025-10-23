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
  const fetchData = async (table, columns = '*', filters = {}, limit = null) => {
    loading.value = true
    error.value = null
    
    try {
      let query = supabase.from(table).select(columns)
      
      // Aplicar filtros se existirem
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Se o valor é um objeto com operadores (gte, lte, etc.)
          if (typeof value === 'object' && !Array.isArray(value)) {
            if (value.gte) {
              query = query.gte(key, value.gte)
            }
            if (value.lte) {
              query = query.lte(key, value.lte)
            }
            if (value.eq) {
              query = query.eq(key, value.eq)
            }
          } else {
            // Filtro simples de igualdade
            query = query.eq(key, value)
          }
        }
      })
      
      // Aplicar limite se especificado
      if (limit !== null) {
        query = query.limit(limit)
      }
      
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

  // Função para buscar TODOS os dados usando paginação (sem limite)
  const fetchAllData = async (table, columns = '*', filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      let allData = []
      let from = 0
      const batchSize = 1000
      let hasMore = true
      
      console.log('🔄 Iniciando busca paginada para todos os dados...')
      
      while (hasMore) {
        let query = supabase.from(table).select(columns)
        
        // Aplicar filtros se existirem
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'object' && !Array.isArray(value)) {
              if (value.gte) {
                query = query.gte(key, value.gte)
              }
              if (value.lte) {
                query = query.lte(key, value.lte)
              }
              if (value.eq) {
                query = query.eq(key, value.eq)
              }
            } else {
              query = query.eq(key, value)
            }
          }
        })
        
        // Aplicar paginação
        query = query.range(from, from + batchSize - 1)
        
        const { data, error: fetchError } = await query
        
        if (fetchError) {
          throw fetchError
        }
        
        if (data && data.length > 0) {
          allData = allData.concat(data)
          console.log(`📦 Lote ${Math.floor(from / batchSize) + 1}: ${data.length} registros (Total: ${allData.length})`)
          
          if (data.length < batchSize) {
            hasMore = false
          } else {
            from += batchSize
          }
        } else {
          hasMore = false
        }
      }
      
      console.log('✅ Busca paginada concluída:', allData.length, 'registros totais')
      return allData
      
    } catch (err) {
      error.value = err.message
      logError('Erro ao buscar todos os dados', { table, error: err.message })
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
    fetchAllData,
    insertData,
    updateData,
    deleteData
  }
}