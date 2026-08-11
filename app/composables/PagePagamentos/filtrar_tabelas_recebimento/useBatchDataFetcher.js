import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useScopedTableRead } from '~/composables/useScopedTableRead'
import { isMissingColumnError, isMissingRelationError } from '~/composables/useSupabaseQueryErrors'

const DATE_COLUMNS_FALLBACK = ['data_recebimento', 'data_pgto', 'data_pagamento', 'data', 'data_venda']
const dateColumnCache = new Map()

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
    if (!dateColumn || (!dataInicial && !dataFinal)) return query

    if (dataInicial) query = query.gte(dateColumn, dataInicial)
    if (dataFinal) query = query.lte(dateColumn, dataFinal)
    return query
  }

  const normalizarListaColunasData = (nomeTabela, filtros = {}) => {
    const preferidas = [
      filtros?.dateColumn,
      dateColumnCache.get(nomeTabela),
      ...(Array.isArray(filtros?.dateColumns) ? filtros.dateColumns : DATE_COLUMNS_FALLBACK)
    ]

    return Array.from(
      new Set(
        preferidas
          .map(coluna => String(coluna || '').trim())
          .filter(Boolean)
      )
    )
  }

  const resolverFiltroEmpresa = (filtros = {}, empresaMatchMode = 'exact') => {
    const empresa = String(filtros?.empresa || '').trim()
    if (!empresa) return ''
    return empresaMatchMode === 'contains' ? `%${empresa}%` : empresa
  }

  const executarBuscaPaginada = async (
    nomeTabela,
    filtros = {},
    {
      dateColumn = '',
      allowMissingDateColumn = false,
      empresaMatchMode = 'exact'
    } = {}
  ) => {
    let allData = []
    let from = 0
    let hasMore = true
    const columns = filtros?.columns || '*'
    const matrizColumn = 'matriz'
    const empresaFiltro = resolverFiltroEmpresa(filtros, empresaMatchMode)

    while (hasMore) {
      let data = []

      try {
        if (shouldUseScopedRead.value) {
          data = await readTablePage({
            table: nomeTabela,
            columns,
            from,
            to: from + batchSize - 1,
            filters: {
              empresa: empresaFiltro,
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

          if (empresaFiltro) {
            query = query.ilike('empresa', empresaFiltro)
          }

          if (filtros?.matriz) {
            query = aplicarFiltroMatriz(query, filtros.matriz, matrizColumn)
          }

          query = aplicarFiltroData(query, filtros?.dataInicial, filtros?.dataFinal, dateColumn)

          const { data: queryData, error: supabaseError } = await query

          if (supabaseError) {
            if (isMissingRelationError(supabaseError)) {
              return []
            }

            if (allowMissingDateColumn && dateColumn && isMissingColumnError(supabaseError, dateColumn)) {
              throw supabaseError
            }

            throw supabaseError
          }

          data = queryData || []
        }
      } catch (error) {
        if (isMissingRelationError(error)) {
          return []
        }

        if (allowMissingDateColumn && dateColumn && isMissingColumnError(error, dateColumn)) {
          throw error
        }

        throw error
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
  }

  const buscarComColunaDescoberta = async (nomeTabela, filtros = {}, empresaMatchMode = 'exact') => {
    const candidatos = normalizarListaColunasData(nomeTabela, filtros)

    for (const coluna of candidatos) {
      try {
        const data = await executarBuscaPaginada(nomeTabela, filtros, {
          dateColumn: coluna,
          allowMissingDateColumn: true,
          empresaMatchMode
        })

        dateColumnCache.set(nomeTabela, coluna)
        return data
      } catch (error) {
        if (isMissingColumnError(error, coluna)) {
          continue
        }

        throw error
      }
    }

    return []
  }

  const buscarDadosTabela = async (nomeTabela, filtros = null) => {
    const temFiltroData = Boolean(filtros?.dataInicial || filtros?.dataFinal)

    if (temFiltroData) {
      return await buscarComColunaDescoberta(nomeTabela, filtros || {}, 'exact')
    }

    const dateColumn = String(filtros?.dateColumn || dateColumnCache.get(nomeTabela) || 'data_recebimento').trim()
    return await executarBuscaPaginada(nomeTabela, filtros || {}, {
      dateColumn,
      empresaMatchMode: 'exact'
    })
  }

  const buscarDadosTabelaAlternativo = async (nomeTabela, filtros = null) => {
    const temFiltroData = Boolean(filtros?.dataInicial || filtros?.dataFinal)

    if (temFiltroData) {
      return await buscarComColunaDescoberta(nomeTabela, filtros || {}, 'contains')
    }

    const dateColumn = String(filtros?.dateColumn || dateColumnCache.get(nomeTabela) || 'data_recebimento').trim()
    return await executarBuscaPaginada(nomeTabela, filtros || {}, {
      dateColumn,
      empresaMatchMode: 'contains'
    })
  }

  return {
    buscarDadosTabela,
    buscarDadosTabelaAlternativo,
    batchSize
  }
}
