<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ title }}</h2>
      <p class="text-gray-600 mb-6">{{ description }}</p>
      <div class="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg">
        <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-blue-800 font-medium">{{ statusMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Módulo de Recebimentos'
  },
  description: {
    type: String,
    default: 'Em desenvolvimento...'
  },
  statusMessage: {
    type: String,
    default: 'Funcionalidade será implementada em breve'
  }
})
</script>