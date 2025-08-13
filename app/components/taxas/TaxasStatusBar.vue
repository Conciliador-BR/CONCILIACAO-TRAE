<template>
  <div class="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600 flex justify-between items-center">
    <span>Resolução: {{ screenSize.toUpperCase() }} ({{ windowWidth }}px)</span>
    <span>Colunas visíveis: {{ visibleColumns }}/{{ totalColumns }}</span>
  </div>
</template>

<script setup>
defineProps({
  screenSize: {
    type: String,
    required: true
  },
  windowWidth: {
    type: Number,
    required: true
  },
  visibleColumns: {
    type: Number,
    required: true
  },
  totalColumns: {
    type: Number,
    required: true
  }
})
</script>