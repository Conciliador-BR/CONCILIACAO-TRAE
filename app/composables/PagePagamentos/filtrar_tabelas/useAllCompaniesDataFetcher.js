import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'

export const useAllCompaniesDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, fetchEmpresas, obterOperadorasEmpresa } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()

  const buscarTodasEmpresas = async (filtros = {}) => {
    console.log('🔄 [PAGAMENTOS] Buscando vendas de todas as empresas...')
    
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
        const dadosTabela = await buscarDadosTabela(tabela, filtros)
        allData = [...allData, ...dadosTabela]
      }
    }
    
    // 5. Buscar também na tabela genérica como fallback
    console.log('🔍 [PAGAMENTOS] Buscando na tabela genérica: vendas_operadora_unica')
    const dadosGenericos = await buscarDadosTabela('vendas_operadora_unica', filtros)
    allData = [...allData, ...dadosGenericos]
    
    console.log(`✅ [PAGAMENTOS] Total de registros encontrados: ${allData.length}`)
    return allData
  }

  return {
    buscarTodasEmpresas
  }
}