import { computed } from 'vue'

export const useDashboardCharts = (dadosGraficos) => {
  // Paleta alinhada ao novo tema
  const colors = [
    'rgba(16, 42, 67, 0.9)',   // Azul escuro
    'rgba(36, 75, 119, 0.85)', // Azul médio
    'rgba(30, 126, 52, 0.85)', // Verde
    'rgba(181, 106, 0, 0.85)', // Laranja
    'rgba(60, 116, 178, 0.85)',
    'rgba(47, 158, 68, 0.85)',
    'rgba(209, 122, 0, 0.85)'
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
        borderColor: '#102A43',
        backgroundColor: 'rgba(16, 42, 67, 0.14)',
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
        backgroundColor: 'rgba(36, 75, 119, 0.85)',
        borderColor: '#244B77',
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
        borderColor: '#1E7E34',
        backgroundColor: 'rgba(30, 126, 52, 0.14)',
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
