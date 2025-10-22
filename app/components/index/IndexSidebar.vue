<template>
  <transition name="slide">
    <div v-if="sidebarAberta" class="w-64 fixed left-0 top-0 h-full z-50 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div class="h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <!-- Cabeçalho do Sidebar -->
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200 relative">
          <h2 class="text-2xl font-bold text-gray-900">Menu</h2>
          <p class="text-sm text-gray-600 mt-1">Navegação do sistema</p>
          <button @click="$emit('fechar')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Menu Items -->
        <nav class="p-6">
          <div class="space-y-3">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="$emit('selecionar-aba', tab.id)"
              class="w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 border"
              :class="{
                'bg-blue-50 text-blue-700 border-blue-200 shadow-sm': abaAtiva === tab.id,
                'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-transparent hover:border-gray-200 hover:shadow-sm': abaAtiva !== tab.id
              }"
            >
              <component :is="tab.icon" class="w-5 h-5 mr-3" />
              <span class="font-medium">{{ tab.name }}</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  sidebarAberta: Boolean,
  tabs: Array,
  abaAtiva: String
})

defineEmits(['fechar', 'selecionar-aba'])
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>