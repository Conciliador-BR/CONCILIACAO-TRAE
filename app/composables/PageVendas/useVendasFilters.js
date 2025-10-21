import { ref } from 'vue'

export const useVendasFilters = () => {
  const filtroAtivo = ref({
    empresa: '',
    matriz: '',
    dataInicial: '',
    dataFinal: ''
  })

  // Função para aplicar filtros
  const aplicarFiltros = (vendasOriginais, filtros = {}) => {
    filtroAtivo.value = { ...filtroAtivo.value, ...filtros }
    
    let vendasFiltradas = [...vendasOriginais]
    
    // Filtro por empresa - normalizar nomes para comparação
    if (filtroAtivo.value.empresa) {
      const empresaFiltro = String(filtroAtivo.value.empresa || '')
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.empresa) return false
        
        const empresaVenda = String(venda.empresa || '')
        
        // Comparação exata (case insensitive)
        const match = empresaVenda.toLowerCase() === empresaFiltro.toLowerCase()
        
        return match
      })
    }
    
    // Filtro por matriz (EC)
    if (filtroAtivo.value.matriz) {
      const matrizFiltro = String(filtroAtivo.value.matriz || '')
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.matriz) return false
        
        const matrizVenda = String(venda.matriz || '')
        
        // Comparação exata
        const match = matrizVenda === matrizFiltro
        
        return match
      })
    }
    
    // Filtro por data
    if (filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.dataVenda) {
          return false
        }
        
        // Converter data da venda para formato de comparação
        let dataVendaStr = venda.dataVenda
        
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
    }
    
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