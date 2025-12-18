import { supabase } from '../useSupabaseConfig'

export const useBatchDataFetcher = () => {
  const batchSize = 1000

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    try {
      let allData = []
      let from = 0
      let hasMore = true
      
      const nomeLower = String(nomeTabela).toLowerCase()
      const voucherTokens = [
        'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','up_brasil','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
      ]
      const isVoucherTable = voucherTokens.some(tok => nomeLower.includes(`_${tok}`) || nomeLower.endsWith(tok))
      const matrizColumn = isVoucherTable ? 'ec' : 'matriz'
      
      while (hasMore) {
        const requested = filtros?.columns || '*'
        const columns = (isVoucherTable && typeof requested === 'string')
          ? requested
              .split(',')
              .map(c => {
                const name = String(c || '').trim()
                return name === 'matriz' ? 'ec' : name
              })
              .join(',')
          : requested
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
            const matrizNumero = Number(filtros.matriz)
            query = query.eq(matrizColumn, isNaN(matrizNumero) ? filtros.matriz : matrizNumero)
          }
          if (filtros.nsu) {
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
      
      const nomeLower = String(nomeTabela).toLowerCase()
      const voucherTokens = [
        'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','up_brasil','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
      ]
      const isVoucherTable = voucherTokens.some(tok => nomeLower.includes(`_${tok}`) || nomeLower.endsWith(tok))
      const matrizColumn = isVoucherTable ? 'ec' : 'matriz'
      
      while (hasMore) {
        const requested = filtros?.columns || '*'
        const columns = (isVoucherTable && typeof requested === 'string')
          ? requested
              .split(',')
              .map(c => {
                const name = String(c || '').trim()
                return name === 'matriz' ? 'ec' : name
              })
              .join(',')
          : requested
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
            // Tentar tanto como string quanto como número
            const matrizStr = String(filtros.matriz)
            const matrizNum = Number(filtros.matriz)
            
            if (!isNaN(matrizNum)) {
              // Se é um número válido, buscar por ambos os tipos
              query = query.or(`${matrizColumn}.eq.${matrizStr},${matrizColumn}.eq.${matrizNum}`)
            } else {
              // Se não é número, buscar apenas como string
              query = query.eq(matrizColumn, matrizStr)
            }
          }
          if (filtros.nsu) {
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
