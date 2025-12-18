<template>
  <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ title }}</h3>
    <canvas 
      :ref="setChartRef" 
      class="w-full"
      :class="`h-${height || 64}`"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  chartId: {
    type: String,
    required: true
  },
  chartData: {
    type: Object,
    required: true
  },
  chartType: {
    type: String,
    required: true
  },
  height: {
    type: Number,
    default: 64
  }
})

const chartRef = ref(null)
let chartInstance = null

// Vamos criar uma função local para gerar a config do Chart.js
const getChartConfig = (type, data) => {
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: type === 'doughnut' ? 'bottom' : 'top'
      }
    }
  }

  if (type === 'line' || type === 'bar') {
    options.scales = {
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

  return {
    type,
    data,
    options
  }
}

const createChart = () => {
  if (chartRef.value) {
    // Destruir instância anterior se existir
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    const config = getChartConfig(props.chartType, props.chartData)
    chartInstance = new Chart(chartRef.value, config)
  }
}

// Observar mudanças nos dados para atualizar o gráfico
watch(() => props.chartData, () => {
  createChart()
}, { deep: true })

// Função para definir a referência
const setChartRef = (el) => {
  chartRef.value = el
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

// Limpar ao desmontar
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.h-48 {
  height: 12rem;
}
.h-64 {
  height: 16rem;
}
</style>
