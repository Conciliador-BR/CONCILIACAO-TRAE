<template>
  <div class="p-4 bg-gray-50 border-t">
    <div class="flex justify-between text-sm font-medium">
      <span>Total de {{ totalRegistros }} registros</span>
      <span>Total Bruto: R$ {{ formatCurrency(totalBruto) }} | Total Líquido: R$ {{ formatCurrency(totalLiquido) }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  totalRegistros: {
    type: Number,
    required: true
  },
  totalBruto: {
    type: Number,
    required: true
  },
  totalLiquido: {
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