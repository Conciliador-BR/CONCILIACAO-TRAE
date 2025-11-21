<template>
  <div class="rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-200/60 shadow-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">{{ titulo }}</h3>
      <div class="flex space-x-2">
        <button
          @click="setTipo('bar')"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === 'bar' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          Barras
        </button>
        <button
          @click="setTipo('line')"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === 'line' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          Linhas
        </button>
        <button
          @click="setTipo('pie')"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === 'pie' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          Pizza
        </button>
      </div>
    </div>

    <div class="h-80">
      <canvas :ref="setChartRef" class="w-full h-full"></canvas>
    </div>

    <!-- Legenda -->
    <div v-if="dadosProcessados.length > 0" class="mt-4 pt-4 border-t border-gray-200">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div 
          v-for="(item, index) in dadosProcessados.slice(0, 8)" 
          :key="item.nome"
          class="flex items-center space-x-2"
        >
          <div 
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: cores[index % cores.length] }"
          ></div>
          <span class="text-xs text-gray-600 truncate">{{ item.nome }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useDRECharts } from '~/composables/controladoria/DRE-Vendas/useDRECharts'

Chart.register(...registerables)

const props = defineProps({
  dados: {
    type: Array,
    required: true,
    default: () => []
  },
  titulo: {
    type: String,
    default: 'Análise de Cartões'
  },
  tipo: {
    type: String,
    default: 'receita' // receita, taxa, margem
  },
  defaultType: {
    type: String,
    default: 'bar'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Refs e estado
const tipoGrafico = ref(props.defaultType || 'bar')
const chartRef = ref(null)
let chartInstance = null
const { getChartConfig } = useDRECharts()
const cores = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444'
]

// Processar dados para gráfico
const dadosProcessados = computed(() => {
  if (!props.dados || props.dados.length === 0) return []
  
  switch (props.tipo) {
    case 'receita':
      return props.dados
      
    case 'taxa':
      return props.dados
      
    case 'margem':
      return props.dados
      
    default:
      return props.dados
  }
})
const createChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  const config = getChartConfig(tipoGrafico.value, props.tipo, dadosProcessados.value)
  chartInstance = new Chart(chartRef.value, config)
}

const setChartRef = (el) => { chartRef.value = el }
const setTipo = (t) => { tipoGrafico.value = t }

watch([dadosProcessados, tipoGrafico], () => { nextTick(createChart) })

onMounted(() => { nextTick(createChart) })

onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>