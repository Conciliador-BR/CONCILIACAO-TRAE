<template>
  <div class="bg-gradient-to-r from-slate-50 to-gray-100 border-t border-gray-200 px-6 py-4 shadow-inner">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      
      <!-- Card Total de Registros -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
            <p class="text-lg font-bold text-gray-900">{{ totalMovimentacoes.toLocaleString('pt-BR') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Card Créditos -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Créditos</p>
            <p class="text-lg font-bold text-emerald-600">{{ formatCurrency(totalCreditos) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Card Débitos -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Débitos</p>
            <p class="text-lg font-bold text-red-500">{{ formatCurrency(totalDebitos) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Card Saldo -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div :class="getSaldoIconClasses()">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Saldo</p>
            <p class="text-lg font-bold" :class="saldoTotal >= 0 ? 'text-emerald-600' : 'text-red-500'">
              {{ formatCurrency(saldoTotal) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Card Média Créditos -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Média Créd.</p>
            <p class="text-lg font-bold text-blue-600">{{ formatCurrency(mediaCreditos) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Cards Adicionais (quando disponíveis) -->
      <div v-if="previstoTotal" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Previsto</p>
            <p class="text-lg font-bold text-purple-600">{{ formatCurrency(previstoTotal) }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="totalDiasComPrevisao" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Dias Prev.</p>
            <p class="text-lg font-bold text-indigo-600">{{ totalDiasComPrevisao }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="totalVendasPrevistas" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Vendas Prev.</p>
            <p class="text-lg font-bold text-orange-600">{{ formatCurrency(totalVendasPrevistas) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  totalMovimentacoes: {
    type: Number,
    default: 0
  },
  totalCreditos: {
    type: Number,
    default: 0
  },
  totalDebitos: {
    type: Number,
    default: 0
  },
  saldoTotal: {
    type: Number,
    default: 0
  },
  mediaCreditos: {
    type: Number,
    default: 0
  },
  previstoTotal: {
    type: Number,
    default: 0
  },
  totalDiasComPrevisao: {
    type: Number,
    default: 0
  },
  totalVendasPrevistas: {
    type: Number,
    default: 0
  }
})

// Função para formatar valor monetário
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

// Função para classes do ícone de saldo
const getSaldoIconClasses = () => {
  const baseClasses = 'w-10 h-10 rounded-lg flex items-center justify-center'
  
  if (props.saldoTotal >= 0) {
    return `${baseClasses} bg-gradient-to-br from-emerald-400 to-green-500`
  } else {
    return `${baseClasses} bg-gradient-to-br from-red-400 to-rose-500`
  }
}
</script>