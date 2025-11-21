<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-xl border border-gray-200">
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center space-x-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">AV</span>
          <h1 class="text-2xl font-bold text-gray-900">Análise de Vendas</h1>
        </div>
        <p class="text-gray-600 mt-2">Indicadores financeiros e análise por bandeira</p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-right">
          <p class="text-xs text-gray-500">Período</p>
          <p class="text-sm font-semibold text-gray-900">{{ periodoAtual }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-500">Bandeiras</p>
          <p class="text-lg font-bold text-blue-600">{{ totalBandeiras }}</p>
        </div>
      </div>
      </div>
    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="group rounded-xl p-4 border border-green-600 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Melhor Bandeira</p>
            <p class="text-lg font-bold">{{ melhorBandeira.bandeira }}</p>
            <p class="text-xs opacity-90">{{ formatarPercentual(melhorBandeira.margemBruta) }} margem</p>
          </div>
          <div class="text-white group-hover:scale-110 transition">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
      <div class="group rounded-xl p-4 border border-amber-600 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Modalidade Mais Rentável</p>
            <p class="text-lg font-bold">{{ melhorModalidade.modalidade }}</p>
            <p class="text-xs opacity-90">{{ formatarPercentual(melhorModalidade.margemBruta) }} margem</p>
          </div>
          <div class="text-white group-hover:scale-110 transition">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>
      <div class="group rounded-xl p-4 border border-blue-600 bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-md hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Volume Total</p>
            <p class="text-lg font-bold">{{ formatarMoeda(volumeTotal.receitaLiquida) }}</p>
            <p class="text-xs opacity-90">{{ formatarPercentual(volumeTotal.margemBruta) }} margem média</p>
          </div>
          <div class="text-white group-hover:scale-110 transition">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalBandeiras: {
    type: Number,
    default: 0
  },
  melhorBandeira: {
    type: Object,
    default: () => ({ bandeira: 'N/A', margemBruta: 0 })
  },
  melhorModalidade: {
    type: Object,
    default: () => ({ modalidade: 'N/A', margemBruta: 0 })
  },
  volumeTotal: {
    type: Object,
    default: () => ({ receitaLiquida: 0, margemBruta: 0 })
  },
  periodoAtual: {
    type: String,
    default: 'Mês Atual'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Funções de formatação
const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor || 0)
}

const formatarPercentual = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((valor || 0) / 100)
}
</script>