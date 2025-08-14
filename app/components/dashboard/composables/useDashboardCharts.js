import { ref } from 'vue'

export const useDashboardCharts = () => {
  const dadosReceita = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [{
      label: 'Receita Atual',
      data: [98000, 112000, 125000, 118000, 134000, 128000, 145000, 152000, 140000, 158000, 145000, 162000],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }, {
      label: 'Meta',
      data: [100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 140000, 145000, 150000, 155000],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      tension: 0.4
    }]
  }

  const dadosAdquirente = {
    labels: ['Cielo', 'Rede', 'Stone', 'PagSeguro', 'GetNet'],
    datasets: [{
      data: [35, 28, 20, 12, 5],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const dadosLucro = {
    labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
    datasets: [{
      label: 'Lucro Líquido',
      data: [65000, 72000, 78000, 82000, 87300],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const dadosVolume = {
    labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [{
      label: 'Transações',
      data: [1245, 1367, 1289, 1456, 1378, 1523],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: 'rgb(139, 92, 246)',
      borderWidth: 1
    }]
  }

  const dadosBandeira = {
    labels: ['Visa', 'Mastercard', 'Elo', 'Amex', 'Outros'],
    datasets: [{
      data: [42, 31, 18, 6, 3],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ]
    }]
  }

  const getChartConfig = (type, data) => {
    const baseConfig = {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: type === 'doughnut' ? 'bottom' : 'top'
          }
        }
      }
    }

    if (type === 'line' || type === 'bar') {
      baseConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR')
            }
          }
        }
      }
    }

    return baseConfig
  }

  return {
    dadosReceita,
    dadosAdquirente,
    dadosLucro,
    dadosVolume,
    dadosBandeira,
    getChartConfig
  }
}