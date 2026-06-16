<template>
  <div class="rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-200/60 shadow-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">{{ titulo }}</h3>
      <div class="flex space-x-2">
        <button
          @click="setTipo('bar')"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === 'bar' ? 'bg-[#244b77] text-white shadow-sm' : 'bg-[#F7FAFC] text-[#486581] hover:bg-[#EAF3FF]'
          ]"
        >
          Barras
        </button>
        <button
          @click="setTipo('line')"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === 'line' ? 'bg-[#244b77] text-white shadow-sm' : 'bg-[#F7FAFC] text-[#486581] hover:bg-[#EAF3FF]'
          ]"
        >
          Linhas
        </button>
        <button
          @click="setTipo('pie')"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            tipoGrafico === 'pie' ? 'bg-[#244b77] text-white shadow-sm' : 'bg-[#F7FAFC] text-[#486581] hover:bg-[#EAF3FF]'
          ]"
        >
          Pizza
        </button>
      </div>
    </div>

    <div :class="['w-full', tipoGrafico === 'pie' ? 'analise-pie-layout lg:flex lg:items-start lg:gap-4' : '']">
      <div class="analise-chart-canvas-wrap h-80 flex-1 min-w-0">
        <canvas :ref="setChartRef" class="w-full h-full"></canvas>
      </div>
      <div
        v-if="tipoGrafico === 'pie' && valoresLaterais.length > 0"
        class="analise-valores-laterais mt-3 lg:mt-0 lg:w-56 rounded-lg border border-[#E4ECF5] bg-[#F8FBFF] p-3"
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

    <!-- Legenda -->
    <div v-if="dadosProcessados.length > 0" class="mt-4 pt-4 border-t border-[#E4ECF5]">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div 
          v-for="(item, index) in dadosProcessados.slice(0, 8)" 
          :key="index"
          class="flex items-center space-x-2"
        >
          <div 
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: cores[index % cores.length] }"
          ></div>
          <span class="text-xs text-[#486581] truncate">{{ labels[index] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useAnaliseDeVendasCharts } from '~/composables/PageControladoria/analise-de-vendas/useAnaliseDeVendasCharts'

Chart.register(...registerables)

const props = defineProps({
  dados: { type: Array, required: true, default: () => [] },
  titulo: { type: String, default: 'Análise' },
  tipo: { type: String, default: 'receita' },
  defaultType: { type: String, default: 'bar' },
  loading: { type: Boolean, default: false }
})

const tipoGrafico = ref(props.defaultType || 'bar')
const chartRef = ref(null)
let chartInstance = null
const { getChartConfig } = useAnaliseDeVendasCharts()
const cores = ['#102A43', '#244B77', '#1E7E34', '#B56A00', '#3C74B2']

const labels = computed(() => {
  if (!props.dados) return []
  return props.dados.map(d => d.label || d.bandeira || d.modalidade || d.periodo || 'N/A')
})

const dadosProcessados = computed(() => props.dados || [])
const formatarMoeda = (valor) => `R$ ${Number(valor || 0).toLocaleString('pt-BR')}`
const formatarPercentual = (valor) => `${Number(valor || 0).toFixed(2)}%`

const valoresLaterais = computed(() => {
  if (tipoGrafico.value !== 'pie') return []
  return dadosProcessados.value.map((dado, index) => {
    let valor = 0
    if (props.tipo === 'receita') valor = dado.receitaBruta || 0
    else if (props.tipo === 'custo') valor = dado.custoTaxa || 0
    else if (props.tipo === 'taxa') valor = dado.taxaEfetiva || 0
    else valor = dado.receitaBruta || dado.receitaLiquida || 0

    return {
      label: labels.value[index] || 'N/A',
      cor: cores[index % cores.length],
      valor: props.tipo === 'taxa' ? formatarPercentual(valor) : formatarMoeda(valor)
    }
  })
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
