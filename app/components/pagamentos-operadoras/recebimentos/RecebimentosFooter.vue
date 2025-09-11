<template>
  <div class="bg-gray-50 border-t border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-600">
        Total de recebimentos: <span class="font-semibold">{{ totalVendas }}</span>
      </div>
      <div class="flex items-center space-x-6 text-sm">
        <div class="text-gray-600">
          Valor Bruto: 
          <span class="font-semibold text-green-600">
            {{ formatCurrency(vendaBrutaTotal) }}
          </span>
        </div>
        <div class="text-gray-600">
          Valor Líquido: 
          <span class="font-semibold text-blue-600">
            {{ formatCurrency(vendaLiquidaTotal) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalVendas: {
    type: Number,
    default: 0
  },
  vendaBrutaTotal: {
    type: Number,
    default: 0
  },
  vendaLiquidaTotal: {
    type: Number,
    default: 0
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>