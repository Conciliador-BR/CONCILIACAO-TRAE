import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useScopedTableRead } from '~/composables/useScopedTableRead'

const tabelaExisteCache = new Map()

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const { shouldUseScopedRead, checkTableExists } = useScopedTableRead()
  const colunasDataRecebimento = ['data_recebimento', 'data_pgto', 'data_pagamento', 'data']

  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safra', 'sipag', 'azulzinha', 'sicredi']
  const operadoraValida = (operadora) => /^[A-Za-z0-9À-ÿ _-]+$/.test(String(operadora || '').trim())
  const normalizarOperadora = (valor) => String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
  const mapaOperadoras = {
    pagbank: 'pagseguro',
    pagseguro: 'pagseguro',
    safra: 'safra',
    safrapay: 'safra'
  }
  const operadorasPermitidas = new Set(operadorasConhecidas)

  const verificarTabelaExiste = async (nomeTabela) => {
    if (shouldUseScopedRead.value) {
      return await checkTableExists(nomeTabela)
    }

    if (tabelaExisteCache.has(nomeTabela)) {
      const valorEmCache = tabelaExisteCache.get(nomeTabela)
      if (valorEmCache === true) {
        return true
      }
    }
    try {
      const { error } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      const ok = !error
      if (ok) {
        tabelaExisteCache.set(nomeTabela, true)
      } else {
        tabelaExisteCache.delete(nomeTabela)
      }
      return ok
    } catch (err) {
      tabelaExisteCache.delete(nomeTabela)
      return false
    }
  }

  const buscarEmpresaEspecifica = async (filtros = {}) => {
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    if (!empresaSel?.nome) {
      return []
    }

    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    const operadorasBrutas = operadorasEmpresa.length > 0
      ? [...operadorasEmpresa, 'azulzinha']
      : ['azulzinha']
    const operadorasParaBuscar = [...new Set(operadorasBrutas
      .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
      .filter(op => op && operadoraValida(op) && operadorasPermitidas.has(op)))]
    if (operadorasParaBuscar.length === 0) return []

    const filtrosBuscaBase = {
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz,
      ...(filtros && {
        dataInicial: filtros.dataInicial,
        dataFinal: filtros.dataFinal
      })
    }

    const resultados = await Promise.allSettled(
      operadorasParaBuscar.map(async (operadora) => {
        const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)
        const temFiltroData = Boolean(filtrosBuscaBase?.dataInicial || filtrosBuscaBase?.dataFinal)
        const dadosTabela = temFiltroData
          ? await buscarDadosTabelaAlternativo(nomeTabela, {
            ...filtrosBuscaBase,
            dateColumns: colunasDataRecebimento
          })
          : await buscarDadosTabela(nomeTabela, filtrosBuscaBase)

        return dadosTabela || []
      })
    )

    const falhas = resultados
      .map((resultado, index) => ({ resultado, nomeTabela: construirNomeTabela(empresaSel.nome, operadorasParaBuscar[index]) }))
      .filter(item => item.resultado.status === 'rejected')

    if (falhas.length > 0) {
      const detalhes = falhas
        .slice(0, 3)
        .map(item => `${item.nomeTabela}: ${item.resultado.reason?.message || item.resultado.reason}`)
        .join(' | ')

      throw new Error(`Falha ao consultar recebimentos no Supabase. ${detalhes}`)
    }

    return resultados
      .filter(resultado => resultado.status === 'fulfilled')
      .flatMap(resultado => resultado.value || [])
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
