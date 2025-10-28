import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useBuscaDados = () => {
  // Função para buscar dados de uma tabela específica
  const buscarDadosTabela = async (nomeTabela, filtros = {}) => {
    try {
      let allData = []
      let from = 0
      const batchSize = 1000
      let hasMore = true
      
      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros se fornecidos
        if (filtros.empresa) {
          query = query.eq('empresa', filtros.empresa)
        }
        if (filtros.matriz) {
          const matrizNumero = Number(filtros.matriz)
          query = query.eq('matriz', isNaN(matrizNumero) ? filtros.matriz : matrizNumero)
        }
        if (filtros.dataInicial) {
          query = query.gte('previsao_pgto', filtros.dataInicial)
        }
        if (filtros.dataFinal) {
          query = query.lte('previsao_pgto', filtros.dataFinal)
        }
        
        const { data, error: supabaseError } = await query
        
        if (supabaseError) {
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
      return []
    }
  }

  return {
    buscarDadosTabela
  }
}