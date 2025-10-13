import { ref } from 'vue'
import { supabase } from './useSupabaseConfig'
import { useVendasMapping } from './useVendasMapping'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'

// Buscar vendas com filtro por empresa e EC
export const useVendasCRUD = () => {
  const loading = ref(false)
  const error = ref(null)
  const { mapFromDatabase, mapToDatabase } = useVendasMapping()
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()

  const construirNomeTabela = (empresa, operadora) => {
    const empresaStr = typeof empresa === 'string' ? empresa : String(empresa)
    const operadoraStr = typeof operadora === 'string' ? operadora : String(operadora)

    const empresaNormalizada = empresaStr.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    const operadoraNormalizada = operadoraStr.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    return `vendas_${empresaNormalizada}_${operadoraNormalizada}`
  }

  const operadoraPadrao = 'unica'

  // Helper: obter nome e EC (matriz) da empresa selecionada
  const obterEmpresaSelecionadaCompleta = async () => {
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }
    const id = filtrosGlobais.empresaSelecionada
    if (!id) return null
    const empresa = empresas.value.find(e => e.id == id)
    if (!empresa) return null
    return { nome: empresa.nome, matriz: empresa.matriz }
  }

  const fetchVendas = async () => {
    loading.value = true
    error.value = null

    try {
      let allData = []
      
      // Verificar se "Todas as Empresas" está selecionado (empresaSelecionada vazio)
      if (!filtrosGlobais.empresaSelecionada) {
        console.log('🔄 Buscando vendas de todas as empresas...')
        
        // 1. Buscar todas as empresas
        if (!empresas.value || empresas.value.length === 0) {
          await fetchEmpresas()
        }
        
        // 2. Para cada empresa, buscar suas operadoras autorizadas
        for (const empresa of empresas.value) {
          if (!empresa.autorizadoras) continue
          
          // 3. Dividir autorizadoras por ';'
          const operadoras = empresa.autorizadoras.split(';').map(op => op.trim()).filter(op => op)
          
          // 4. Para cada operadora, buscar na tabela correspondente
          for (const operadora of operadoras) {
            const tabela = construirNomeTabela(empresa.nome, operadora)
            console.log(`🔍 Buscando dados da tabela: ${tabela}`)
            
            try {
              let from = 0
              const batchSize = 1000
              let hasMore = true
              
              while (hasMore) {
                const { data, error: supabaseError } = await supabase
                  .from(tabela)
                  .select('*')
                  .range(from, from + batchSize - 1)
                
                if (supabaseError) {
                  console.warn(`⚠️ Erro ao buscar tabela ${tabela}:`, supabaseError.message)
                  break
                }
                
                if (data && data.length > 0) {
                  allData = [...allData, ...data]
                  from += batchSize
                  hasMore = data.length === batchSize
                } else {
                  hasMore = false
                }
              }
            } catch (tableError) {
              console.warn(`⚠️ Tabela ${tabela} não encontrada ou erro:`, tableError.message)
            }
          }
        }
      } else {
        // Lógica existente para empresa específica
        const empresaSel = await obterEmpresaSelecionadaCompleta()
        
        if (empresaSel?.nome) {
          // Buscar empresa completa com autorizadoras
          const empresaCompleta = empresas.value.find(e => e.nome === empresaSel.nome)
          
          if (empresaCompleta?.autorizadoras) {
            // Buscar em todas as operadoras autorizadas da empresa
            const operadoras = empresaCompleta.autorizadoras.split(';').map(op => op.trim()).filter(op => op)
            
            for (const operadora of operadoras) {
              const tabela = construirNomeTabela(empresaSel.nome, operadora)
              console.log(`🔍 Buscando dados da tabela: ${tabela} para empresa ${empresaSel.nome}`)
              
              try {
                let from = 0
                const batchSize = 1000
                let hasMore = true
                
                while (hasMore) {
                  let query = supabase
                    .from(tabela)
                    .select('*')
                    .range(from, from + batchSize - 1)
                  
                  // Aplicar filtros por empresa e matriz
                  if (empresaSel.matriz) {
                    const matrizNumero = Number(empresaSel.matriz)
                    query = query
                      .ilike('empresa', empresaSel.nome)
                      .eq('matriz', isNaN(matrizNumero) ? empresaSel.matriz : matrizNumero)
                  }
                  
                  const { data, error: supabaseError } = await query
                  
                  if (supabaseError) {
                    console.warn(`⚠️ Erro ao buscar tabela ${tabela}:`, supabaseError.message)
                    break
                  }
                  
                  if (data && data.length > 0) {
                    allData = [...allData, ...data]
                    from += batchSize
                    hasMore = data.length === batchSize
                  } else {
                    hasMore = false
                  }
                }
              } catch (tableError) {
                console.warn(`⚠️ Tabela ${tabela} não encontrada ou erro:`, tableError.message)
              }
            }
          } else {
            // Fallback para operadora padrão se não houver autorizadoras
            const tabela = construirNomeTabela(empresaSel.nome, operadoraPadrao)
            console.log(`🔍 Fallback: Buscando dados da tabela: ${tabela}`)
            
            let from = 0
            const batchSize = 1000
            let hasMore = true
            
            while (hasMore) {
              let query = supabase
                .from(tabela)
                .select('*')
                .range(from, from + batchSize - 1)
              
              if (empresaSel.matriz) {
                const matrizNumero = Number(empresaSel.matriz)
                query = query
                  .ilike('empresa', empresaSel.nome)
                  .eq('matriz', isNaN(matrizNumero) ? empresaSel.matriz : matrizNumero)
              }
              
              const { data, error: supabaseError } = await query
              if (supabaseError) throw supabaseError
              
              if (data && data.length > 0) {
                allData = [...allData, ...data]
                from += batchSize
                hasMore = data.length === batchSize
              } else {
                hasMore = false
              }
            }
          }
        }
      }

      console.log(`✅ Total de vendas carregadas: ${allData.length}`)
      const vendasMapeadas = allData.map(mapFromDatabase)
      return vendasMapeadas
    } catch (err) {
      error.value = err.message
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
        .from(empresaSelecionadaNome.value ? construirNomeTabela(empresaSelecionadaNome.value, operadoraPadrao) : 'vendas_operadora_unica')
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
        .from(empresaSelecionadaNome.value ? construirNomeTabela(empresaSelecionadaNome.value, operadoraPadrao) : 'vendas_operadora_unica')
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
        .from(empresaSelecionadaNome.value ? construirNomeTabela(empresaSelecionadaNome.value, operadoraPadrao) : 'vendas_operadora_unica')
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