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
  const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
  const mapaOperadoras = {
    pagbank: 'pagseguro',
    pagseguro: 'pagseguro',
    safra: 'safra',
    safrapay: 'safra'
  }
  const operadorasPermitidas = new Set(operadorasConhecidas)
  // #region debug-point A:recebimentos-fetch-helper
  const reportPdfZipDebug = (hypothesisId, location, msg, data = {}) => {
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'pdf-zip-recebimentos',
        runId: 'pre-fix',
        hypothesisId,
        location,
        msg,
        data,
        ts: Date.now()
      })
    }).catch(() => {})
  }
  // #endregion

  const normalizarMensagemErro = (erro) => {
    return erro?.message || String(erro || 'Erro desconhecido')
  }

  const buscarTabelaComRetry = async (operadora, empresaSel, filtrosBuscaBase) => {
    const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)
    const temFiltroData = Boolean(filtrosBuscaBase?.dataInicial || filtrosBuscaBase?.dataFinal)
    const maxTentativas = 3
    let ultimoErro = null

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
      try {
        // #region debug-point A:recebimentos-fetch-start
        reportPdfZipDebug('A', 'useSpecificCompanyDataFetcher.js:58', '[DEBUG] Iniciando leitura de tabela de recebimentos', {
          nomeTabela,
          operadora,
          tentativa,
          empresa: empresaSel.nome,
          matriz: empresaSel.matriz,
          dataInicial: filtrosBuscaBase?.dataInicial || '',
          dataFinal: filtrosBuscaBase?.dataFinal || ''
        })
        // #endregion
        const dadosTabela = temFiltroData
          ? await buscarDadosTabelaAlternativo(nomeTabela, {
            ...filtrosBuscaBase,
            dateColumns: colunasDataRecebimento
          })
          : await buscarDadosTabela(nomeTabela, filtrosBuscaBase)

        // #region debug-point A:recebimentos-fetch-success
        reportPdfZipDebug('A', 'useSpecificCompanyDataFetcher.js:74', '[DEBUG] Leitura de tabela de recebimentos concluida', {
          nomeTabela,
          operadora,
          tentativa,
          totalRegistros: Array.isArray(dadosTabela) ? dadosTabela.length : 0
        })
        // #endregion

        return dadosTabela || []
      } catch (erro) {
        ultimoErro = erro
        const mensagemErro = normalizarMensagemErro(erro)

        // #region debug-point B:recebimentos-fetch-retry
        reportPdfZipDebug('B', 'useSpecificCompanyDataFetcher.js:87', '[DEBUG] Tentativa de leitura de recebimentos falhou', {
          nomeTabela,
          operadora,
          tentativa,
          maxTentativas,
          erro: mensagemErro
        })
        // #endregion

        if (tentativa >= maxTentativas) {
          throw ultimoErro
        }

        await sleep(500 * tentativa)
      }
    }

    throw ultimoErro || new Error(`Falha ao consultar ${nomeTabela}`)
  }

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

    const resultados = []

    for (const operadora of operadorasParaBuscar) {
      const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)

      try {
        const dadosTabela = await buscarTabelaComRetry(operadora, empresaSel, filtrosBuscaBase)
        resultados.push({
          status: 'fulfilled',
          value: dadosTabela
        })
      } catch (erro) {
        resultados.push({
          status: 'rejected',
          reason: erro
        })
      }
    }

    const falhas = resultados
      .map((resultado, index) => ({ resultado, nomeTabela: construirNomeTabela(empresaSel.nome, operadorasParaBuscar[index]) }))
      .filter(item => item.resultado.status === 'rejected')

    if (falhas.length > 0) {
      // #region debug-point B:recebimentos-fetch-failure
      reportPdfZipDebug('B', 'useSpecificCompanyDataFetcher.js:104', '[DEBUG] Falha ao consultar tabelas de recebimentos', {
        totalFalhas: falhas.length,
        falhas: falhas.map(item => ({
          nomeTabela: item.nomeTabela,
          erro: item.resultado.reason?.message || String(item.resultado.reason || '')
        }))
      })
      // #endregion
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
