<template>
  <div class="bg-blue-50 border-b border-blue-200 px-4 py-2">
    <div class="flex justify-between items-center text-sm text-blue-700">
      <span>Tela: {{ screenSize }} ({{ windowWidth }}px)</span>
      <span>Colunas: {{ visibleColumns }}/{{ totalColumns }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  screenSize: String,
  windowWidth: Number,
  visibleColumns: Number,
  totalColumns: Number
})
</script>