import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useScopedTableRead } from '~/composables/useScopedTableRead'

export const useBatchDataFetcher = () => {
  const batchSize = 1000
  const { shouldUseScopedRead, readTablePage } = useScopedTableRead()
  const limparMatriz = (valor) => String(valor ?? '').replace(/[^\d]/g, '')
  const aplicarFiltroMatriz = (query, valorMatriz, matrizColumn = 'matriz') => {
    const matrizLimpa = limparMatriz(valorMatriz)
    const matrizNumero = Number(matrizLimpa)
    if (matrizLimpa && !isNaN(matrizNumero)) {
      return query.or(`${matrizColumn}.eq.${matrizLimpa},${matrizColumn}.eq.${matrizNumero}`)
    }
    return query.eq(matrizColumn, String(valorMatriz))
  }
  const anexarOrigemTabela = (registros, nomeTabela) => {
    return (registros || []).map(registro => ({
      ...registro,
      __source_table: registro?.__source_table || nomeTabela
    }))
  }

  const aplicarFiltroData = (query, dataInicial, dataFinal, dateColumn) => {
    if (!dataInicial && !dataFinal) return query

    if (dataInicial) query = query.gte(dateColumn, dataInicial)
    if (dataFinal) query = query.lte(dateColumn, dataFinal)
    return query
  }

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    try {
      let allData = []
      let from = 0
      let hasMore = true
      const dateColumn = filtros?.dateColumn || 'data_recebimento'
      const matrizColumn = 'matriz'

      while (hasMore) {
        const columns = filtros?.columns || '*'
        let data = []

        if (shouldUseScopedRead.value) {
          data = await readTablePage({
            table: nomeTabela,
            columns,
            from,
            to: from + batchSize - 1,
            filters: {
              empresa: filtros?.empresa,
              matriz: filtros?.matriz,
              dateColumn,
              dataInicial: filtros?.dataInicial,
              dataFinal: filtros?.dataFinal
            }
          })
        } else {
          let query = supabase
            .from(nomeTabela)
            .select(columns)
            .range(from, from + batchSize - 1)

          if (filtros) {
            if (filtros.empresa) {
              query = query.ilike('empresa', String(filtros.empresa))
            }
            if (filtros.matriz) {
              query = aplicarFiltroMatriz(query, filtros.matriz, matrizColumn)
            }
            query = aplicarFiltroData(query, filtros.dataInicial, filtros.dataFinal, dateColumn)
          }

          const { data: queryData, error: supabaseError } = await query

          if (supabaseError) {
            break
          }

          data = queryData || []
        }

        if (data && data.length > 0) {
          allData.push(...data)
          from += batchSize
          hasMore = data.length === batchSize
        } else {
          hasMore = false
        }
      }

      return anexarOrigemTabela(allData, nomeTabela)
    } catch (tableError) {
      return []
    }
  }

  const buscarDadosTabelaAlternativo = async (nomeTabela, filtros = null) => {
    try {
      const dateColumns = [filtros?.dateColumn || 'data_recebimento', 'data_pgto', 'data', 'data_venda']
      const matrizColumn = 'matriz'
      for (const col of dateColumns) {
        let allData = []
        let from = 0
        let hasMore = true

        while (hasMore) {
          const columns = filtros?.columns || '*'
          let data = []

          if (shouldUseScopedRead.value) {
            data = await readTablePage({
              table: nomeTabela,
              columns,
              from,
              to: from + batchSize - 1,
              filters: {
                empresa: filtros?.empresa ? `%${filtros.empresa}%` : '',
                matriz: filtros?.matriz,
                dateColumn: col,
                dataInicial: filtros?.dataInicial,
                dataFinal: filtros?.dataFinal
              }
            })
          } else {
            let query = supabase
              .from(nomeTabela)
              .select(columns)
              .range(from, from + batchSize - 1)

            if (filtros) {
              if (filtros.empresa) {
                query = query.ilike('empresa', `%${filtros.empresa}%`)
              }
              if (filtros.matriz) {
                query = aplicarFiltroMatriz(query, filtros.matriz, matrizColumn)
              }
              query = aplicarFiltroData(query, filtros.dataInicial, filtros.dataFinal, col)
            }

            const { data: queryData, error: supabaseError } = await query
            if (supabaseError) {
              // Se a coluna não existe, tenta próxima
              allData = []
              break
            }

            data = queryData || []
          }

          if (data && data.length > 0) {
            allData.push(...data)
            from += batchSize
            hasMore = data.length === batchSize
          } else {
            hasMore = false
          }
        }

        if (allData.length > 0) {
          return anexarOrigemTabela(allData, nomeTabela)
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
