export const useAnaliseDeVendasCharts = () => {
  const palette = [
    'rgba(16, 42, 67, 0.9)',
    'rgba(36, 75, 119, 0.85)',
    'rgba(30, 126, 52, 0.85)',
    'rgba(181, 106, 0, 0.85)',
    'rgba(60, 116, 178, 0.85)'
  ]

  const toCurrency = (value) => 'R$ ' + Number(value || 0).toLocaleString('pt-BR')
  const toPercent = (value) => Number(value || 0).toFixed(2) + '%'

  const getChartConfig = (type, metric, dados) => {
    const labels = dados.map(d => d.label || d.bandeira || d.modalidade || d.periodo || 'N/A')
    const datasets = []

    if (metric === 'receita') {
      if (type === 'pie') {
        datasets.push({
          label: 'Receita Bruta',
          data: dados.map(d => d.receitaBruta || 0),
          backgroundColor: palette,
          borderColor: '#ffffff',
          borderWidth: 2
        })
      } else {
        datasets.push({ label: 'Receita Bruta', data: dados.map(d => d.receitaBruta || 0), borderColor: '#102A43', backgroundColor: type === 'bar' ? '#102A43' : undefined, tension: 0.4, fill: false })
        datasets.push({ label: 'Receita Líquida', data: dados.map(d => d.receitaLiquida || 0), borderColor: '#1E7E34', backgroundColor: type === 'bar' ? '#1E7E34' : undefined, tension: 0.4, fill: false })
        datasets.push({ label: 'Custo de Taxas', data: dados.map(d => d.custoTaxa || 0), borderColor: '#B56A00', backgroundColor: type === 'bar' ? '#B56A00' : undefined })
      }
    } else if (metric === 'custo') {
      datasets.push({ label: 'Custo de Taxas', data: dados.map(d => d.custoTaxa || 0), backgroundColor: palette, borderColor: '#ffffff', borderWidth: type === 'doughnut' ? 2 : 1 })
    } else if (metric === 'taxa') {
      datasets.push({ label: 'Taxa Efetiva', data: dados.map(d => d.taxaEfetiva || 0), borderColor: '#244B77', backgroundColor: type === 'bar' ? '#244B77' : undefined, tension: 0.4, fill: false })
    } else {
      datasets.push({ label: 'Valor', data: dados.map(d => d.receitaBruta || d.receitaLiquida || 0), backgroundColor: palette, borderColor: '#ffffff', borderWidth: type === 'doughnut' ? 2 : 1 })
    }

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: type !== 'doughnut' && type !== 'pie',
          position: type === 'doughnut' ? 'bottom' : 'top',
          labels: { color: '#334E68' }
        },
        tooltip: { callbacks: { label: (context) => { const v = context.parsed.y ?? context.parsed; if (metric === 'taxa') return `${context.dataset.label}: ${toPercent(v)}`; return `${context.dataset.label}: ${toCurrency(v)}` } } }
      }
    }

    if (type === 'line' || type === 'bar') {
      options.scales = {
        x: {
          ticks: { color: '#486581' },
          grid: { color: '#E4ECF5' }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#486581',
            callback: (value) => metric === 'taxa' ? toPercent(value) : toCurrency(value)
          },
          grid: { color: '#E4ECF5' }
        }
      }
    }

    return { type: type === 'pie' ? 'doughnut' : type, data: { labels, datasets }, options }
  }

  return { getChartConfig }
}
