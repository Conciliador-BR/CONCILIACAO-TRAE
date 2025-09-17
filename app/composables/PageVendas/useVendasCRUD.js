import { ref } from 'vue'
import { supabase } from './useSupabaseConfig'
import { useVendasMapping } from './useVendasMapping'

export const useVendasCRUD = () => {
  const loading = ref(false)
  const error = ref(null)
  const { mapFromDatabase, mapToDatabase } = useVendasMapping()

  // Buscar vendas
  const fetchVendas = async () => {
    loading.value = true
    error.value = null
    
    try {
      let allData = []
      let from = 0
      const batchSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const { data, error: supabaseError } = await supabase
          .from('vendas_operadora_unica')
          .select('*')  // ✅ Isso já busca todas as colunas, incluindo previsao_pgto
          .range(from, from + batchSize - 1)
        
        if (supabaseError) {
          throw supabaseError
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data]
          from += batchSize
          hasMore = data.length === batchSize
        } else {
          hasMore = false
        }
      }
      
      const vendasMapeadas = allData.map(mapFromDatabase)
      console.log('Vendas carregadas:', vendasMapeadas.length)
      return vendasMapeadas
    } catch (err) {
      error.value = err.message
      console.error('Erro ao buscar vendas:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Criar nova venda
  const createVenda = async (vendaData) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: supabaseError } = await supabase
        .from('vendas_operadora_unica')
        .insert([mapToDatabase(vendaData)])
        .select()
      
      if (supabaseError) throw supabaseError
      
      const newVenda = mapFromDatabase(data[0])
      return newVenda
    } catch (err) {
      error.value = err.message
      console.error('Erro ao criar venda:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Atualizar venda existente
  const updateVenda = async (id, vendaData) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: updateError } = await supabase
        .from('vendas_operadora_unica')
        .update(mapToDatabase(vendaData))
        .eq('id', id)
        .select()
      
      if (updateError) throw updateError
      
      const updatedVenda = mapFromDatabase(data[0])
      return updatedVenda
    } catch (err) {
      error.value = err.message
      console.error('Erro ao atualizar venda:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Deletar venda
  const deleteVenda = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      const { error: deleteError } = await supabase
        .from('vendas_operadora_unica')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Erro ao deletar venda:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchVendas,
    createVenda,
    updateVenda,
    deleteVenda
  }
}