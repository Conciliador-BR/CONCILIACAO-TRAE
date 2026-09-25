<template>
  <div class="w-full max-w-full overflow-x-hidden px-3 sm:px-6 lg:px-8">
    <div class="flex w-full justify-start">
      <!-- Header quadrado no lado esquerdo -->
      <div class="aspect-square w-full max-w-80 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xl">
        <div class="flex h-full flex-col items-center justify-center p-4 sm:p-8">
          <!-- Botão do Menu -->
          <button @click="$emit('toggle-sidebar')" class="mb-6 p-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
            <Bars3Icon class="w-6 h-6" />
          </button>
          
          <!-- Logo -->
          <div class="text-center">
            <img
              src="/economic-card-logo.png"
              alt="Economic Card Conciliadora"
              class="mx-auto mb-3 h-auto w-full max-w-64"
            >
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
