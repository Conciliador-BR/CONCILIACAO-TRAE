export const useAnaliseDeVendasCharts = () => {
  const palette = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(239, 68, 68, 0.8)'
  ]

  const toCurrency = (value) => 'R$ ' + Number(value || 0).toLocaleString('pt-BR')
  const toPercent = (value) => Number(value || 0).toFixed(2) + '%'

  const getChartConfig = (type, metric, dados) => {
    const labels = dados.map(d => d.bandeira || d.modalidade || d.periodo || 'N/A')
    const datasets = []

    if (metric === 'receita') {
      datasets.push({ label: 'Receita Bruta', data: dados.map(d => d.receitaBruta || 0), borderColor: 'rgb(59, 130, 246)', backgroundColor: type === 'bar' ? 'rgb(59, 130, 246)' : undefined, tension: 0.4, fill: false })
      datasets.push({ label: 'Receita Líquida', data: dados.map(d => d.receitaLiquida || 0), borderColor: 'rgb(16, 185, 129)', backgroundColor: type === 'bar' ? 'rgb(16, 185, 129)' : undefined, tension: 0.4, fill: false })
      datasets.push({ label: 'Custo de Taxas', data: dados.map(d => d.custoTaxa || 0), borderColor: 'rgb(245, 158, 11)', backgroundColor: type === 'bar' ? 'rgb(245, 158, 11)' : undefined })
    } else if (metric === 'custo') {
      datasets.push({ label: 'Custo de Taxas', data: dados.map(d => d.custoTaxa || 0), backgroundColor: palette, borderColor: '#ffffff', borderWidth: type === 'doughnut' ? 2 : 1 })
    } else if (metric === 'taxa') {
      datasets.push({ label: 'Taxa Efetiva', data: dados.map(d => d.taxaEfetiva || 0), borderColor: 'rgb(239, 68, 68)', backgroundColor: type === 'bar' ? 'rgb(239, 68, 68)' : undefined, tension: 0.4, fill: false })
    } else {
      datasets.push({ label: 'Valor', data: dados.map(d => d.receitaBruta || d.receitaLiquida || 0), backgroundColor: palette, borderColor: '#ffffff', borderWidth: type === 'doughnut' ? 2 : 1 })
    }

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: type === 'doughnut' ? 'bottom' : 'top' },
        tooltip: { callbacks: { label: (context) => { const v = context.parsed.y ?? context.parsed; if (metric === 'taxa') return `${context.dataset.label}: ${toPercent(v)}`; return `${context.dataset.label}: ${toCurrency(v)}` } } }
      }
    }

    if (type === 'line' || type === 'bar') {
      options.scales = { y: { beginAtZero: true, ticks: { callback: (value) => metric === 'taxa' ? toPercent(value) : toCurrency(value) } } }
    }

    return { type: type === 'pie' ? 'doughnut' : type, data: { labels, datasets }, options }
  }

  return { getChartConfig }
}