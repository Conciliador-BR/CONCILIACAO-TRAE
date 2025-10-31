<template>
  <div class="mb-8 px-2 sm:px-4 lg:px-6 xl:px-8">
    <!-- Layout Inteligente: Apenas Full HD+ = linha reta, demais = 2 linhas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
      
      <!-- Primeira linha: Vendas Brutas, Total Taxas, Débitos -->
      <!-- Vendas Brutas -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-green-100 text-xs sm:text-sm lg:text-sm">Vendas Brutas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumoCalculado.vendasBrutas) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-green-300 text-xs sm:text-sm">{{ resumoCalculado.qtdVendasBrutas }} vendas</span>
            </div>
          </div>
          <CurrencyDollarIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-200 ml-2" />
        </div>
      </div>

      <!-- Total Taxas -->
      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-red-100 text-xs sm:text-sm lg:text-sm">Total Taxas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumoCalculado.taxa) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-red-300 text-xs sm:text-sm">{{ resumoCalculado.taxaMedia }}% média</span>
            </div>
          </div>
          <PercentBadgeIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-200 ml-2" />
        </div>
      </div>

      <!-- Débitos -->
      <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-orange-100 text-xs sm:text-sm lg:text-sm">Débitos</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumoCalculado.debitos) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-orange-300 text-xs sm:text-sm">{{ resumoCalculado.qtdDebitos }} débitos</span>
            </div>
          </div>
          <ExclamationTriangleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-200 ml-2" />
        </div>
      </div>

      <!-- Segunda linha em telas menores / Continuação em Full HD -->
      <!-- Vendas Líquidas -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-blue-100 text-xs sm:text-sm lg:text-sm">Vendas Líquidas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumoCalculado.vendasLiquidas) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-blue-300 text-xs sm:text-sm">{{ resumoCalculado.qtdVendasLiquidas }} vendas</span>
            </div>
          </div>
          <ArrowTrendingUpIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-200 ml-2" />
        </div>
      </div>

      <!-- Total Líquido -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-purple-100 text-xs sm:text-sm lg:text-sm">Total Líquido</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(resumoCalculado.totalLiquido) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-purple-300 text-xs sm:text-sm">Final</span>
            </div>
          </div>
          <BanknotesIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-200 ml-2" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  PercentBadgeIcon, 
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  resumoCalculado: {
    type: Object,
    required: true,
    default: () => ({
      vendasBrutas: 0,
      qtdVendasBrutas: 0,
      taxa: 0,
      taxaMedia: 0,
      debitos: 0,
      qtdDebitos: 0,
      vendasLiquidas: 0,
      qtdVendasLiquidas: 0,
      totalLiquido: 0
    })
  }
})

// Função para formatar valores monetários
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>