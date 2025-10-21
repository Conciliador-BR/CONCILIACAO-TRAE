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
        return true
      }
      
      // Verificar se o erro é especificamente de tabela não encontrada
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        return false
      }
      
      // Para outros tipos de erro, assumir que a tabela não existe
      return false
      
    } catch (err) {
      return false
    }
  }

  const buscarEmpresaEspecifica = async (filtros = {}) => {
    let allData = []
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    
    if (!empresaSel?.nome) {
      return allData
    }

    // Obter operadoras específicas da empresa
    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    
    // Se a empresa tem operadoras específicas, usar apenas essas
    // Caso contrário, usar todas as operadoras conhecidas
    const operadorasParaBuscar = operadorasEmpresa.length > 0 ? operadorasEmpresa : operadorasConhecidas
    
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
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const tabelaExiste = await verificarTabelaExiste(nomeTabela)
      
      if (tabelaExiste) {
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
          
          allData = [...allData, ...dadosTabela]
        } catch (error) {
          // Error handling without console.log
        }
      }
    }
    
    // Sempre tentar a tabela genérica vendas_norte_atacado_unica como fallback
    const tabelaGenericaExiste = await verificarTabelaExiste('vendas_norte_atacado_unica')
    
    if (tabelaGenericaExiste) {
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
        
        allData = [...allData, ...dadosGenericos]
      } catch (error) {
        // Error handling without console.log
      }
    }
    
    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}