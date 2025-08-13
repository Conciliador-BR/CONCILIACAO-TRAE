<template>
  <div class="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <!-- Botão do Menu -->
        <button @click="$emit('toggle-sidebar')" class="mr-4 p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <Bars3Icon class="w-6 h-6" />
        </button>
        <div>
          <h1 class="text-4xl font-bold text-gray-800 mb-2">MRF CONCILIAÇÃO</h1>
          <p class="text-gray-600">Sistema de Conciliação de Cartões</p>
        </div>
      </div>
      
      <!-- Indicador da Aba Atual -->
      <div class="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
        <component :is="abaAtual.icon" class="w-5 h-5 text-gray-600" />
        <span class="text-gray-800 font-medium">{{ abaAtual.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bars3Icon } from '@heroicons/vue/24/outline'

defineProps({
  abaAtual: Object
})

defineEmits(['toggle-sidebar'])
</script>