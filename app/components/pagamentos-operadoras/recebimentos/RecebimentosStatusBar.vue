<template>
  <div class="bg-gray-50 border-b border-gray-200 px-6 py-3">
    <div class="flex items-center justify-between text-sm text-gray-600">
      <div class="flex items-center space-x-4">
        <span>Tela: {{ screenSize }}</span>
        <span>Largura: {{ windowWidth }}px</span>
      </div>
      <div class="flex items-center space-x-4">
        <span>Colunas visíveis: {{ visibleColumns }}/{{ totalColumns }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  screenSize: {
    type: String,
    default: 'desktop'
  },
  windowWidth: {
    type: Number,
    default: 1024
  },
  visibleColumns: {
    type: Number,
    default: 0
  },
  totalColumns: {
    type: Number,
    default: 0
  }
})
</script>