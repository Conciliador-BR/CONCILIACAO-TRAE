<template>
  <div class="bg-gray-50 border-t border-gray-200 p-4">
    <div class="flex justify-between items-center text-sm text-gray-600">
      <span>Total de registros: {{ totalVendas }}</span>
      <div class="flex space-x-4">
        <span>Venda Bruta: {{ formatCurrency(vendaBrutaTotal) }}</span>
        <span>Venda Líquida: {{ formatCurrency(vendaLiquidaTotal) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalVendas: Number,
  vendaBrutaTotal: Number,
  vendaLiquidaTotal: Number
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>