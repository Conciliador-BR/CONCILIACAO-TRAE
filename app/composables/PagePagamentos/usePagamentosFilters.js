import { ref } from 'vue'

export const usePagamentosFilters = () => {
  const filtroAtivo = ref({
    empresa: '',
    matriz: '',
    dataInicial: '',
    dataFinal: ''
  })

  // Função para aplicar filtros
  const aplicarFiltros = (vendasOriginais, filtros = {}) => {
    console.log('🔍 [PAGAMENTOS] === APLICANDO FILTROS ===')
    console.log('📋 [PAGAMENTOS] Filtros recebidos:', filtros)
    console.log('📊 [PAGAMENTOS] Vendas originais disponíveis:', vendasOriginais.length)
    
    filtroAtivo.value = { ...filtroAtivo.value, ...filtros }
    
    let vendasFiltradas = [...vendasOriginais]
    
    // Filtro por empresa - normalizar nomes para comparação
    if (filtroAtivo.value.empresa) {
      const empresaFiltro = String(filtroAtivo.value.empresa || '')
      console.log('🏢 [PAGAMENTOS] Filtrando por empresa:', empresaFiltro)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.empresa) return false
        
        const empresaVenda = String(venda.empresa || '')
        
        // Comparação exata (case insensitive)
        const match = empresaVenda.toLowerCase() === empresaFiltro.toLowerCase()
        
        if (match) {
          console.log('✅ [PAGAMENTOS] Empresa encontrada:', venda.empresa)
        }
        return match
      })
      
      console.log(`📊 [PAGAMENTOS] Após filtro por empresa: ${vendasFiltradas.length} vendas`)
    }
    
    // Filtro por matriz (EC)
    if (filtroAtivo.value.matriz) {
      const matrizFiltro = String(filtroAtivo.value.matriz || '')
      console.log('🏭 [PAGAMENTOS] Filtrando por matriz (EC):', matrizFiltro)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.matriz) return false
        
        const matrizVenda = String(venda.matriz || '')
        
        // Comparação exata
        const match = matrizVenda === matrizFiltro
        
        if (match) {
          console.log('✅ [PAGAMENTOS] Matriz encontrada:', venda.matriz)
        }
        return match
      })
      
      console.log(`📊 [PAGAMENTOS] Após filtro por matriz: ${vendasFiltradas.length} vendas`)
    }
    
    // Filtro por data
    if (filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
      console.log('📅 [PAGAMENTOS] Filtrando por data:', filtroAtivo.value.dataInicial, 'até', filtroAtivo.value.dataFinal)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.data_venda && !venda.dataVenda) return false
        
        // Usar data_venda ou dataVenda como fallback
        const dataVendaOriginal = venda.data_venda || venda.dataVenda
        let dataVendaStr = dataVendaOriginal
        
        // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (dataVendaStr.includes('/')) {
          const [dia, mes, ano] = dataVendaStr.split('/')
          dataVendaStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
        }
        
        // Converter datas do filtro para formato de comparação
        let dataInicialStr = null
        let dataFinalStr = null
        
        if (filtroAtivo.value.dataInicial) {
          if (filtroAtivo.value.dataInicial.includes('/')) {
            const [dia, mes, ano] = filtroAtivo.value.dataInicial.split('/')
            dataInicialStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          } else {
            dataInicialStr = filtroAtivo.value.dataInicial
          }
        }
        
        if (filtroAtivo.value.dataFinal) {
          if (filtroAtivo.value.dataFinal.includes('/')) {
            const [dia, mes, ano] = filtroAtivo.value.dataFinal.split('/')
            dataFinalStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          } else {
            dataFinalStr = filtroAtivo.value.dataFinal
          }
        }
        
        // Comparação simples de strings no formato YYYY-MM-DD
        if (dataInicialStr && dataVendaStr < dataInicialStr) {
          return false
        }
        if (dataFinalStr && dataVendaStr > dataFinalStr) {
          return false
        }
        
        return true
      })
      
      console.log(`📊 [PAGAMENTOS] Após filtro por data: ${vendasFiltradas.length} vendas`)
    }
    
    console.log(`✅ [PAGAMENTOS] === FILTRO FINALIZADO === ${vendasFiltradas.length} vendas encontradas`)
    return vendasFiltradas
  }

  // Função para limpar filtros
  const limparFiltros = () => {
    filtroAtivo.value = {
      empresa: '',
      matriz: '',
      dataInicial: '',
      dataFinal: ''
    }
  }

  return {
    filtroAtivo,
    aplicarFiltros,
    limparFiltros
  }
}