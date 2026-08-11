import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'

export const useAllCompaniesDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, fetchEmpresas, obterOperadorasEmpresa } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const colunasDataRecebimento = ['data_recebimento', 'data_pgto', 'data_pagamento', 'data']
  const operadorasPermitidas = new Set(['unica', 'stone', 'cielo', 'rede', 'getnet', 'safra', 'sipag', 'azulzinha'])
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

  const buscarTodasEmpresas = async (filtros = {}) => {
    let allData = []

    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }

    for (const empresa of empresas.value) {
      if (!empresa.autorizadoras) continue

      const operadorasBase = [...(obterOperadorasEmpresa(empresa) || []), 'azulzinha']
      const operadoras = [...new Set(operadorasBase
        .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
        .filter(op => operadorasPermitidas.has(op)))]
      if (operadoras.length === 0) continue

      for (const operadora of operadoras) {
        const tabela = construirNomeTabela(empresa.nome, operadora)

        const filtrosBusca = {
          ...(filtros.dataInicial && { dataInicial: filtros.dataInicial }),
          ...(filtros.dataFinal && { dataFinal: filtros.dataFinal })
        }

        const temFiltroData = Boolean(filtrosBusca.dataInicial || filtrosBusca.dataFinal)
        const dadosTabela = temFiltroData
          ? await buscarDadosTabelaAlternativo(tabela, {
            ...filtrosBusca,
            dateColumns: colunasDataRecebimento
          })
          : await buscarDadosTabela(tabela, filtrosBusca)

        allData = [...allData, ...(dadosTabela || [])]
      }
    }

    return allData
  }

  return {
    buscarTodasEmpresas
  }
}
