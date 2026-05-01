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
            empresa: empresaSel.nome,
            matriz: empresaSel.matriz,
            ...(filtros && {
              dataInicial: filtros.dataInicial,
              dataFinal: filtros.dataFinal
            })
          }

          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
          let dadosCompletosTabela = dadosTabela

          // Complemento para não perder ALUGUEL DE MAQUININHA quando a data útil está em data_venda.
          const temFiltroData = Boolean(filtrosBusca?.dataInicial || filtrosBusca?.dataFinal)
          if (temFiltroData) {
            const dadosPorDataVenda = await buscarDadosTabela(nomeTabela, {
              ...filtrosBusca,
              dateColumn: 'data_venda'
            })

            if (dadosPorDataVenda?.length) {
              const chavesExistentes = new Set((dadosTabela || []).map(chaveRegistro))
              const adicionaisAluguel = dadosPorDataVenda.filter(registro =>
                isAluguelMaquininha(registro) && !chavesExistentes.has(chaveRegistro(registro))
              )
              if (adicionaisAluguel.length) {
                dadosCompletosTabela = [...dadosTabela, ...adicionaisAluguel]
              }
            }
          }

          allData = [...allData, ...dadosCompletosTabela]
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
