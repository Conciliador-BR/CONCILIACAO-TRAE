<template>
  <div class="flex items-center space-x-6 text-sm">
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
      <span class="text-gray-600 font-medium">Tela: {{ screenSize }}</span>
    </div>
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
      <span class="text-gray-600 font-medium">{{ windowWidth }}px</span>
    </div>
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
      <span class="text-gray-600 font-medium">{{ visibleColumns }}/{{ totalColumns }} colunas</span>
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