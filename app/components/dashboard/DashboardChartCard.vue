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
import { Chart, registerables } from 'chart.js'
import { useDashboardCharts } from './composables/useDashboardCharts.js'

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

const { getChartConfig } = useDashboardCharts()

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