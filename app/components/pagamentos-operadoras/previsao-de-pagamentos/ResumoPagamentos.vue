<template>
  <div class="flex justify-center mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 w-full max-w-7xl">
      <!-- Vendas Brutas -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-green-100 text-xs sm:text-sm font-medium">Vendas Brutas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(vendaBrutaTotal) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-green-300 text-xs sm:text-sm">{{ totalItems }} vendas</span>
            </div>
          </div>
          <CurrencyDollarIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-200" />
        </div>
      </div>

      <!-- Total MDR -->
      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-red-100 text-xs sm:text-sm font-medium">Total MDR</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(totalMdr) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-red-300 text-xs sm:text-sm">{{ formatPercentage(mediaTaxaMdr) }}% média</span>
            </div>
          </div>
          <PercentBadgeIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-200" />
        </div>
      </div>

      <!-- Vendas Líquidas -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-blue-100 text-xs sm:text-sm font-medium">Vendas Líquidas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(vendaLiquidaTotal) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-blue-300 text-xs sm:text-sm">Após MDR</span>
            </div>
          </div>
          <ArrowTrendingUpIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-200" />
        </div>
      </div>

      <!-- Previsões Futuras -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-purple-100 text-xs sm:text-sm font-medium">Previsões Futuras</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(vendaLiquidaTotal) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-purple-300 text-xs sm:text-sm">A receber</span>
            </div>
          </div>
          <CalendarDaysIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-200" />
        </div>
      </div>

      <!-- Margem Líquida -->
      <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[120px] sm:min-h-[140px]">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-indigo-100 text-xs sm:text-sm font-medium">Margem Líquida</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatPercentage(margemLiquida) }}%</p>
            <div class="flex items-center mt-1">
              <span class="text-indigo-300 text-xs sm:text-sm">Rentabilidade</span>
            </div>
          </div>
          <ChartBarIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-indigo-200" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  PercentBadgeIcon, 
  CalendarDaysIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  vendaBrutaTotal: {
    type: Number,
    default: 0
  },
  vendaLiquidaTotal: {
    type: Number,
    default: 0
  },
  totalMdr: {
    type: Number,
    default: 0
  },
  mediaTaxaMdr: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  }
})

// Computed para margem líquida
const margemLiquida = computed(() => {
  if (props.vendaBrutaTotal === 0) return 0
  return ((props.vendaLiquidaTotal / props.vendaBrutaTotal) * 100)
})

// Função para formatar valores monetários
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para formatar percentuais
const formatPercentage = (value) => {
  if (typeof value !== 'number') return '0,00'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>