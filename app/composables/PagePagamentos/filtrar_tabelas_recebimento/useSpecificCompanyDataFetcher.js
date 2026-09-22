import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useScopedTableRead } from '~/composables/useScopedTableRead'
import { getOperadorasParaTabela } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/constants'
import { normalizarSegmentoTabelaPix } from '~/composables/PageControladoria/pix_manual_shared/common'

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
  const quebrarLista = (valor) => String(valor || '')
    .split(/[;,\n|/]+/)
    .map(item => String(item || '').trim())
    .filter(Boolean)
  const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
  const mapaOperadoras = {
    pagbank: 'pagseguro',
    pagseguro: 'pagseguro',
    safra: 'safra',
    safrapay: 'safra'
  }
  const operadorasPermitidas = new Set([...operadorasConhecidas, 'pagseguro'])
  const getDebugEndpoint = () => {
    if (!process.client) return ''

    const configured = String(useRuntimeConfig().public?.debugEventEndpoint || '').trim()
    if (!configured) return ''

    try {
      const endpoint = new URL(configured, window.location.origin)
      const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(endpoint.hostname)

      if (endpoint.protocol !== 'https:' && !isLoopback) {
        return ''
      }

      return endpoint.toString()
    } catch {
      return ''
    }
  }
  // #region debug-point A:recebimentos-fetch-helper
  const reportPdfZipDebug = (hypothesisId, location, msg, data = {}) => {
    const endpoint = getDebugEndpoint()
    if (!endpoint) return

    fetch(endpoint, {
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

  const criarNomeTabelaPix = (empresa) => `recebimento_pix_${normalizarSegmentoTabelaPix(empresa)}`

  const mapearPixManualParaRecebimento = (registro = {}, nomeTabela = '') => {
    const brutoSeparado = Number(registro?.valor_bruto ?? 0) || 0
    const mdr = Number(registro?.despesa_mdr ?? 0) || 0
    const liquidoCombinado = Number(registro?.valor_bruto_despesa_mdr ?? 0) || 0
    const usaSchemaCombinado = registro?.valor_bruto == null && registro?.valor_bruto_despesa_mdr != null
    const valorBruto = usaSchemaCombinado ? liquidoCombinado : brutoSeparado
    const valorLiquido = usaSchemaCombinado ? liquidoCombinado : (Number(registro?.valor_liquido ?? NaN) || (valorBruto - mdr))
    const dataBase = registro?.data_recebimento || registro?.data_pgto || registro?.data_pagamento || registro?.data_venda || null

    return {
      ...registro,
      modalidade: 'Pix',
      bandeira: registro?.bandeira || 'PIX',
      nsu: registro?.nsu || '',
      data_recebimento: dataBase,
      data_pgto: registro?.data_pgto || dataBase,
      data_pagamento: registro?.data_pagamento || dataBase,
      numero_parcelas: Number(registro?.numero_parcelas || 1) || 1,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      taxa_mdr: Number(registro?.taxa_mdr ?? 0) || 0,
      despesa_mdr: usaSchemaCombinado ? 0 : mdr,
      valor_antecipacao: Number(registro?.valor_antecipacao ?? 0) || 0,
      despesa_antecipacao: Number(registro?.despesa_antecipacao ?? 0) || 0,
      valor_liquido_antecipacao: Number(registro?.valor_liquido_antecipacao ?? 0) || 0,
      __source_table: nomeTabela
    }
  }

  const buscarPixManual = async (empresaSel, filtrosBusca = {}) => {
    const nomeTabela = criarNomeTabelaPix(empresaSel.nome)
    const tabelaExiste = await verificarTabelaExiste(nomeTabela)
    if (!tabelaExiste) return []

    const filtrosPix = {
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz,
      dataInicial: filtrosBusca?.dataInicial,
      dataFinal: filtrosBusca?.dataFinal,
      dateColumn: 'data_venda',
      dateColumns: ['data_venda']
    }

    try {
      const dados = await buscarDadosTabela(nomeTabela, {
        ...filtrosPix,
        columns: 'id, data_venda, empresa, matriz, adquirente, observacoes, valor_bruto, despesa_mdr'
      })
      return (dados || []).map(item => mapearPixManualParaRecebimento(item, nomeTabela))
    } catch (erro) {
      if (!String(erro?.message || '').includes('despesa_mdr')) {
        throw erro
      }
    }

    const dadosCombinados = await buscarDadosTabela(nomeTabela, {
      ...filtrosPix,
      columns: 'id, data_venda, empresa, matriz, adquirente, observacoes, valor_bruto_despesa_mdr'
    })
    return (dadosCombinados || []).map(item => mapearPixManualParaRecebimento(item, nomeTabela))
  }

  const listarTabelasVoucher = async (empresaSel, operadoraFiltro = '') => {
    const nomesTabelas = []
    const tabelasAdicionadas = new Set()
    const filtroNormalizado = normalizarOperadora(operadoraFiltro)
    const vouchersConfigurados = quebrarLista(empresaSel?.vouchersCadastrados || '')

    for (const voucher of vouchersConfigurados) {
      const candidatos = Array.from(new Set(
        getOperadorasParaTabela(voucher)
          .map(item => normalizarOperadora(item))
          .filter(Boolean)
      ))
      for (const candidato of candidatos) {
        if (filtroNormalizado && candidato !== filtroNormalizado) continue
        const nomeTabela = construirNomeTabela(empresaSel.nome, candidato)
        if (tabelasAdicionadas.has(nomeTabela)) continue
        if (!(await verificarTabelaExiste(nomeTabela))) continue
        tabelasAdicionadas.add(nomeTabela)
        nomesTabelas.push(nomeTabela)
      }
    }

    return nomesTabelas
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
        .select('id', { head: true })
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
    const operadoraFiltro = filtros?.operadora ? (mapaOperadoras[normalizarOperadora(filtros.operadora)] || normalizarOperadora(filtros.operadora)) : ''
    const filtroEhPix = operadoraFiltro === 'pix'
    const operadorasParaBuscar = [...new Set(operadorasBrutas
      .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
      .filter(op => op && operadoraValida(op) && operadorasPermitidas.has(op) && (!operadoraFiltro || operadoraFiltro === op)))]

    const filtrosBuscaBase = {
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz,
      ...(filtros && {
        dataInicial: filtros.dataInicial,
        dataFinal: filtros.dataFinal
      })
    }

    const consultas = []

    if (!filtroEhPix) {
      for (const operadora of operadorasParaBuscar) {
        const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)

        consultas.push({
          nomeTabela,
          executar: async () => await buscarTabelaComRetry(operadora, empresaSel, filtrosBuscaBase)
        })
      }

      const tabelasVoucher = await listarTabelasVoucher(empresaSel, operadoraFiltro)
      for (const nomeTabela of tabelasVoucher) {
        consultas.push({
          nomeTabela,
          executar: async () => {
            const dadosTabela = Boolean(filtrosBuscaBase?.dataInicial || filtrosBuscaBase?.dataFinal)
              ? await buscarDadosTabelaAlternativo(nomeTabela, {
                ...filtrosBuscaBase,
                dateColumns: colunasDataRecebimento
              })
              : await buscarDadosTabela(nomeTabela, filtrosBuscaBase)
            return dadosTabela || []
          }
        })
      }
    }

    if (!operadoraFiltro || filtroEhPix) {
      consultas.push({
        nomeTabela: criarNomeTabelaPix(empresaSel.nome),
        executar: async () => await buscarPixManual(empresaSel, filtrosBuscaBase)
      })
    }

    const resultados = await Promise.allSettled(
      consultas.map(async ({ executar }) => await executar())
    )

    const falhas = resultados
      .map((resultado, index) => ({ resultado, nomeTabela: consultas[index].nomeTabela }))
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
      const falhasReais = falhas.filter(item => !String(item.resultado.reason?.message || '').includes('não existe'))
      if (falhasReais.length > 0) {
        const detalhes = falhasReais
        .slice(0, 3)
        .map(item => `${item.nomeTabela}: ${item.resultado.reason?.message || item.resultado.reason}`)
        .join(' | ')

        throw new Error(`Falha ao consultar recebimentos no Supabase. ${detalhes}`)
      }
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
