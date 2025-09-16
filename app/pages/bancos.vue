<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Cabeçalho -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="w-full mx-auto">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Bancos</h1>
        <p class="text-gray-600">Integração bancária e conciliação</p>
      </div>
    </div>

    <!-- Container da tabela -->
    <div class="w-full h-full">
      <BancosContainer />
    </div>
  </div>
</template>

<script setup>
import BancosContainer from '~/components/bancos/BancosContainer.vue'

// Configurações da página
useHead({
  title: 'Bancos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Integração bancária' }
  ]
})
</script>