<template>
  <div class="px-8">
    <div class="flex justify-start">
      <!-- Header quadrado no lado esquerdo -->
      <div class="w-80 h-80 bg-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="h-full flex flex-col justify-center items-center p-8">
          <!-- Botão do Menu -->
          <button @click="$emit('toggle-sidebar')" class="mb-6 p-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
            <Bars3Icon class="w-6 h-6" />
          </button>
          
          <!-- Título -->
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">MRF CONCILIAÇÃO</h1>
            <p class="text-sm text-gray-600">Sistema de Conciliação de Cartões</p>
          </div>
        </div>
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