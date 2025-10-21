import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'

export const useAllCompaniesDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, fetchEmpresas, obterOperadorasEmpresa } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()

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
      const operadoras = obterOperadorasEmpresa(empresa)
      
      // 4. Para cada operadora, buscar na tabela correspondente
      for (const operadora of operadoras) {
        const tabela = construirNomeTabela(empresa.nome, operadora)
        
        // Preparar filtros para busca (apenas filtros de data para todas as empresas)
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