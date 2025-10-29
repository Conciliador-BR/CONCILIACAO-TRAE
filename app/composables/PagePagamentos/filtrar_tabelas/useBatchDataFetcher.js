import { useAPIsupabase } from '../../useAPIsupabase'

export const useBatchDataFetcher = () => {
  const { supabase } = useAPIsupabase()
  const batchSize = 1000



  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      console.log(`🔍 [BATCH FETCHER] Buscando dados da tabela: ${nomeTabela}`)
      console.log(`📋 [BATCH FETCHER] Filtros recebidos:`, filtros)
      
      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)
        
        // Aplicar filtros se fornecidos
        if (filtros) {
          if (filtros.empresa) {
            console.log(`🏢 [BATCH FETCHER] Aplicando filtro empresa: ${filtros.empresa}`)
            query = query.eq('empresa', filtros.empresa)
          }
          if (filtros.matriz) {
            const matrizNumero = Number(filtros.matriz)
            console.log(`🏭 [BATCH FETCHER] Aplicando filtro matriz: ${filtros.matriz}`)
            query = query.eq('matriz', isNaN(matrizNumero) ? filtros.matriz : matrizNumero)
          }
          if (filtros.dataInicial) {
            console.log(`📅 [BATCH FETCHER] Aplicando filtro data inicial na PREVISÃO: ${filtros.dataInicial}`)
            query = query.gte('previsao_pgto', filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            console.log(`📅 [BATCH FETCHER] Aplicando filtro data final na PREVISÃO: ${filtros.dataFinal}`)
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
      
      // Só logar se encontrou dados ou se é uma busca importante
      if (allData.length > 0 || (filtros && filtros.empresa)) {
        console.log(`✅ [PAGAMENTOS] Tabela ${nomeTabela}: ${allData.length} registros encontrados`)
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
            // Tentar tanto como string quanto como número
            const matrizStr = String(filtros.matriz)
            const matrizNum = Number(filtros.matriz)
            
            if (!isNaN(matrizNum)) {
              // Se é um número válido, buscar por ambos os tipos
              query = query.or(`matriz.eq.${matrizStr},matriz.eq.${matrizNum}`)
            } else {
              // Se não é número, buscar apenas como string
              query = query.eq('matriz', matrizStr)
            }
          }
          if (filtros.dataInicial) {
            console.log(`📅 [BATCH FETCHER] Aplicando filtro data inicial na PREVISÃO: ${filtros.dataInicial}`)
            query = query.gte('previsao_pgto', filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            console.log(`📅 [BATCH FETCHER] Aplicando filtro data final na PREVISÃO: ${filtros.dataFinal}`)
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
      
      // Só logar se encontrou dados
      if (allData.length > 0) {
        console.log(`✅ [PAGAMENTOS] Busca alternativa - Tabela ${nomeTabela}: ${allData.length} registros encontrados`)
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