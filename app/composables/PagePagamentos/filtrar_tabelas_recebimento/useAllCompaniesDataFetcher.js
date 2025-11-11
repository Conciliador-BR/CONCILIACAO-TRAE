import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'

export const useAllCompaniesDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, fetchEmpresas, obterOperadorasEmpresa } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()

  const buscarTodasEmpresas = async (filtros = {}) => {
    let allData = []

    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }

    for (const empresa of empresas.value) {
      if (!empresa.autorizadoras) continue

      const operadoras = obterOperadorasEmpresa(empresa)

      for (const operadora of operadoras) {
        const tabela = construirNomeTabela(empresa.nome, operadora)

        const filtrosBusca = {
          ...(filtros.dataInicial && { dataInicial: filtros.dataInicial }),
          ...(filtros.dataFinal && { dataFinal: filtros.dataFinal })
        }

        const dadosTabela = await buscarDadosTabela(tabela, filtrosBusca)
        allData = [...allData, ...dadosTabela]
      }
    }

    return allData
  }

  return {
    buscarTodasEmpresas
  }
}