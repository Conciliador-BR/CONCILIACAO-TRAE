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

  // Função para calcular período de busca (usar exatamente o período do filtro)
  const calcularPeriodoBusca = (filtros) => {
    // Se não há filtros de data, usar período padrão amplo
    if (!filtros.dataInicial) {
      return {
        dataInicialBusca: '1900-01-01',
        dataFinalBusca: '2099-12-31',
        dataInicialFiltro: filtros.dataInicial,
        dataFinalFiltro: filtros.dataFinal
      }
    }
    
    // Usar exatamente o período do filtro de data global
    return {
      dataInicialBusca: filtros.dataInicial, // Exatamente a data inicial do filtro
      dataFinalBusca: filtros.dataFinal || filtros.dataInicial, // Se não há data final, usar a inicial
      dataInicialFiltro: filtros.dataInicial,
      dataFinalFiltro: filtros.dataFinal || filtros.dataInicial
    }
  }

  // Função para buscar vendas do Supabase
  const fetchVendasSupabase = async (filtros = {}, estados) => {
    try {
      estados.loading.value = true
      estados.error.value = null
      
      // Calcular período de busca (usar exatamente o período do filtro)
      const { dataInicialBusca, dataFinalBusca, dataInicialFiltro, dataFinalFiltro } = calcularPeriodoBusca(filtros)
      
      console.log('📅 [BUSCA] Período calculado:', {
        filtroOriginal: { inicial: filtros.dataInicial, final: filtros.dataFinal },
        buscaExata: { inicial: dataInicialBusca, final: dataFinalBusca },
        filtroPrevisao: { inicial: dataInicialFiltro, final: dataFinalFiltro }
      })
      
      let allData = []
      const empresaSel = await obterEmpresaSelecionadaCompleta()
      
      if (!empresaSel?.nome) {
        // Se não há empresa selecionada, buscar da tabela padrão
        const { data, error: supabaseError } = await supabase
          .from('vendas_norte_atacado_unica')
          .select('*')
          .gte('previsao_pgto', dataInicialBusca)
          .lte('previsao_pgto', dataFinalBusca)
          .order('previsao_pgto', { ascending: false })
        
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
            // Usar período exato do filtro de data global
            const filtrosBusca = {
              empresa: empresaSel.nome,
              matriz: empresaSel.matriz,
              dataInicial: dataInicialBusca, // Período exato do filtro
              dataFinal: dataFinalBusca
            }
            
            const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
            allData = [...allData, ...dadosTabela]
          }
        }
      }
      
      console.log('📊 [RESULTADO] Vendas encontradas no período exato:', {
        totalVendas: allData.length,
        periodoFiltro: { inicial: filtros.dataInicial, final: filtros.dataFinal },
        periodoBusca: { inicial: dataInicialBusca, final: dataFinalBusca }
      })
      
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