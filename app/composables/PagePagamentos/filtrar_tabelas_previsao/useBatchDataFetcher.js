import { useAPIsupabase } from '../../useAPIsupabase'

export const useBatchDataFetcher = () => {
  const { supabase } = useAPIsupabase()
  const batchSize = 1000
  const limparMatriz = (valor) => String(valor ?? '').replace(/[^\d]/g, '')



  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
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
            query = query.eq('empresa', filtros.empresa)
          }
          if (filtros.matriz) {
            const matrizLimpa = limparMatriz(filtros.matriz)
            const matrizNumero = Number(matrizLimpa)
            query = query.eq('matriz', matrizLimpa && !isNaN(matrizNumero) ? matrizNumero : filtros.matriz)
          }
          if (filtros.dataInicial) {
            query = query.gte('previsao_pgto', filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            query = query.lte('previsao_pgto', filtros.dataFinal)
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
      
      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros alternativos se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            query = query.ilike('empresa', `%${filtros.empresa}%`)
          }
          if (filtros.matriz) {
            const matrizStr = limparMatriz(filtros.matriz)
            const matrizNum = Number(matrizStr)
            if (matrizStr && !isNaN(matrizNum)) {
              query = query.eq('matriz', matrizNum)
            } else {
              query = query.eq('matriz', String(filtros.matriz))
            }
          }
          if (filtros.dataInicial) {
            query = query.gte('previsao_pgto', filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            query = query.lte('previsao_pgto', filtros.dataFinal)
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
