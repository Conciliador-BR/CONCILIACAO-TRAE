import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '../useSupabaseConfig'

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()

  // Lista das operadoras conhecidas como fallback
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  // Função para verificar se uma tabela existe sem gerar erros de "public."
  const verificarTabelaExiste = async (nomeTabela) => {
    try {
      // Fazer uma consulta muito específica e limitada
      const { data, error, count } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      // Se não há erro, a tabela existe
      if (!error) {
        console.log(`✅ Tabela ${nomeTabela} confirmada como existente`)
        return true
      }
      
      // Verificar se o erro é especificamente de tabela não encontrada
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        console.log(`⚠️ Tabela ${nomeTabela} não existe (confirmado)`)
        return false
      }
      
      // Para outros tipos de erro, assumir que a tabela não existe
      console.log(`⚠️ Tabela ${nomeTabela} - erro desconhecido:`, error.message)
      return false
      
    } catch (err) {
      console.log(`❌ Erro ao verificar tabela ${nomeTabela}:`, err.message)
      return false
    }
  }

  const buscarEmpresaEspecifica = async () => {
    console.log('🚀 === INICIANDO BUSCA OTIMIZADA DE EMPRESA ESPECÍFICA ===')
    
    let allData = []
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    
    console.log('📋 Empresa selecionada:', empresaSel)
    
    if (!empresaSel?.nome) {
      console.log('❌ Nenhuma empresa selecionada')
      return allData
    }

    // Obter operadoras específicas da empresa
    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    console.log('🎯 Operadoras específicas da empresa:', operadorasEmpresa)
    
    // Se a empresa tem operadoras específicas, usar apenas essas
    // Caso contrário, usar todas as operadoras conhecidas
    const operadorasParaBuscar = operadorasEmpresa.length > 0 ? operadorasEmpresa : operadorasConhecidas
    
    console.log(`✅ Buscando vendas para: ${empresaSel.nome}`)
    console.log(`🔍 Operadoras a serem buscadas: ${operadorasParaBuscar.join(', ')}`)
    
    // Normalizar nome da empresa para buscar tabelas
    const empresaNormalizada = empresaSel.nome
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    console.log(`🔍 Nome da empresa normalizado: ${empresaNormalizada}`)
    
    // Buscar apenas nas operadoras específicas da empresa
    for (const operadora of operadorasParaBuscar) {
      // Normalizar nome da operadora
      const operadoraNormalizada = operadora
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      
      const nomeTabela = `vendas_${empresaNormalizada}_${operadoraNormalizada}`
      console.log(`🔍 Verificando existência da tabela: ${nomeTabela}`)
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const tabelaExiste = await verificarTabelaExiste(nomeTabela)
      
      if (tabelaExiste) {
        console.log(`✅ Tabela ${nomeTabela} existe! Buscando dados...`)
        
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
          console.log(`📊 Encontrados ${dadosTabela.length} registros na tabela ${nomeTabela}`)
          
          allData = [...allData, ...dadosTabela]
        } catch (error) {
          console.log(`❌ Erro ao buscar dados da tabela ${nomeTabela}:`, error.message)
        }
      } else {
        console.log(`⏭️ Pulando tabela inexistente: ${nomeTabela}`)
      }
    }
    
    // Sempre tentar a tabela genérica vendas_norte_atacado_unica como fallback
    console.log('🔍 Verificando tabela genérica: vendas_norte_atacado_unica')
    const tabelaGenericaExiste = await verificarTabelaExiste('vendas_norte_atacado_unica')
    
    if (tabelaGenericaExiste) {
      console.log('✅ Tabela genérica existe! Buscando dados...')
      try {
        const filtrosBusca = {
          empresa: empresaSel.nome,
          matriz: empresaSel.matriz,
          ...(filtros && {
            dataInicial: filtros.dataInicial,
            dataFinal: filtros.dataFinal
          })
        }
        
        const dadosGenericos = await buscarDadosTabela('vendas_norte_atacado_unica', filtrosBusca)
        console.log(`📊 Encontrados ${dadosGenericos.length} registros na tabela genérica`)
        
        allData = [...allData, ...dadosGenericos]
      } catch (error) {
        console.log('❌ Erro ao buscar na tabela genérica:', error.message)
      }
    } else {
      console.log('⚠️ Tabela genérica vendas_norte_atacado_unica não existe')
    }
    
    console.log(`🎉 === BUSCA FINALIZADA === Total de registros encontrados: ${allData.length}`)
    console.log(`📈 Otimização: Buscou apenas ${operadorasParaBuscar.length} operadoras específicas em vez de ${operadorasConhecidas.length} operadoras genéricas`)
    
    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}