import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { supabase } from '../useSupabaseConfig'

const tabelaExisteCacheGlobal = new Map()

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const normalizarToken = (value) => String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const normalizarListaUnica = (lista = []) => Array.from(new Set((lista || []).map(normalizarToken).filter(Boolean)))

  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay', 'mercadopago', 'pagseguro']

  // Função para verificar se uma tabela existe sem gerar erros de "public."
  const verificarTabelaExiste = async (nomeTabela) => {
    if (tabelaExisteCacheGlobal.has(nomeTabela)) {
      return tabelaExisteCacheGlobal.get(nomeTabela)
    }
    try {
      // Fazer uma consulta muito específica e limitada
      const { data, error, count } = await supabase
        .from(nomeTabela)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      // Se não há erro, a tabela existe
      if (!error) {
        tabelaExisteCacheGlobal.set(nomeTabela, true)
        return true
      }
      
      // Verificar se o erro é especificamente de tabela não encontrada
      if (error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('relation') ||
        error.code === 'PGRST116'
      )) {
        tabelaExisteCacheGlobal.set(nomeTabela, false)
        return false
      }
      
      // Para outros tipos de erro, assumir que a tabela não existe
      tabelaExisteCacheGlobal.set(nomeTabela, false)
      return false
      
    } catch (err) {
      tabelaExisteCacheGlobal.set(nomeTabela, false)
      return false
    }
  }

  const buscarEmpresaEspecifica = async (filtros = {}) => {
    let allData = []
    const empresaSelGlobal = await obterEmpresaSelecionadaCompleta()
    const empresaOverride = filtros?.empresaOverride
    const empresaSel = empresaOverride?.nome ? { nome: empresaOverride.nome, matriz: empresaOverride.matriz } : empresaSelGlobal
    
    if (!empresaSel?.nome) {
      return allData
    }
    
    // Obter operadoras específicas da empresa (dinâmico por empresa filtrada)
    const operadorasEmpresa = normalizarListaUnica(
      String(empresaSel.autorizadoras || '')
        .split(';')
        .map(op => op.trim())
        .filter(Boolean)
    )
    const operadoraFiltro = filtros?.operadora ? normalizarToken(filtros.operadora) : null
    const operadorasParaBuscar = operadoraFiltro
      ? [operadoraFiltro]
      : (operadorasEmpresa.length > 0 ? operadorasEmpresa : operadorasConhecidas)
    
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
    const tabelasConsultadas = new Set()
    for (const operadora of operadorasParaBuscar) {
      const nomeTabela = `vendas_${empresaNormalizada}_${operadora}`
      if (tabelasConsultadas.has(nomeTabela)) continue
      tabelasConsultadas.add(nomeTabela)
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const tabelaExiste = await verificarTabelaExiste(nomeTabela)
      
      if (tabelaExiste) {
        try {
          const filtrosBusca = {
            empresa: empresaSel.nome,
            matriz: empresaSel.matriz,
            ...(filtros && {
              dataInicial: filtros.dataInicial,
              dataFinal: filtros.dataFinal,
              nsu: filtros.nsu,
              nsus: filtros.nsus,
              dateColumn: filtros.dateColumn,
              columns: filtros.columns
            })
          }
          
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
          
          // Se não encontrou dados com busca exata, tentar busca alternativa
          if (dadosTabela.length === 0) {
            const dadosAlternativos = await buscarDadosTabelaAlternativo(nomeTabela, filtrosBusca)
            allData = [...allData, ...dadosAlternativos]
          } else {
            allData = [...allData, ...dadosTabela]
          }
        } catch (error) {
          // Error handling without console.log
        }
      }
    }
    
    // Tentar tabela genérica APENAS se não houver dados nas tabelas específicas
    if (allData.length === 0 && !operadoraFiltro) {
      const tabelaGenericaExiste = await verificarTabelaExiste('vendas_norte_atacado_unica')
      
      if (tabelaGenericaExiste) {
        try {
          const filtrosBusca = {
            empresa: empresaSel.nome,
            matriz: empresaSel.matriz,
            ...(filtros && {
              dataInicial: filtros.dataInicial,
              dataFinal: filtros.dataFinal,
              nsu: filtros.nsu,
              nsus: filtros.nsus,
              dateColumn: filtros.dateColumn,
              columns: filtros.columns
            })
          }
          
          const dadosGenericos = await buscarDadosTabela('vendas_norte_atacado_unica', filtrosBusca)
          
          allData = [...allData, ...dadosGenericos]
        } catch (error) {
          // Error handling without console.log
        }
      }
    }
    
    // Retornar todos os dados sem deduplicação por NSU
    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
