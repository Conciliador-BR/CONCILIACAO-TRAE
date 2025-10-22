<template>
  <div v-if="!sidebarAberta" class="px-6 py-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-8 py-6">
          <div class="flex space-x-8 overflow-x-auto justify-center">
            <div 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="$emit('selecionar-aba', tab.id)"
              class="flex items-center py-3 px-4 cursor-pointer rounded-lg transition-all duration-200 whitespace-nowrap"
              :class="{
                'bg-blue-50 text-blue-600 border border-blue-200': abaAtiva === tab.id,
                'text-gray-500 hover:text-gray-700 hover:bg-gray-50': abaAtiva !== tab.id
              }"
            >
              <component :is="tab.icon" class="w-5 h-5 mr-2" />
              <span class="font-medium">{{ tab.name }}</span>
            </div>
          </div>
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