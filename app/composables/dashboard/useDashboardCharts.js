import { computed } from 'vue'

export const useDashboardCharts = (dadosGraficos) => {
  // Cores padrão
  const colors = [
    'rgba(59, 130, 246, 0.8)', // Blue
    'rgba(16, 185, 129, 0.8)', // Green
    'rgba(245, 158, 11, 0.8)', // Amber
    'rgba(139, 92, 246, 0.8)', // Violet
    'rgba(236, 72, 153, 0.8)', // Pink
    'rgba(239, 68, 68, 0.8)',  // Red
    'rgba(107, 114, 128, 0.8)' // Gray
  ]

  const dadosReceita = computed(() => {
    if (!dadosGraficos?.value?.historico) return { labels: [], datasets: [] }
    
    const historico = dadosGraficos.value.historico
    // Ordenar chaves de data (assumindo formato M/YYYY, idealmente seria YYYY-MM para sort correto, mas vamos tentar parse)
    const labels = Object.keys(historico).sort((a, b) => {
        const [ma, ya] = a.split('/').map(Number)
        const [mb, yb] = b.split('/').map(Number)
        return new Date(ya, ma - 1) - new Date(yb, mb - 1)
    })
    
    const data = labels.map(l => historico[l].receita)

    return {
      labels,
      datasets: [{
        label: 'Receita',
        data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  })

  const dadosAdquirente = computed(() => {
    if (!dadosGraficos?.value?.adquirente) return { labels: [], datasets: [] }
    
    const adqs = dadosGraficos.value.adquirente
    const labels = Object.keys(adqs)
    const data = Object.values(adqs)

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    }
  })

  const dadosBandeira = computed(() => {
    if (!dadosGraficos?.value?.bandeira) return { labels: [], datasets: [] }
    
    const bands = dadosGraficos.value.bandeira
    const labels = Object.keys(bands)
    const data = Object.values(bands)

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    }
  })

  const dadosVolume = computed(() => {
    if (!dadosGraficos?.value?.historico) return { labels: [], datasets: [] }
    
    const historico = dadosGraficos.value.historico
    const labels = Object.keys(historico).sort((a, b) => {
        const [ma, ya] = a.split('/').map(Number)
        const [mb, yb] = b.split('/').map(Number)
        return new Date(ya, ma - 1) - new Date(yb, mb - 1)
    })
    const data = labels.map(l => historico[l].volume)

    return {
      labels,
      datasets: [{
        label: 'Transações',
        data,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1
      }]
    }
  })

  const dadosLucro = computed(() => {
    if (!dadosGraficos?.value?.historico) return { labels: [], datasets: [] }
    
    const historico = dadosGraficos.value.historico
    const labels = Object.keys(historico).sort((a, b) => {
        const [ma, ya] = a.split('/').map(Number)
        const [mb, yb] = b.split('/').map(Number)
        return new Date(ya, ma - 1) - new Date(yb, mb - 1)
    })
    const data = labels.map(l => historico[l].lucro)

    return {
      labels,
      datasets: [{
        label: 'Lucro Líquido',
        data,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  })

  return {
    dadosReceita,
    dadosAdquirente,
    dadosLucro,
    dadosVolume,
    dadosBandeira
  }
}
