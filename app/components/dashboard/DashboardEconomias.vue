<template>
  <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Análise de Economias e Otimizações</h3>
    <div class="space-y-4">
      <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
        <span class="text-sm font-medium text-green-800">Negociação de Taxas</span>
        <span class="text-lg font-bold text-green-600">R$ {{ formatCurrency(economias.negociacaoTaxas) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
        <span class="text-sm font-medium text-blue-800">Otimização de Bandeiras</span>
        <span class="text-lg font-bold text-blue-600">R$ {{ formatCurrency(economias.otimizacaoBandeiras) }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
        <span class="text-sm font-medium text-purple-800">Consolidação de Adquirentes</span>
        <span class="text-lg font-bold text-purple-600">R$ {{ formatCurrency(economias.consolidacaoAdquirentes) }}</span>
      </div>
      <div class="border-t pt-3">
        <div class="flex justify-between items-center">
          <span class="text-base font-semibold text-gray-800">Total de Economias</span>
          <span class="text-xl font-bold text-gray-900">R$ {{ formatCurrency(economias.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  economias: {
    type: Object,
    required: true
  }
})

const formatCurrency = (value) => {
  if (!value) return '0,00'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}
</script>