import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'

export const useBancosSupabase = () => {
  const { supabase } = useAPIsupabase()
  const { empresaSelecionada } = useEmpresas()
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const movimentacoes = ref([])
  
  // Estados para paginação
  const currentPage = ref(1)
  const itemsPerPage = ref(30)
  const availablePageSizes = [10, 20, 30, 50, 100]
  
  // Função para normalizar data para formato DD/MM/YYYY
  const formatarData = (data) => {
    if (!data) return null
    
    try {
      // Se já está no formato DD/MM/YYYY, retornar como está
      if (typeof data === 'string' && data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return data
      }
      
      // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
      }
      
      // Se é um objeto Date, converter
      const dateObj = new Date(data)
      if (!isNaN(dateObj.getTime())) {
        const dia = String(dateObj.getDate()).padStart(2, '0')
        const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
        const ano = dateObj.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
      
      return null
    } catch (error) {
      console.error('Erro ao formatar data:', error, data)
      return null
    }
  }
  
  // Função para buscar movimentações bancárias do Supabase
  const fetchMovimentacoes = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('🔄 Buscando dados de vendas para análise bancária...')
      console.log('🏢 Empresa selecionada:', empresaSelecionada.value)
      
      // Buscar dados da tabela vendas_operadora_unica
      let query = supabase
        .from('vendas_operadora_unica')
        .select('*')
        .not('previsao_pgto', 'is', null)
        .order('previsao_pgto', { ascending: false })
      
      // Filtrar por empresa se selecionada
      if (empresaSelecionada.value) {
        query = query.eq('empresa', empresaSelecionada.value)
        console.log('🔍 Aplicando filtro por empresa:', empresaSelecionada.value)
      }
      
      const { data: vendasData, error: supabaseError } = await query
      
      if (supabaseError) {
        throw new Error(`Erro do Supabase: ${supabaseError.message}`)
      }
      
      console.log('✅ Dados brutos carregados:', vendasData?.length || 0, 'registros')
      
      if (!vendasData || vendasData.length === 0) {
        console.log('⚠️ Nenhum dado encontrado')
        movimentacoes.value = []
        return
      }
      
      // ✅ Agrupar EXCLUSIVAMENTE por previsao_pgto formatada e adquirente
      const dadosAgrupados = {}
      
      vendasData.forEach((venda, index) => {
        if (venda.previsao_pgto) {
          const dataPrevisaoFormatada = formatarData(venda.previsao_pgto)
          const adquirente = venda.adquirente || 'Não informado'
          const chave = `${dataPrevisaoFormatada}_${adquirente}`
          
          if (!dataPrevisaoFormatada) {
            console.warn('⚠️ Data de previsão inválida:', venda.previsao_pgto)
            return
          }
          
          if (!dadosAgrupados[chave]) {
            dadosAgrupados[chave] = {
              data: dataPrevisaoFormatada,
              adquirente: adquirente,
              empresa: venda.empresa,
              valorLiquidoTotal: 0, // ✅ Soma dos valor_liquido (será o PREVISTO)
              quantidadeVendas: 0,
              vendas: []
            }
            
            console.log(`📅 Novo grupo criado: ${dataPrevisaoFormatada} - ${adquirente}`)
          }
          
          // ✅ Somar apenas valor_liquido para o PREVISTO
          const valorLiquido = Number(venda.valor_liquido) || 0
          
          dadosAgrupados[chave].valorLiquidoTotal += valorLiquido
          dadosAgrupados[chave].quantidadeVendas += 1
          dadosAgrupados[chave].vendas.push(venda)
          
          console.log(`💰 Adicionado: ${dataPrevisaoFormatada} - R$ ${valorLiquido.toFixed(2)} (Total: R$ ${dadosAgrupados[chave].valorLiquidoTotal.toFixed(2)})`)
        }
      })
      
      console.log('✅ Dados agrupados por previsao_pgto:', Object.keys(dadosAgrupados).length, 'grupos')
      
      // ✅ Debug: mostrar todos os grupos criados
      Object.keys(dadosAgrupados).forEach(chave => {
        const grupo = dadosAgrupados[chave]
        console.log(`📊 GRUPO: ${grupo.data} - ${grupo.adquirente}`)
        console.log(`   📈 Quantidade: ${grupo.quantidadeVendas} vendas`)
        console.log(`   💰 Previsto (valor_liquido): R$ ${grupo.valorLiquidoTotal.toFixed(2)}`)
      })
      
      // ✅ CORREÇÃO: Ordenar ANTES de mapear para evitar valores nas linhas erradas
      const dadosOrdenados = Object.values(dadosAgrupados).sort((a, b) => {
        try {
          const [diaA, mesA, anoA] = a.data.split('/')
          const [diaB, mesB, anoB] = b.data.split('/')
          const dataA = new Date(anoA, mesA - 1, diaA)
          const dataB = new Date(anoB, mesB - 1, diaB)
          return dataB - dataA // Ordem decrescente (mais recente primeiro)
        } catch (error) {
          console.error('❌ Erro ao ordenar datas:', error, error.data, error.data)
          return 0
        }
      })

      console.log('🔄 Dados ordenados por data:')
      dadosOrdenados.forEach((grupo, index) => {
        console.log(`${index + 1}. ${grupo.data} - ${grupo.adquirente} - R$ ${grupo.valorLiquidoTotal.toFixed(2)}`)
      })

      // Converter dados ordenados para formato da tabela
      movimentacoes.value = dadosOrdenados.map((grupo, index) => {
        const previsto = Math.round(grupo.valorLiquidoTotal * 100) / 100
        const debitos = 0 // ✅ Aluguéis de máquinas (ainda não implementado)
        const deposito = 0 // ✅ Sem extrato bancário
        const saldo = (previsto - debitos) - deposito // ✅ Fórmula: (Previsto - Débitos) - Depósito
        
        console.log(`🔢 LINHA ${index + 1}: ${grupo.data} - ${grupo.adquirente}`)
        console.log(`   💰 Previsto: R$ ${previsto.toFixed(2)} (${grupo.quantidadeVendas} vendas)`)
        console.log(`   💸 Débitos: R$ ${debitos.toFixed(2)}`)
        console.log(`   🏦 Depósito: R$ ${deposito.toFixed(2)}`)
        console.log(`   📊 Saldo: R$ ${saldo.toFixed(2)}`)
        
        return {
          empresa: grupo.empresa,
          banco: 'Banco Padrão',
          agencia: '0001',
          conta: '12345-6',
          data: grupo.data,
          adquirente: grupo.adquirente,
          previsto: previsto, // ✅ Soma dos valor_liquido
          debitos: debitos, // ✅ Aluguéis de máquinas (0 por enquanto)
          deposito: deposito, // ✅ Sem extrato bancário (0)
          saldoConciliacao: saldo, // ✅ (Previsto - Débitos) - Depósito
          status: 'pendente',
          quantidadeVendas: grupo.quantidadeVendas,
          vendas: grupo.vendas,
          // Campos para compatibilidade
          data_venda: grupo.data,
          valor_liquido: grupo.valorLiquidoTotal,
          despesa_mdr: 0
        }
      })

      // ✅ REMOVIDO: Ordenação duplicada que causava o problema
      // A ordenação agora é feita ANTES do mapeamento

      console.log('✅ RESULTADO FINAL DA TABELA BANCOS (ORDENADO):')
      movimentacoes.value.forEach((mov, index) => {
        console.log(`📅 LINHA ${index + 1}: ${mov.data} - ${mov.adquirente}:`)
        console.log(`   💰 Previsto: R$ ${mov.previsto.toFixed(2)} (${mov.quantidadeVendas} vendas)`)
        console.log(`   💸 Débitos: R$ ${mov.debitos.toFixed(2)} (aluguéis)`)
        console.log(`   🏦 Depósito: R$ ${mov.deposito.toFixed(2)} (sem extrato)`)
        console.log(`   📊 Saldo: R$ ${mov.saldoConciliacao.toFixed(2)}`)
        console.log('   ---')
      })
      
    } catch (err) {
      console.error('💥 Erro ao buscar movimentações:', err)
      error.value = err.message || 'Erro ao carregar movimentações'
      movimentacoes.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Computed para paginação
  const totalItems = computed(() => movimentacoes.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  
  const paginatedMovimentacoes = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return movimentacoes.value.slice(start, end)
  })
  
  // Computed para totais (atualizados para dados agrupados)
  const totalCreditos = computed(() => {
    return movimentacoes.value.reduce((total, mov) => {
      return total + (parseFloat(mov.previsto) || 0)
    }, 0)
  })
  
  const totalDebitos = computed(() => {
    return movimentacoes.value.reduce((total, mov) => {
      return total + (parseFloat(mov.debitos) || 0)
    }, 0)
  })
  
  const saldoTotal = computed(() => {
    return totalCreditos.value - totalDebitos.value
  })
  
  const mediaCreditos = computed(() => {
    const gruposComValor = movimentacoes.value.filter(mov => mov.previsto && mov.previsto > 0)
    if (gruposComValor.length === 0) return 0
    
    return totalCreditos.value / gruposComValor.length
  })
  
  // Computed adicional para mostrar total de vendas
  const totalVendas = computed(() => {
    return movimentacoes.value.reduce((total, mov) => {
      return total + (mov.quantidadeVendas || 0)
    }, 0)
  })
  
  // Funções de paginação
  const setPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  const setItemsPerPage = (size) => {
    if (availablePageSizes.includes(size)) {
      itemsPerPage.value = size
      currentPage.value = 1
    }
  }
  
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }
  
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }
  
  return {
    // Estados
    loading,
    error,
    movimentacoes: paginatedMovimentacoes,
    allMovimentacoes: movimentacoes,
    
    // Paginação
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    availablePageSizes,
    
    // Computed
    totalCreditos,
    totalDebitos,
    saldoTotal,
    mediaCreditos,
    
    // Métodos
    fetchMovimentacoes,
    setPage,
    setItemsPerPage,
    nextPage,
    prevPage
  }
}