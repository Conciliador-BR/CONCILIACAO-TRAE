import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresaHelpers } from '~/composables/PageVendas/filtrar_tabelas/useEmpresaHelpers'
import { useValidacaoTabelas } from './useValidacaoTabelas'
import { useBuscaDados } from './useBuscaDados'
import { useFormatacaoDados } from './useFormatacaoDados'

export const useBuscaVendasSupabase = () => {
  const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
  const { verificarTabelaExiste } = useValidacaoTabelas()
  const { buscarDadosTabela } = useBuscaDados()
  const { normalizarNomeEmpresa, normalizarNomeOperadora } = useFormatacaoDados()

  // Função para buscar vendas do Supabase
  const fetchVendasSupabase = async (filtros = {}, estados) => {
    try {
      estados.loading.value = true
      estados.error.value = null
      
      let allData = []
      const empresaSel = await obterEmpresaSelecionadaCompleta()
      
      if (!empresaSel?.nome) {
        // Se não há empresa selecionada, buscar da tabela padrão
        const { data, error: supabaseError } = await supabase
          .from('vendas_norte_atacado_unica')
          .select('*')
          .gte('data_venda', filtros.dataInicial || '1900-01-01')
          .lte('data_venda', filtros.dataFinal || '2099-12-31')
          .order('data_venda', { ascending: false })
        
        if (supabaseError) {
          throw new Error(`Erro do Supabase: ${supabaseError.message}`)
        }
        
        allData = data || []
      } else {
        // Buscar nas tabelas específicas da empresa
        const operadorasEmpresa = await obterOperadorasEmpresaSelecionada()
        const operadorasParaBuscar = operadorasEmpresa.length > 0 ? operadorasEmpresa : estados.operadorasConhecidas
        
        // Normalizar nome da empresa
        const empresaNormalizada = normalizarNomeEmpresa(empresaSel.nome)
        
        for (const operadora of operadorasParaBuscar) {
          const operadoraNormalizada = normalizarNomeOperadora(operadora)
          const nomeTabela = `vendas_${empresaNormalizada}_${operadoraNormalizada}`
          
          const tabelaExiste = await verificarTabelaExiste(nomeTabela)
          
          if (tabelaExiste) {
            const filtrosBusca = {
              empresa: empresaSel.nome,
              matriz: empresaSel.matriz,
              dataInicial: filtros.dataInicial,
              dataFinal: filtros.dataFinal
            }
            
            const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
            allData = [...allData, ...dadosTabela]
          }
        }
      }
      
      estados.vendasOriginais.value = allData
      estados.vendas.value = [...allData]
      
      return allData
    } catch (err) {
      estados.error.value = err.message || 'Erro ao buscar vendas'
      console.error('❌ Erro ao buscar vendas do Supabase:', err)
      return []
    } finally {
      estados.loading.value = false
    }
  }

  return {
    fetchVendasSupabase
  }
}