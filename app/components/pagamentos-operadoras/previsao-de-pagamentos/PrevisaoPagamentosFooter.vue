<template>
  <div class="bg-gray-50 border-t border-gray-200 px-4 py-2">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
      <!-- Total de registros -->
      <div class="text-gray-600">
        <span class="font-medium">Total:</span>
        <span class="ml-1 font-bold text-gray-900">{{ totalVendas.toLocaleString('pt-BR') }}</span>
      </div>
      
      <!-- Venda Bruta Total -->
      <div class="text-gray-600">
        <span class="font-medium">V. Bruta:</span>
        <span class="ml-1 font-bold text-green-600">{{ formatCurrency(vendaBrutaTotal) }}</span>
      </div>
      
      <!-- Venda Líquida Total -->
      <div class="text-gray-600">
        <span class="font-medium">V. Líquida:</span>
        <span class="ml-1 font-bold text-blue-600">{{ formatCurrency(vendaLiquidaTotal) }}</span>
      </div>
      
      <!-- Total MDR -->
      <div class="text-gray-600">
        <span class="font-medium">Total MDR:</span>
        <span class="ml-1 font-bold text-red-600">{{ formatCurrency(totalMdr) }}</span>
      </div>
      
      <!-- Média Taxa MDR -->
      <div class="text-gray-600">
        <span class="font-medium">Média MDR:</span>
        <span class="ml-1 font-bold text-orange-600">{{ formatPercentage(mediaTaxaMdr) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalVendas: Number,
  vendaBrutaTotal: Number,
  vendaLiquidaTotal: Number,
  totalMdr: Number,
  mediaTaxaMdr: Number
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatPercentage = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((value || 0) / 100)
}
</script>