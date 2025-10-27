<template>
  <div class="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-blue-100 px-6 py-3 shadow-sm">
    <div class="flex justify-between items-center">
      <!-- Informações da Tela -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-sm text-slate-600">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <span class="font-medium">{{ screenSize }}</span>
          <span class="text-gray-400">•</span>
          <span class="text-gray-500">{{ windowWidth }}px</span>
        </div>
      </div>

      <!-- Informações das Colunas -->
      <div class="flex items-center space-x-2 text-sm">
        <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
        </svg>
        <span class="text-slate-600 font-medium">Colunas:</span>
        <div class="flex items-center space-x-1">
          <span class="text-emerald-600 font-bold">{{ visibleColumns }}</span>
          <span class="text-gray-400">/</span>
          <span class="text-gray-600">{{ totalColumns }}</span>
        </div>
        <div class="ml-2 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
          {{ Math.round((visibleColumns / totalColumns) * 100) }}% visíveis
        </div>
      </div>
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

<style scoped>
.bg-grid-slate-100\/50 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}
</style>