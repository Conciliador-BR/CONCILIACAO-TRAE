<template>
  <transition name="slide">
    <div v-if="sidebarAberta" class="w-64 bg-white shadow-lg border-r border-gray-200 fixed left-0 top-0 h-full z-50">
      <!-- Cabeçalho do Sidebar -->
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-800">Menu</h2>
        <button @click="$emit('fechar')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Menu Items -->
      <nav class="p-4">
        <div class="space-y-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="$emit('selecionar-aba', tab.id)"
            class="w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200"
            :class="{
              'bg-blue-100 text-blue-700 border-l-4 border-blue-500': abaAtiva === tab.id,
              'text-gray-600 hover:bg-gray-100 hover:text-gray-800': abaAtiva !== tab.id
            }"
          >
            <component :is="tab.icon" class="w-5 h-5 mr-3" />
            <span class="font-medium">{{ tab.name }}</span>
          </button>
        </div>
      </nav>
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