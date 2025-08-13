<template>
  <div class="p-4 bg-gray-50 border-t">
    <div class="flex justify-between text-sm font-medium">
      <span>Total de {{ totalTaxas }} taxas cadastradas</span>
      <span>Taxa Média: {{ taxaMedia.toFixed(2) }}%</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalTaxas: {
    type: Number,
    required: true
  },
  taxaMedia: {
    type: Number,
    required: true
  }
})
</script>