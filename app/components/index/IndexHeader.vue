<template>
  <div class="px-8 py-4">
    <div class="max-w-8xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <!-- Botão do Menu -->
            <button @click="$emit('toggle-sidebar')" class="p-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
              <Bars3Icon class="w-6 h-6" />
            </button>
            
            <!-- Título Centralizado -->
            <div class="flex-1 text-center">
              <h1 class="text-3xl font-bold text-gray-900">MRF CONCILIAÇÃO</h1>
              <p class="text-sm text-gray-600 mt-1">Sistema de Conciliação de Cartões</p>
            </div>
            
            <!-- Espaço vazio para manter o equilíbrio -->
            <div class="w-12"></div>
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