import { ref } from 'vue'

export const usePagamentosFilters = () => {
  const filtroAtivo = ref({
    empresa: '',
    matriz: '',
    modalidade: '',
    bandeira: '',
    dataVenda: '',
    vendaBruta: '',
    nsu: '',
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
    
    // Filtro por modalidade
    if (filtroAtivo.value.modalidade) {
      const modalidadeFiltro = String(filtroAtivo.value.modalidade || '')
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.modalidade) return false
        
        const modalidadeVenda = String(venda.modalidade || '').toUpperCase()
        
        // Comparação exata (case insensitive)
        const match = modalidadeVenda === modalidadeFiltro.toUpperCase()
        
        
        return match
      })
      
    }

    // Filtro por bandeira
    if (filtroAtivo.value.bandeira) {
      const bandeiraFiltro = String(filtroAtivo.value.bandeira || '').toLowerCase()
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.bandeira) return false
        
        const bandeiraVenda = String(venda.bandeira || '').toLowerCase()
        
        // Busca parcial (contém)
        const match = bandeiraVenda.includes(bandeiraFiltro)
        
        
        return match
      })
      
    }

    // Filtro por data da venda
    if (filtroAtivo.value.dataVenda) {
      const dataVendaFiltro = filtroAtivo.value.dataVenda
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.data_venda && !venda.dataVenda) return false
        
        // Usar data_venda ou dataVenda como fallback
        const dataVendaOriginal = venda.data_venda || venda.dataVenda
        let dataVendaStr = dataVendaOriginal
        
        // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (dataVendaStr && dataVendaStr.includes('/')) {
          const [dia, mes, ano] = dataVendaStr.split('/')
          dataVendaStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
        }
        
        // Extrair apenas a data (YYYY-MM-DD) se for datetime
        if (dataVendaStr && dataVendaStr.includes('T')) {
          dataVendaStr = dataVendaStr.split('T')[0]
        }
        
        const match = dataVendaStr === dataVendaFiltro
        
        
        return match
      })
      
    }

    // Filtro por venda bruta
    if (filtroAtivo.value.vendaBruta) {
      const vendaBrutaFiltro = parseFloat(filtroAtivo.value.vendaBruta)
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.venda_bruta && !venda.vendaBruta) return false
        
        const vendaBrutaVenda = parseFloat(venda.venda_bruta || venda.vendaBruta || 0)
        
        // Comparação exata de valores
        const match = Math.abs(vendaBrutaVenda - vendaBrutaFiltro) < 0.01
        
        
        return match
      })
      
    }

    // Filtro por NSU
    if (filtroAtivo.value.nsu) {
      const nsuFiltro = String(filtroAtivo.value.nsu || '').toLowerCase()
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.nsu) return false
        
        const nsuVenda = String(venda.nsu || '').toLowerCase()
        
        // Busca parcial (contém)
        const match = nsuVenda.includes(nsuFiltro)
        
        
        return match
      })
      
    }
    
    // Filtro por data de previsão de pagamento
    if (filtroAtivo.value.dataInicial || filtroAtivo.value.dataFinal) {
      
      vendasFiltradas = vendasFiltradas.filter(venda => {
        if (!venda.previsao_pgto && !venda.previsaoPgto) return false
        
        // Usar previsao_pgto ou previsaoPgto como fallback
        const dataPrevisaoOriginal = venda.previsao_pgto || venda.previsaoPgto
        let dataPrevisaoStr = dataPrevisaoOriginal
        
        // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (dataPrevisaoStr && dataPrevisaoStr.includes('/')) {
          const [dia, mes, ano] = dataPrevisaoStr.split('/')
          dataPrevisaoStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
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
        if (dataInicialStr && dataPrevisaoStr < dataInicialStr) {
          return false
        }
        if (dataFinalStr && dataPrevisaoStr > dataFinalStr) {
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
      modalidade: '',
      bandeira: '',
      dataVenda: '',
      vendaBruta: '',
      nsu: '',
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