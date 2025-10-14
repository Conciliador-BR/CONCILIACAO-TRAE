import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '../useSupabaseConfig'

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { empresas, obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()

  // Lista das operadoras conhecidas para tentar buscar
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  const buscarEmpresaEspecifica = async () => {
    console.log('🚀 === INICIANDO BUSCA SIMPLIFICADA DE EMPRESA ESPECÍFICA ===')
    
    let allData = []
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    
    console.log('📋 Empresa selecionada:', empresaSel)
    
    if (!empresaSel?.nome) {
      console.log('❌ Nenhuma empresa selecionada')
      return allData
    }
    
    console.log(`✅ Buscando TODAS as tabelas de vendas para: ${empresaSel.nome}`)
    
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
    
    // Buscar em todas as operadoras conhecidas
    for (const operadora of operadorasConhecidas) {
      const nomeTabela = `vendas_${empresaNormalizada}_${operadora}`
      console.log(`🔍 Tentando buscar tabela: ${nomeTabela}`)
      
      try {
        // Testar se a tabela existe fazendo uma query simples
        const { data: testeData, error: testeError } = await supabase
          .from(nomeTabela)
          .select('id')
          .limit(1)
        
        if (!testeError) {
          console.log(`✅ Tabela ${nomeTabela} existe! Buscando dados...`)
          
          const filtros = {
            empresa: empresaSel.nome,
            matriz: empresaSel.matriz
          }
          
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtros)
          console.log(`📊 Encontrados ${dadosTabela.length} registros na tabela ${nomeTabela}`)
          
          allData = [...allData, ...dadosTabela]
        } else {
          console.log(`⚠️ Tabela ${nomeTabela} não existe ou erro:`, testeError.message)
        }
      } catch (error) {
        console.log(`❌ Erro ao acessar tabela ${nomeTabela}:`, error.message)
      }
    }
    
    // Também tentar a tabela genérica vendas_operadora_unica
    console.log('🔍 Tentando buscar na tabela genérica: vendas_operadora_unica')
    try {
      const filtros = {
        empresa: empresaSel.nome,
        matriz: empresaSel.matriz
      }
      
      const dadosGenericos = await buscarDadosTabela('vendas_operadora_unica', filtros)
      console.log(`📊 Encontrados ${dadosGenericos.length} registros na tabela genérica`)
      
      allData = [...allData, ...dadosGenericos]
    } catch (error) {
      console.log('❌ Erro ao buscar na tabela genérica:', error.message)
    }
    
    console.log(`🎉 === BUSCA FINALIZADA === Total de registros encontrados: ${allData.length}`)
    return allData
  }

  return {
    buscarEmpresaEspecifica
  }
}