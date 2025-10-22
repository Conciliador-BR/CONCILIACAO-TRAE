<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-8xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
          <h1 class="text-3xl font-bold text-gray-900">Bancos</h1>
          <p class="text-sm text-gray-600 mt-1">Integração bancária e conciliação</p>
        </div>
      </div>

      <!-- Container da tabela -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-8">
          <BancosContainer />
        </div>
      </div>
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