<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Movimentações Financeiras</h2>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Conciliação e controle das movimentações</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm">
            {{ totalMovimentacoes }} Movimentações
          </div>
          <div class="px-4 py-2 rounded-lg font-semibold text-sm" :class="saldoTotal >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            {{ formatCurrency(saldoTotal) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['dados-atualizados', 'erro-atualizacao'])

const props = defineProps({
  totalMovimentacoes: { type: Number, default: 0 },
  saldoTotal: { type: Number, default: 0 }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>