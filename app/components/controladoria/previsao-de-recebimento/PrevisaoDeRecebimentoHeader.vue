<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Previsão de Recebimento</h1>
        <p class="text-gray-600">Projeção dos recebimentos futuros por adquirente, bandeira e modalidade</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="bg-blue-50 px-4 py-2 rounded-lg">
          <span class="text-sm font-medium text-blue-700">{{ adquirentesCount }} Adquirentes</span>
        </div>
        <div class="bg-green-50 px-4 py-2 rounded-lg">
          <span class="text-sm font-medium text-green-700">{{ formatCurrency(valorLiquido) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  adquirentesCount: {
    type: Number,
    required: true
  },
  valorLiquido: {
    type: Number,
    required: true
  }
})

const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>
