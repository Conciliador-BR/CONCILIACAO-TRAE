import { supabase } from '../useSupabaseConfig'

export const useBatchDataFetcher = () => {
  const batchSize = 1000

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    console.log(`🔍 Buscando dados da tabela: ${nomeTabela}`)
    
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            query = query.ilike('empresa', filtros.empresa)
          }
          if (filtros.matriz) {
            const matrizNumero = Number(filtros.matriz)
            query = query.eq('matriz', isNaN(matrizNumero) ? filtros.matriz : matrizNumero)
          }
        }
        
        const { data, error: supabaseError } = await query
        
        if (supabaseError) {
          console.warn(`⚠️ Erro ao buscar tabela ${nomeTabela}:`, supabaseError.message)
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
      
      return allData
    } catch (tableError) {
      console.warn(`⚠️ Tabela ${nomeTabela} não encontrada ou erro:`, tableError.message)
      return []
    }
  }

  return {
    buscarDadosTabela,
    batchSize
  }
}