import { supabase } from '../useSupabaseConfig'

export const useBatchDataFetcher = () => {
  const batchSize = 1000
  const limparMatriz = (valor) => String(valor ?? '').replace(/[^\d]/g, '')
  const aplicarFiltroMatriz = (query, valorMatriz, matrizColumn = 'matriz') => {
    const matrizLimpa = limparMatriz(valorMatriz)
    const matrizNumero = Number(matrizLimpa)
    if (matrizLimpa && !isNaN(matrizNumero)) {
      // Algumas tabelas gravam matriz como texto e outras como número.
      return query.or(`${matrizColumn}.eq.${matrizLimpa},${matrizColumn}.eq.${matrizNumero}`)
    }
    return query.eq(matrizColumn, String(valorMatriz))
  }

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      const matrizColumn = 'matriz'
      
      while (hasMore) {
        const columns = filtros?.columns || '*'
        let query = supabase
          .from(nomeTabela)
          .select(columns)
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            query = query.eq('empresa', filtros.empresa)
          }
          if (filtros.matriz) {
            query = aplicarFiltroMatriz(query, filtros.matriz, matrizColumn)
          }
          if (Array.isArray(filtros.nsus) && filtros.nsus.length > 0) {
            query = query.in('nsu', filtros.nsus)
          } else if (filtros.nsu) {
            query = query.eq('nsu', filtros.nsu)
          }
          // Aplicar filtros de data se fornecidos
          if (filtros.dataInicial) {
            const dc = filtros.dateColumn || 'data_venda'
            query = query.gte(dc, filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            const dc = filtros.dateColumn || 'data_venda'
            query = query.lte(dc, filtros.dataFinal)
          }
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

  // Função alternativa que tenta diferentes estratégias de busca
  const buscarDadosTabelaAlternativo = async (nomeTabela, filtros = null) => {
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      const matrizColumn = 'matriz'
      
      while (hasMore) {
        const columns = filtros?.columns || '*'
        let query = supabase
          .from(nomeTabela)
          .select(columns)
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros alternativos se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            query = query.ilike('empresa', `%${filtros.empresa}%`)
          }
          if (filtros.matriz) {
            query = aplicarFiltroMatriz(query, filtros.matriz, matrizColumn)
          }
          if (Array.isArray(filtros.nsus) && filtros.nsus.length > 0) {
            query = query.in('nsu', filtros.nsus)
          } else if (filtros.nsu) {
            query = query.eq('nsu', filtros.nsu)
          }
          // Aplicar filtros de data se fornecidos
          if (filtros.dataInicial) {
            const dc = filtros.dateColumn || 'data_venda'
            query = query.gte(dc, filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            const dc = filtros.dateColumn || 'data_venda'
            query = query.lte(dc, filtros.dataFinal)
          }
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
    buscarDadosTabela,
    buscarDadosTabelaAlternativo,
    batchSize
  }
}
