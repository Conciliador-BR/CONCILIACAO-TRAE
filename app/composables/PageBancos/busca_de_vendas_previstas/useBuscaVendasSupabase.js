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

  // Função para calcular período de busca (12 meses para trás)
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
    
    // Calcular 12 meses para trás da data inicial do filtro
    const dataInicial = new Date(filtros.dataInicial)
    const dataInicialBusca = new Date(dataInicial)
    dataInicialBusca.setMonth(dataInicialBusca.getMonth() - 12)
    
    // Formatar datas para string YYYY-MM-DD
    const formatarData = (data) => {
      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    }
    
    return {
      dataInicialBusca: formatarData(dataInicialBusca), // 12 meses para trás
      dataFinalBusca: filtros.dataFinal || '2099-12-31', // Até a data final do filtro
      dataInicialFiltro: filtros.dataInicial, // Para filtrar previsões depois
      dataFinalFiltro: filtros.dataFinal
    }
  }

  // Função para buscar vendas do Supabase
  const fetchVendasSupabase = async (filtros = {}, estados) => {
    try {
      estados.loading.value = true
      estados.error.value = null
      
      // Calcular período de busca (12 meses para trás)
      const { dataInicialBusca, dataFinalBusca, dataInicialFiltro, dataFinalFiltro } = calcularPeriodoBusca(filtros)
      
      console.log('📅 [BUSCA] Período calculado:', {
        filtroOriginal: { inicial: filtros.dataInicial, final: filtros.dataFinal },
        buscaAmpliada: { inicial: dataInicialBusca, final: dataFinalBusca },
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
            // Usar período ampliado para busca (12 meses para trás)
            const filtrosBusca = {
              empresa: empresaSel.nome,
              matriz: empresaSel.matriz,
              dataInicial: dataInicialBusca, // 12 meses para trás
              dataFinal: dataFinalBusca
            }
            
            const dadosTabela = await buscarDadosTabela(nomeTabela, filtrosBusca)
            allData = [...allData, ...dadosTabela]
          }
        }
      }
      
      // Filtrar dados por previsão de pagamento (se há filtros específicos)
      if (dataInicialFiltro && dataFinalFiltro && allData.length > 0) {
        console.log('🔍 [FILTRO] Aplicando filtro de previsão de pagamento:', {
          totalVendasEncontradas: allData.length,
          periodoPrevisao: { inicial: dataInicialFiltro, final: dataFinalFiltro }
        })
        
        const dadosFiltrados = allData.filter(venda => {
          const previsaoPgto = venda.previsao_pgto || venda.previsaoPgto
          if (!previsaoPgto) return false
          
          // Converter previsão para formato de data comparável
          let dataPrevisao
          if (previsaoPgto.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, ano] = previsaoPgto.split('/')
            dataPrevisao = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          } else {
            // Assumir formato YYYY-MM-DD
            dataPrevisao = previsaoPgto
          }
          
          // Verificar se a previsão está no período filtrado
          return dataPrevisao >= dataInicialFiltro && dataPrevisao <= dataFinalFiltro
        })
        
        console.log('✅ [FILTRO] Vendas filtradas por previsão:', {
          vendasOriginais: allData.length,
          vendasFiltradas: dadosFiltrados.length
        })
        
        allData = dadosFiltrados
      }
      
      console.log('📊 [RESULTADO] Vendas finais encontradas:', {
        totalVendas: allData.length,
        periodoOriginal: { inicial: filtros.dataInicial, final: filtros.dataFinal },
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