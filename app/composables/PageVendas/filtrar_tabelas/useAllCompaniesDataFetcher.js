import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { useSpecificCompanyDataFetcher } from './useSpecificCompanyDataFetcher'

export const useAllCompaniesDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, fetchEmpresas, obterOperadorasEmpresa } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()
  const { verificarTabelaExiste } = useSpecificCompanyDataFetcher()

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
      const voucherTokens = [
        'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','up brasil','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
      ]
      const autStr = String(empresa.autorizadoras || '').toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_;,_-]/g, '')
      const voucherAutorizadas = voucherTokens.filter(v => autStr.includes(v))
      const operadoras = Array.from(new Set([...(operadorasBase || []), ...voucherAutorizadas]))
      
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
