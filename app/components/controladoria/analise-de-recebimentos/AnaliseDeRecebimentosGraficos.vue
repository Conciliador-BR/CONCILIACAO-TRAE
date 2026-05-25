<template>
  <div class="analise-recebimentos-print-grafico rounded-2xl border border-gray-200/60 bg-white/70 p-6 shadow-xl backdrop-blur">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ titulo }}</h3>
        <p v-if="subtitulo" class="mt-1 text-sm text-gray-500">{{ subtitulo }}</p>
      </div>
      <div class="analise-recebimentos-print-grafico-botoes flex space-x-2">
        <button
          v-for="opcao in opcoes"
          :key="opcao"
          @click="tipoGrafico = opcao"
          :class="[
            'rounded-md px-3 py-1 text-xs transition-colors',
            tipoGrafico === opcao ? 'bg-[#244b77] text-white shadow-sm' : 'bg-[#F7FAFC] text-[#486581] hover:bg-[#EAF3FF]'
          ]"
        >
          {{ labelsBotoes[opcao] }}
        </button>
      </div>
    </div>

    <div :class="['analise-recebimentos-print-grafico-body w-full', tipoGrafico === 'pie' ? 'lg:flex lg:items-start lg:gap-4' : '']">
      <div class="analise-recebimentos-print-canvas h-80 min-w-0 flex-1">
        <canvas :ref="setChartRef" class="h-full w-full"></canvas>
      </div>

      <div
        v-if="tipoGrafico === 'pie' && valoresLaterais.length > 0"
        class="mt-4 rounded-lg border border-[#E4ECF5] bg-[#F8FBFF] p-3 lg:mt-0 lg:w-60"
      >
        <p class="mb-2 text-xs font-semibold text-[#334E68]">Resumo</p>
        <div class="space-y-2">
          <div
            v-for="(item, index) in valoresLaterais"
            :key="`${item.label}-${index}`"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span class="inline-block h-2 w-4 rounded-sm" :style="{ backgroundColor: item.cor }"></span>
              <span class="truncate text-[#486581]">{{ item.label }}</span>
            </div>
            <span class="whitespace-nowrap font-semibold text-[#102A43]">{{ item.valor }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="dadosFiltrados.length > 0" class="mt-4 border-t border-[#E4ECF5] pt-4">
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="(item, index) in dadosFiltrados.slice(0, 8)"
          :key="`${item[labelKey]}-${index}`"
          class="flex items-center space-x-2"
        >
          <div class="h-3 w-3 rounded-full" :style="{ backgroundColor: cores[index % cores.length] }"></div>
          <span class="truncate text-xs text-[#486581]">{{ item[labelKey] }}</span>
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

const valoresLaterais = computed(() => {
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
    backgroundColor: cores.slice(0, valores.value.length),
    borderColor: cores.slice(0, valores.value.length),
    borderWidth: 2,
    tension: 0.35,
    fill: tipoGrafico.value === 'line'
  }

  return {
    type: tipoGrafico.value,
    data: {
      labels: labels.value,
      datasets: [baseDataset]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: tipoGrafico.value === 'pie',
          position: 'bottom'
        }
      },
      scales: tipoGrafico.value === 'pie'
        ? {}
        : {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatarValor(value)
              }
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
