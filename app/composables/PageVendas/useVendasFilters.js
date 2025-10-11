import { ref } from 'vue'

export const useVendasFilters = () => {
  const filtroAtivo = ref({
    empresa: '',
    dataInicial: '',
    dataFinal: ''
  })

  // Função para aplicar filtros
  const aplicarFiltros = (vendasOriginais, filtros = {}) => {
    console.log('Aplicando filtros:', filtros)
    console.log('Vendas originais disponíveis:', vendasOriginais.length)
    
    filtroAtivo.value = { ...filtroAtivo.value, ...filtros }
    
    let vendasFiltradas = [...vendasOriginais]
    
    // Filtro por empresa - normalizar nomes para comparação
    if (filtroAtivo.value.empresa) {
      const empresaFiltro = String(filtroAtivo.value.empresa || '')
      const empresaNormalizada = empresaFiltro
        .toLowerCase()
        .replace(/\s+/g, '_') // Substituir espaços por underscore
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      
      console.log('Filtrando por empresa:', empresaNormalizada)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.empresa) return false
        
        const empresaVenda = String(venda.empresa || '')
        const empresaVendaNormalizada = empresaVenda
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        
        const match = empresaVendaNormalizada.includes(empresaNormalizada)
        if (match) {
          console.log('Empresa encontrada:', venda.empresa)
        }
        return match
      })
    }
    
    // Filtro por data
    if (filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
      console.log('Filtrando por data:', filtroAtivo.value.dataInicial, 'até', filtroAtivo.value.dataFinal)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.dataVenda) return false
        
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
        
        console.log('Comparando strings:', {
          dataVenda: venda.dataVenda,
          dataVendaStr: dataVendaStr,
          dataInicialStr: dataInicialStr,
          dataFinalStr: dataFinalStr
        })
        
        // Comparação simples de strings no formato YYYY-MM-DD
        if (dataInicialStr && dataVendaStr < dataInicialStr) {
          console.log('Rejeitada: data anterior ao início')
          return false
        }
        if (dataFinalStr && dataVendaStr > dataFinalStr) {
          console.log('Rejeitada: data posterior ao fim')
          return false
        }
        
        console.log('Aceita: data dentro do intervalo')
        return true
      })
    }
    
    console.log(`Filtro aplicado: ${vendasFiltradas.length} vendas encontradas`)
    return vendasFiltradas
  }

  // Função para limpar filtros
  const limparFiltros = () => {
    filtroAtivo.value = {
      empresa: '',
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