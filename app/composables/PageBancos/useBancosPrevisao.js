import { ref, computed } from 'vue'
import { usePrevisaoSupabase } from '../PagePagamentos/usePrevisaoSupabase'
import { usePrevisaoColuna } from '../PagePagamentos/usePrevisaoColuna'
import { useEmpresas } from '../useEmpresas'

export const useBancosPrevisao = () => {
  const { empresaSelecionada } = useEmpresas()
  const { allPrevisoes, fetchPrevisoes, loading, error } = usePrevisaoSupabase()
  const { calcularPrevisaoVenda, inicializar } = usePrevisaoColuna()
  
  // Estados específicos para bancos
  const loadingBancos = ref(false)
  const errorBancos = ref(null)
  const previsoesDiarias = ref([])
  
  // Função para calcular previsões diárias resumidas
  const calcularPrevisoesDiarias = async () => {
    try {
      loadingBancos.value = true
      errorBancos.value = null
      
      console.log('🏦 Calculando previsões diárias para bancos...')
      
      // Garantir que as taxas estão carregadas
      await inicializar()
      
      // Buscar todas as previsões
      await fetchPrevisoes()
      
      if (!allPrevisoes.value || allPrevisoes.value.length === 0) {
        previsoesDiarias.value = []
        return
      }
      
      // Agrupar vendas por data de previsão e calcular totais
      const gruposPorData = {}
      
      allPrevisoes.value.forEach(venda => {
        try {
          // Calcular data de previsão para esta venda
          const dataPrevisao = calcularPrevisaoVenda(venda)
          
          // Se não conseguiu calcular, pular
          if (!dataPrevisao || dataPrevisao === 'Taxa não cadastrada' || dataPrevisao === 'Erro') {
            return
          }
          
          // Usar a data de previsão como chave
          const chaveData = dataPrevisao
          
          if (!gruposPorData[chaveData]) {
            gruposPorData[chaveData] = {
              data: chaveData,
              totalVendas: 0,
              valorTotalPrevisto: 0,
              vendaBrutaTotal: 0,
              vendaLiquidaTotal: 0,
              vendas: []
            }
          }
          
          // Somar valores
          const valorBruto = parseFloat(venda.valor_bruto) || 0
          const valorLiquido = parseFloat(venda.valor_liquido) || 0
          
          gruposPorData[chaveData].totalVendas += 1
          gruposPorData[chaveData].valorTotalPrevisto += valorLiquido // Usar valor líquido como previsto
          gruposPorData[chaveData].vendaBrutaTotal += valorBruto
          gruposPorData[chaveData].vendaLiquidaTotal += valorLiquido
          gruposPorData[chaveData].vendas.push(venda)
          
        } catch (error) {
          console.warn('⚠️ Erro ao processar venda:', venda.id, error)
        }
      })
      
      // Converter para array e ordenar por data
      const previsoesDiariasArray = Object.values(gruposPorData)
        .sort((a, b) => {
          // Converter datas DD/MM/YYYY para comparação
          const parseDate = (dateStr) => {
            const [dia, mes, ano] = dateStr.split('/')
            return new Date(ano, mes - 1, dia)
          }
          
          try {
            return parseDate(a.data) - parseDate(b.data)
          } catch {
            return a.data.localeCompare(b.data)
          }
        })
      
      previsoesDiarias.value = previsoesDiariasArray
      
      console.log('✅ Previsões diárias calculadas:', previsoesDiariasArray.length, 'dias')
      console.log('📊 Exemplo de dados:', previsoesDiariasArray.slice(0, 3))
      
    } catch (err) {
      console.error('💥 Erro ao calcular previsões diárias:', err)
      errorBancos.value = err.message || 'Erro ao calcular previsões diárias'
      previsoesDiarias.value = []
    } finally {
      loadingBancos.value = false
    }
  }
  
  // Computed para totais gerais
  const totalGeralPrevisto = computed(() => {
    return previsoesDiarias.value.reduce((total, dia) => {
      return total + dia.valorTotalPrevisto
    }, 0)
  })
  
  const totalDiasComPrevisao = computed(() => {
    return previsoesDiarias.value.length
  })
  
  const totalVendasPrevistas = computed(() => {
    return previsoesDiarias.value.reduce((total, dia) => {
      return total + dia.totalVendas
    }, 0)
  })
  
  // Função para obter previsão de um dia específico
  const obterPrevisaoDia = (data) => {
    return previsoesDiarias.value.find(dia => dia.data === data)
  }
  
  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }
  
  return {
    // Estados
    loadingBancos,
    errorBancos,
    previsoesDiarias,
    
    // Computed
    totalGeralPrevisto,
    totalDiasComPrevisao,
    totalVendasPrevistas,
    
    // Métodos
    calcularPrevisoesDiarias,
    obterPrevisaoDia,
    formatCurrency
  }
}