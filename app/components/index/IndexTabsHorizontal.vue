<template>
  <div v-if="!sidebarAberta" class="w-full max-w-full overflow-x-hidden px-3 sm:px-6">
    <div class="mx-auto w-full max-w-full min-w-0">
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div class="px-3 py-4 sm:px-8 sm:py-6">
          <div class="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:gap-4 lg:gap-8">
            <!-- Botão do Menu -->
            <button @click="$emit('toggle-sidebar')" class="shrink-0 rounded-xl border border-transparent p-2.5 text-gray-500 transition-colors hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700 sm:p-3">
              <Bars3Icon class="w-6 h-6" />
            </button>
            
            <!-- Tabs -->
            <div class="flex min-w-0 flex-1 flex-wrap justify-center gap-2 sm:gap-4 lg:gap-8">
              <div 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="$emit('selecionar-aba', tab.id)"
                class="flex min-w-0 cursor-pointer items-center rounded-lg px-3 py-2.5 transition-all duration-200 sm:px-4 sm:py-3"
                :class="{
                  'bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white border border-[#244b77] shadow-lg ring-2 ring-[#8bb5de]': abaAtiva === tab.id,
                  'text-gray-500 hover:text-gray-700 hover:bg-gray-50': abaAtiva !== tab.id
                }"
              >
                <component :is="tab.icon" class="mr-1.5 h-5 w-5 shrink-0 sm:mr-2" />
                <span class="truncate text-sm font-medium sm:text-base">{{ tab.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bars3Icon } from '@heroicons/vue/24/outline'

defineProps({
  sidebarAberta: Boolean,
  tabs: Array,
  abaAtiva: String
})

defineEmits(['selecionar-aba', 'toggle-sidebar'])
</script>
