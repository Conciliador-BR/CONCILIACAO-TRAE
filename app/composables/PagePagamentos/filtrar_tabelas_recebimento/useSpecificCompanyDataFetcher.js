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
    let allData = []
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    if (!empresaSel?.nome) {
      return allData
    }

    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    const operadorasBrutas = operadorasEmpresa.length > 0 ? operadorasEmpresa : []
    const operadorasParaBuscar = [...new Set(operadorasBrutas)]
      .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
      .filter(op => op && operadoraValida(op) && operadorasPermitidas.has(op))
    if (operadorasParaBuscar.length === 0) return allData

    for (const operadora of operadorasParaBuscar) {
      const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)
      const tabelaExiste = await verificarTabelaExiste(nomeTabela)

      if (tabelaExiste) {
        try {
          const filtrosBusca = {
            ...(filtros && {
              dataInicial: filtros.dataInicial,
              dataFinal: filtros.dataFinal
            })
          }

          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
          allData = [...allData, ...dadosTabela]
        } catch (error) {
          // silencioso
        }
      }
    }

    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
