import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useBatchDataFetcher = () => {
  const batchSize = 1000

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    try {
      let allData = []
      let from = 0
      let hasMore = true
      const dateColumn = filtros?.dateColumn || 'data_recebimento'
      const nomeLower = String(nomeTabela).toLowerCase()
      const voucherTokens = [
        'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','up_brasil','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
      ]
      const isVoucherTable = voucherTokens.some(tok => nomeLower.includes(`_${tok}`) || nomeLower.endsWith(tok))
      const matrizColumn = isVoucherTable ? 'ec' : 'matriz'

      while (hasMore) {
        let query = supabase
          .from(nomeTabela)
          .select('*')
          .range(from, from + batchSize - 1)

        if (filtros) {
          if (filtros.empresa) {
            query = query.eq('empresa', filtros.empresa)
          }
          if (filtros.matriz) {
            const matrizNumero = Number(filtros.matriz)
            query = query.eq(matrizColumn, isNaN(matrizNumero) ? filtros.matriz : matrizNumero)
          }
          if (filtros.dataInicial) {
            query = query.gte(dateColumn, filtros.dataInicial)
          }
          if (filtros.dataFinal) {
            query = query.lte(dateColumn, filtros.dataFinal)
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

  const buscarDadosTabelaAlternativo = async (nomeTabela, filtros = null) => {
    try {
      const dateColumns = [filtros?.dateColumn || 'data_recebimento', 'data', 'data_venda']
      const nomeLower = String(nomeTabela).toLowerCase()
      const voucherTokens = [
        'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','up_brasil','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
      ]
      const isVoucherTable = voucherTokens.some(tok => nomeLower.includes(`_${tok}`) || nomeLower.endsWith(tok))
      const matrizColumn = isVoucherTable ? 'ec' : 'matriz'
      for (const col of dateColumns) {
        let allData = []
        let from = 0
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from(nomeTabela)
            .select('*')
            .range(from, from + batchSize - 1)

          if (filtros) {
            if (filtros.empresa) {
              query = query.ilike('empresa', `%${filtros.empresa}%`)
            }
            if (filtros.matriz) {
              const matrizStr = String(filtros.matriz)
              const matrizNum = Number(filtros.matriz)
              if (!isNaN(matrizNum)) {
                query = query.or(`${matrizColumn}.eq.${matrizStr},${matrizColumn}.eq.${matrizNum}`)
              } else {
                query = query.eq(matrizColumn, matrizStr)
              }
            }
            if (filtros.dataInicial) {
              query = query.gte(col, filtros.dataInicial)
            }
            if (filtros.dataFinal) {
              query = query.lte(col, filtros.dataFinal)
            }
          }

          const { data, error: supabaseError } = await query
          if (supabaseError) {
            // Se a coluna não existe, tenta próxima
            allData = []
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

        if (allData.length > 0) {
          return allData
        }
      }

      return []
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
