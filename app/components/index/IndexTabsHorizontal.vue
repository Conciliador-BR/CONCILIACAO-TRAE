<template>
  <div v-if="!sidebarAberta" class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex space-x-8 overflow-x-auto">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="$emit('selecionar-aba', tab.id)"
          class="flex items-center px-4 py-4 cursor-pointer border-b-2 transition-all duration-200 whitespace-nowrap"
          :class="{
            'border-blue-500 text-blue-600': abaAtiva === tab.id,
            'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': abaAtiva !== tab.id
          }"
        >
          <component :is="tab.icon" class="w-5 h-5 mr-2" />
          <span class="font-medium">{{ tab.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sidebarAberta: Boolean,
  tabs: Array,
  abaAtiva: String
})

defineEmits(['selecionar-aba'])
</script>