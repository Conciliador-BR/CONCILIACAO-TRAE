import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

const tabelaExisteCache = new Map()

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()

  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay']
  const operadoraValida = (operadora) => /^[A-Za-z0-9À-ÿ _-]+$/.test(String(operadora || '').trim())
  const normalizarOperadora = (valor) => String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
  const mapaOperadoras = {
    pagbank: 'pagseguro',
    pagseguro: 'pagseguro',
    safra: 'safrapay',
    safrapay: 'safrapay'
  }
  const operadorasPermitidas = new Set(operadorasConhecidas)
  const normalizarTexto = (valor) => String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const isAluguelMaquininha = (registro) => {
    const modalidade = normalizarTexto(registro?.modalidade)
    return modalidade.includes('aluguel') && (
      modalidade.includes('maquin') ||
      modalidade.includes('terminal') ||
      modalidade.includes('pos')
    )
  }
  const isTaxaAntecipacao = (registro) => {
    const modalidade = normalizarTexto(registro?.modalidade)
    return modalidade.includes('antecip')
  }
  const chaveRegistro = (registro) => {
    const id = registro?.id ?? ''
    const nsu = String(registro?.nsu ?? '').trim()
    const modalidade = normalizarTexto(registro?.modalidade)
    const dataVenda = String(registro?.data_venda ?? registro?.data ?? '').trim()
    const despesaMdr = Number(registro?.despesa_mdr ?? 0) || 0
    return `${id}|${nsu}|${modalidade}|${dataVenda}|${despesaMdr}`
  }

  const verificarTabelaExiste = async (nomeTabela) => {
    if (tabelaExisteCache.has(nomeTabela)) {
      return tabelaExisteCache.get(nomeTabela)
    }
    try {
      const { error } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      const ok = !error
      tabelaExisteCache.set(nomeTabela, ok)
      return ok
    } catch (err) {
      tabelaExisteCache.set(nomeTabela, false)
      return false
    }
  }

  const buscarEmpresaEspecifica = async (filtros = {}) => {
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    if (!empresaSel?.nome) {
      return []
    }

    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    const operadorasBrutas = operadorasEmpresa.length > 0 ? operadorasEmpresa : []
    const operadorasParaBuscar = [...new Set(operadorasBrutas)]
      .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
      .filter(op => op && operadoraValida(op) && operadorasPermitidas.has(op))
    if (operadorasParaBuscar.length === 0) return allData

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
        const tabelaExiste = await verificarTabelaExiste(nomeTabela)
        if (!tabelaExiste) return []
        try {
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBuscaBase)
          let dadosCompletosTabela = dadosTabela

          // Complemento para não perder ALUGUEL DE MAQUININHA quando a data útil está em data_venda.
          const temFiltroData = Boolean(filtrosBuscaBase?.dataInicial || filtrosBuscaBase?.dataFinal)
          if (temFiltroData) {
            const dadosPorDataVenda = await buscarDadosTabela(nomeTabela, {
              ...filtrosBuscaBase,
              dateColumn: 'data_venda'
            })

            if (dadosPorDataVenda?.length) {
              const chavesExistentes = new Set((dadosTabela || []).map(chaveRegistro))
              const adicionaisDataVenda = dadosPorDataVenda.filter(registro =>
                (isAluguelMaquininha(registro) || isTaxaAntecipacao(registro)) &&
                !chavesExistentes.has(chaveRegistro(registro))
              )
              if (adicionaisDataVenda.length) {
                dadosCompletosTabela = [...dadosTabela, ...adicionaisDataVenda]
              }
            }
          }

          return dadosCompletosTabela || []
        } catch {
          // silencioso
          return []
        }
      })
    )

    return resultados
      .filter(resultado => resultado.status === 'fulfilled')
      .flatMap(resultado => resultado.value || [])
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
