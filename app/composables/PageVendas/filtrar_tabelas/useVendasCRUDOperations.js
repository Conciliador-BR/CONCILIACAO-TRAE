import { ref } from 'vue'
import { supabase } from '../useSupabaseConfig'
import { useVendasMapping } from '../useVendasMapping'
import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'

export const useVendasCRUDOperations = () => {
  const loading = ref(false)
  const error = ref(null)
  const { mapToDatabase, mapFromDatabase } = useVendasMapping()
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  
  const operadoraPadrao = 'unica'

  const obterNomeTabela = async () => {
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    return empresaSel?.nome 
      ? construirNomeTabela(empresaSel.nome, operadoraPadrao) 
      : 'vendas_norte_atacado_unica'
  }

  // Criar nova venda
  const createVenda = async (vendaData) => {
    try {
      loading.value = true
      error.value = null
      
      const nomeTabela = await obterNomeTabela()
      
      const { data, error: supabaseError } = await supabase
        .from(nomeTabela)
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
      
      const nomeTabela = await obterNomeTabela()
      
      const { data, error: updateError } = await supabase
        .from(nomeTabela)
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
      
      const nomeTabela = await obterNomeTabela()
      
      const { error: deleteError } = await supabase
        .from(nomeTabela)
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
    createVenda,
    updateVenda,
    deleteVenda
  }
}