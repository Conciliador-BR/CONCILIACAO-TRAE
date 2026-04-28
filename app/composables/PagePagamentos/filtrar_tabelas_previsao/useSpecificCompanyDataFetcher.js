import { useTableNameBuilder } from './useTableNameBuilder'
import { useEmpresaHelpers } from './useEmpresaHelpers'
import { useBatchDataFetcher } from './useBatchDataFetcher'
import { useAPIsupabase } from '../../useAPIsupabase'

const tabelaExisteCache = new Map()

export const useSpecificCompanyDataFetcher = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { buscarDadosTabela } = useBatchDataFetcher()
  const { supabase } = useAPIsupabase()

  // Mantem apenas operadoras de cartao para evitar consultas em tabelas inexistentes (voucher/bancos).
  const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safrapay']
  const normalizarOperadora = (valor) => String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
  const mapaOperadoras = {
    pagbank: 'pagseguro',
    pagseguro: 'pagseguro',
    safra: 'safrapay',
    safrapay: 'safrapay'
  }
  const operadorasPermitidas = new Set(operadorasConhecidas)
  const filtrarOperadorasValidas = (lista = []) => {
    return [...new Set((lista || [])
      .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
      .filter(op => operadorasPermitidas.has(op)))]
  }

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
    let allData = []
    const empresaSel = await obterEmpresaSelecionadaCompleta()
    if (!empresaSel?.nome) {
      return allData
    }

    // Obter operadoras específicas da empresa
    const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
    const operadorasParaBuscar = filtrarOperadorasValidas(operadorasEmpresa)
    if (operadorasParaBuscar.length === 0) return allData
    
    
    
    // Preparar filtros com dados da empresa
    const filtrosCompletos = {
      ...filtros,
      empresa: empresaSel.nome,
      matriz: empresaSel.matriz
    }
    
    // Buscar nas operadoras específicas da empresa
    for (const operadora of operadorasParaBuscar) {
      const nomeTabela = construirNomeTabela(empresaSel.nome, operadora)
      
      const tabelaExiste = await verificarTabelaExiste(nomeTabela)
      
      if (tabelaExiste) {
        try {
          const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosCompletos)
          allData = [...allData, ...dadosTabela]
        } catch (error) {
          // Erro silencioso para evitar spam
        }
      }
    }
    
    return allData
  }

  return {
    buscarEmpresaEspecifica,
    verificarTabelaExiste
  }
}
