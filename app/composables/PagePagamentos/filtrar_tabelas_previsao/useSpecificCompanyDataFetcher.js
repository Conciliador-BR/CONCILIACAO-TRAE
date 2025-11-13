import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { useAPIsupabase } from '../../useAPIsupabase'

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const { supabase } = useAPIsupabase()
  const tabelaExisteCache = new Map()

  // Lista das operadoras conhecidas como fallback
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  // Função para verificar se uma tabela existe
  const verificarTabelaExiste = async (nomeTabela) => {
    if (tabelaExisteCache.has(nomeTabela)) {
      return tabelaExisteCache.get(nomeTabela)
    }
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      if (!error) {
        tabelaExisteCache.set(nomeTabela, true)
        return true
      }
      
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        tabelaExisteCache.set(nomeTabela, false)
        return false
      }
      
      tabelaExisteCache.set(nomeTabela, false)
      return false
      
    } catch (err) {
      tabelaExisteCache.set(nomeTabela, false)
      return false
    }
  }

  const buscarEmpresaEspecifica = async (filtros = {}) => {
    console.log('🚀 [PAGAMENTOS] === INICIANDO BUSCA DE EMPRESA ESPECÍFICA ===')
    
    let allData = []
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    
    console.log('📋 [PAGAMENTOS] Empresa selecionada:', empresaSel)
    
    if (!empresaSel?.nome) {
      console.log('❌ [PAGAMENTOS] Nenhuma empresa selecionada')
      return allData
    }

    // Obter operadoras específicas da empresa
    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    console.log('🎯 [PAGAMENTOS] Operadoras específicas da empresa:', operadorasEmpresa)
    
    // Se a empresa tem operadoras específicas, usar apenas essas
    const operadorasParaBuscar = operadorasEmpresa.length > 0 ? operadorasEmpresa : operadorasConhecidas
    
    console.log(`✅ [PAGAMENTOS] Buscando vendas para: ${empresaSel.nome}`)
    console.log(`🔍 [PAGAMENTOS] Operadoras a serem buscadas: ${operadorasParaBuscar.join(', ')}`)
    
    // Preparar filtros com dados da empresa
    const filtrosCompletos = {
      ...filtros,
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz
    }
    
    // Buscar nas operadoras específicas da empresa
    for (const operadora of operadorasParaBuscar) {
      const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)
      console.log(`🔍 [PAGAMENTOS] Verificando tabela: ${nomeTabela}`)
      
      const tabelaExiste = await verificarTabelaExiste(nomeTabela)
      
      if (tabelaExiste) {
        try {
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosCompletos)
          
          // Se não encontrou dados com busca exata, tentar busca alternativa
          if (dadosTabela.length === 0) {
            const dadosAlternativos = await buscarDadosTabelaAlternativo(nomeTabela, filtrosCompletos)
            allData = [...allData, ...dadosAlternativos]
          } else {
            allData = [...allData, ...dadosTabela]
          }
        } catch (error) {
          // Erro silencioso para evitar spam
        }
      }
    }
    
    // Sempre tentar a tabela genérica como fallback
    const tabelaGenericaExiste = await verificarTabelaExiste('vendas_norte_atacado_unica')
    
    if (tabelaGenericaExiste) {
      try {
        const dadosGenericos = await buscarDadosTabela('vendas_norte_atacado_unica', filtrosCompletos)
        
        // Se não encontrou dados com busca exata, tentar busca alternativa
        if (dadosGenericos.length === 0) {
          const dadosAlternativos = await buscarDadosTabelaAlternativo('vendas_norte_atacado_unica', filtrosCompletos)
          allData = [...allData, ...dadosAlternativos]
        } else {
          allData = [...allData, ...dadosGenericos]
        }
      } catch (error) {
        // Erro silencioso para evitar spam
      }
    }
    
    console.log(`🎉 [PAGAMENTOS] === BUSCA FINALIZADA === Total: ${allData.length} registros`)
    
    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
