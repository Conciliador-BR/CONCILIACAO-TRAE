import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { useAPIsupabase } from '../../useAPIsupabase'

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const { supabase } = useAPIsupabase()

  // Lista das operadoras conhecidas como fallback
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  // Função para verificar se uma tabela existe
  const verificarTabelaExiste = async (nomeTabela) => {
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      if (!error) {
        console.log(`✅ [PAGAMENTOS] Tabela ${nomeTabela} confirmada como existente`)
        return true
      }
      
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        console.log(`⚠️ [PAGAMENTOS] Tabela ${nomeTabela} não existe`)
        return false
      }
      
      console.log(`⚠️ [PAGAMENTOS] Tabela ${nomeTabela} - erro desconhecido:`, error.message)
      return false
      
    } catch (err) {
      console.log(`❌ [PAGAMENTOS] Erro ao verificar tabela ${nomeTabela}:`, err.message)
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
        console.log(`✅ [PAGAMENTOS] Tabela ${nomeTabela} existe! Buscando dados...`)
        
        try {
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosCompletos)
          console.log(`📊 [PAGAMENTOS] Encontrados ${dadosTabela.length} registros na tabela ${nomeTabela}`)
          
          // Se não encontrou dados com busca exata, tentar busca alternativa
          if (dadosTabela.length === 0) {
            console.log(`🔄 [PAGAMENTOS] Nenhum dado encontrado com busca exata. Tentando busca alternativa...`)
            const dadosAlternativos = await buscarDadosTabelaAlternativo(nomeTabela, filtrosCompletos)
            console.log(`📊 [PAGAMENTOS] Busca alternativa encontrou ${dadosAlternativos.length} registros na tabela ${nomeTabela}`)
            allData = [...allData, ...dadosAlternativos]
          } else {
            allData = [...allData, ...dadosTabela]
          }
        } catch (error) {
          console.log(`❌ [PAGAMENTOS] Erro ao buscar dados da tabela ${nomeTabela}:`, error.message)
        }
      } else {
        console.log(`⏭️ [PAGAMENTOS] Pulando tabela inexistente: ${nomeTabela}`)
      }
    }
    
    // Sempre tentar a tabela genérica como fallback
    console.log('🔍 [PAGAMENTOS] Verificando tabela genérica: vendas_norte_atacado_unica')
    const tabelaGenericaExiste = await verificarTabelaExiste('vendas_norte_atacado_unica')
    
    if (tabelaGenericaExiste) {
      console.log('✅ [PAGAMENTOS] Tabela genérica existe! Buscando dados...')
      try {
        const dadosGenericos = await buscarDadosTabela('vendas_norte_atacado_unica', filtrosCompletos)
        console.log(`📊 [PAGAMENTOS] Encontrados ${dadosGenericos.length} registros na tabela genérica`)
        
        // Se não encontrou dados com busca exata, tentar busca alternativa
        if (dadosGenericos.length === 0) {
          console.log(`🔄 [PAGAMENTOS] Nenhum dado encontrado na tabela genérica com busca exata. Tentando busca alternativa...`)
          const dadosAlternativos = await buscarDadosTabelaAlternativo('vendas_norte_atacado_unica', filtrosCompletos)
          console.log(`📊 [PAGAMENTOS] Busca alternativa na tabela genérica encontrou ${dadosAlternativos.length} registros`)
          allData = [...allData, ...dadosAlternativos]
        } else {
          allData = [...allData, ...dadosGenericos]
        }
      } catch (error) {
        console.log('❌ [PAGAMENTOS] Erro ao buscar na tabela genérica:', error.message)
      }
    } else {
      console.log('⚠️ [PAGAMENTOS] Tabela genérica vendas_norte_atacado_unica não existe')
    }
    
    console.log(`🎉 [PAGAMENTOS] === BUSCA FINALIZADA === Total: ${allData.length} registros`)
    
    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}