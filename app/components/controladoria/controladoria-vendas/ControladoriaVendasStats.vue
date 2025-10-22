<template>
  <div class="flex justify-center mb-8">
    <div class="flex gap-4" style="flex-wrap: nowrap; overflow-x: auto;">
      <!-- Total Débito -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg" style="min-width: 400px; width: 320px; height: 140px; flex-shrink: 0;">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-blue-100 text-sm">Total Débito</p>
            <p class="text-2xl font-bold">{{ formatCurrency(totais.debito) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-blue-300 text-sm">Cartão de Débito</span>
            </div>
          </div>
          <svg class="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>
        </div>
      </div>

      <!-- Total Crédito -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg" style="min-width: 400px; width: 320px; height: 140px; flex-shrink: 0;">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-green-100 text-sm">Total Crédito</p>
            <p class="text-2xl font-bold">{{ formatCurrency(totais.credito) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-green-300 text-sm">Cartão de Crédito</span>
            </div>
          </div>
          <svg class="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
      </div>

      <!-- Vouchers -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg" style="min-width: 400px; width: 320px; height: 140px; flex-shrink: 0;">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-purple-100 text-sm">Vouchers</p>
            <p class="text-2xl font-bold">{{ formatCurrency(totais.voucher) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-purple-300 text-sm">Vale Alimentação</span>
            </div>
          </div>
          <svg class="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v4a2 2 0 002 2h2a2 2 0 002-2v-4m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6z"></path>
          </svg>
        </div>
      </div>

      <!-- Venda Líquida -->
      <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg" style="min-width: 400px; width: 320px; height: 140px; flex-shrink: 0;">
        <div class="flex items-center justify-between h-full">
          <div>
            <p class="text-orange-100 text-sm">Venda Líquida</p>
            <p class="text-2xl font-bold">{{ formatCurrency(totais.vendaLiquida) }}</p>
            <div class="flex items-center mt-1">
              <span class="text-orange-300 text-sm">Total Final</span>
            </div>
          </div>
          <svg class="w-12 h-12 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  totais: {
    type: Object,
    required: true
  }
})

// Métodos
const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>