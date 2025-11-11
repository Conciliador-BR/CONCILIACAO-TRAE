<template>
  <div class="px-8 py-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6">
      
      <!-- Card Total de Registros -->
      <div class="bg-white rounded-xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Registros</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalVendas.toLocaleString('pt-BR') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Card Total Bruto -->
      <div class="bg-white rounded-xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bruto</p>
            <p class="text-2xl font-bold text-blue-600">R$ {{ formatCurrency(vendaBrutaTotal) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Card Total Líquido -->
      <div class="bg-white rounded-xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Líquido</p>
            <p class="text-2xl font-bold text-emerald-600">R$ {{ formatCurrency(vendaLiquidaTotal) }}</p>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  totalVendas: {
    type: Number,
    required: true
  },
  vendaBrutaTotal: {
    type: Number,
    required: true
  },
  vendaLiquidaTotal: {
    type: Number,
    required: true
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}
</script>