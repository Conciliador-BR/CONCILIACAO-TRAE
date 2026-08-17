<template>
  <div class="analise-recebimentos-print-grafico rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-200/60 shadow-xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ titulo }}</h3>
        <p v-if="subtitulo" class="mt-1 text-sm text-gray-500">{{ subtitulo }}</p>
      </div>
      <div class="analise-recebimentos-print-grafico-botoes flex space-x-2">
        <button
          v-for="opcao in opcoes"
          :key="opcao"
          @click="setTipo(opcao)"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === opcao ? 'bg-[#244b77] text-white shadow-sm' : 'bg-[#F7FAFC] text-[#486581] hover:bg-[#EAF3FF]'
          ]"
        >
          {{ labelsBotoes[opcao] }}
        </button>
      </div>
    </div>

    <div :class="['w-full', mostrarValoresLaterais ? 'analise-pie-layout lg:flex lg:items-start lg:gap-4' : '']">
      <div class="analise-chart-canvas-wrap analise-recebimentos-print-canvas h-80 flex-1 min-w-0">
        <canvas :ref="setChartRef" class="w-full h-full"></canvas>
      </div>
      <div
        v-if="mostrarValoresLaterais"
        class="analise-valores-laterais mt-3 lg:mt-0 lg:w-72 rounded-lg border border-[#E4ECF5] bg-[#F8FBFF] p-3"
      >
        <p class="text-xs font-semibold text-[#334E68] mb-2">Valores</p>
        <div class="space-y-2">
          <div
            v-for="(item, index) in valoresLaterais"
            :key="`${item.label}-${index}`"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="inline-block w-4 h-2 rounded-sm" :style="{ backgroundColor: item.cor }"></span>
              <span class="truncate text-[#486581]">{{ item.label }}</span>
            </div>
            <span class="font-semibold text-[#102A43] whitespace-nowrap">{{ item.valor }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="dadosFiltrados.length > 0" class="mt-4 pt-4 border-t border-[#E4ECF5]">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div
          v-for="(item, index) in dadosFiltrados.slice(0, 8)"
          :key="`${item[labelKey]}-${index}`"
          class="flex items-center space-x-2"
        >
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: cores[index % cores.length] }"
          ></div>
          <span class="text-xs text-[#486581] truncate">{{ item[labelKey] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  dados: {
    type: Array,
    default: () => []
  },
  titulo: {
    type: String,
    default: 'Grafico'
  },
  subtitulo: {
    type: String,
    default: ''
  },
  labelKey: {
    type: String,
    default: 'nome'
  },
  valueKey: {
    type: String,
    default: 'valorLiquido'
  },
  valueType: {
    type: String,
    default: 'currency'
  },
  defaultType: {
    type: String,
    default: 'bar'
  },
  maxItems: {
    type: Number,
    default: 8
  }
})

const chartRef = ref(null)
const tipoGrafico = ref(props.defaultType)
const labelsBotoes = { bar: 'Barras', line: 'Linhas', pie: 'Pizza' }
const opcoes = ['bar', 'line', 'pie']
const cores = ['#102A43', '#244B77', '#1E7E34', '#B56A00', '#3C74B2', '#8B5CF6', '#06B6D4', '#EC4899']

let chartInstance = null

const dadosFiltrados = computed(() => (props.dados || []).slice(0, props.maxItems))
const labels = computed(() => dadosFiltrados.value.map(item => item?.[props.labelKey] || 'N/A'))
const valores = computed(() => dadosFiltrados.value.map(item => Number(item?.[props.valueKey] || 0)))

const formatarValor = (value) => {
  if (props.valueType === 'percent') return `${Number(value || 0).toFixed(2)}%`
  if (props.valueType === 'number') return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

const mostrarValoresLaterais = computed(() => tipoGrafico.value === 'pie' && valoresLaterais.value.length > 0)

const valoresLaterais = computed(() => {
  if (tipoGrafico.value !== 'pie') return []
  return dadosFiltrados.value.map((item, index) => ({
    label: item?.[props.labelKey] || 'N/A',
    cor: cores[index % cores.length],
    valor: formatarValor(item?.[props.valueKey] || 0)
  }))
})

const criarConfig = () => {
  const baseDataset = {
    label: props.titulo,
    data: valores.value,
    backgroundColor: tipoGrafico.value === 'pie'
      ? cores.slice(0, valores.value.length)
      : (tipoGrafico.value === 'bar' ? '#102A43' : undefined),
    borderColor: tipoGrafico.value === 'pie' ? '#ffffff' : '#102A43',
    borderWidth: tipoGrafico.value === 'pie' ? 2 : 1,
    tension: 0.4,
    fill: false
  }

  return {
    type: tipoGrafico.value === 'pie' ? 'doughnut' : tipoGrafico.value,
    data: {
      labels: labels.value,
      datasets: [baseDataset]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: tipoGrafico.value !== 'pie',
          position: 'top',
          labels: { color: '#334E68' }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatarValor(context.parsed.y ?? context.parsed)}`
          }
        }
      },
      scales: tipoGrafico.value === 'pie'
        ? undefined
        : {
            x: {
              ticks: { color: '#486581' },
              grid: { color: '#E4ECF5' }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#486581',
                callback: (value) => formatarValor(value)
              },
              grid: { color: '#E4ECF5' }
            }
          }
    }
  }
}

const createChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(chartRef.value, criarConfig())
}

const setChartRef = (el) => {
  chartRef.value = el
}

const setTipo = (tipo) => {
  tipoGrafico.value = tipo
}

watch([dadosFiltrados, tipoGrafico], () => {
  nextTick(createChart)
})

onMounted(() => {
  nextTick(createChart)
})

onUnmounted(() => {
  if (chartInstance) chartInstance.destroy()
})
</script>
