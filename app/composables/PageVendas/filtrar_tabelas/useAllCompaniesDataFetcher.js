import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'

export const useAllCompaniesDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, fetchEmpresas, obterOperadorasEmpresa } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()
  const { verificarTabelaExiste } = useSpecificCompanyDataFetcher()
  const normalizarToken = (value) => String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  const buscarTodasEmpresas = async (filtros = {}) => {
    
    let allData = []
    
    // 1. Buscar todas as empresas
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }
    
    // 2. Para cada empresa, buscar suas operadoras autorizadas
    for (const empresa of empresas.value) {
      if (!empresa.autorizadoras) continue
      
      // 3. Obter operadoras da empresa
      const operadorasBase = obterOperadorasEmpresa(empresa)
      const operadoras = Array.from(new Set((operadorasBase || []).map(normalizarToken).filter(Boolean)))
      if (operadoras.length === 0) continue
      
    // 4. Para cada operadora, buscar na tabela correspondente
      for (const operadora of operadoras) {
        const tabela = construirNomeTabela(empresa.nome, operadora)

        const filtrosBusca = {
          ...(filtros.dataInicial && { dataInicial: filtros.dataInicial }),
          ...(filtros.dataFinal && { dataFinal: filtros.dataFinal }),
          ...(filtros.nsu && { nsu: filtros.nsu }),
          ...(filtros.dateColumn && { dateColumn: filtros.dateColumn }),
          ...(filtros.columns && { columns: filtros.columns })
        }

        const existe = await verificarTabelaExiste(tabela)
        if (!existe) continue

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
