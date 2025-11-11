import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()

  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  const verificarTabelaExiste = async (nomeTabela) => {
    try {
      const { error } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)

      return !error
    } catch (err) {
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
    const operadorasParaBuscar = operadorasEmpresa.length > 0 ? operadorasEmpresa : operadorasConhecidas

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

          if (dadosTabela.length === 0) {
            const dadosAlternativos = await buscarDadosTabelaAlternativo(nomeTabela, filtrosBusca)
            allData = [...allData, ...dadosAlternativos]
          } else {
            allData = [...allData, ...dadosTabela]
          }
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