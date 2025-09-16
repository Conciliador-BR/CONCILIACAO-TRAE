<template>
  <div class="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
    <!-- Seletor de itens por página -->
    <div class="flex items-center space-x-2">
      <span class="text-sm text-gray-700">Mostrar:</span>
      <select 
        :value="itemsPerPage" 
        @change="$emit('update:itemsPerPage', parseInt($event.target.value))"
        class="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        <option v-for="size in availablePageSizes" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <span class="text-sm text-gray-700">por página</span>
    </div>
    
    <!-- Informações da paginação -->
    <div class="flex items-center space-x-4">
      <span class="text-sm text-gray-700">
        Mostrando {{ startItem }} a {{ endItem }} de {{ totalItems }} registros
      </span>
      
      <!-- Controles de navegação -->
      <div class="flex items-center space-x-1">
        <button 
          @click="$emit('prevPage')"
          :disabled="currentPage === 1"
          class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Anterior
        </button>
        
        <!-- Números das páginas -->
        <div class="flex items-center space-x-1">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="$emit('setPage', page)"
            :class="[
              'px-3 py-1 text-sm border rounded',
              page === currentPage 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="$emit('nextPage')"
          :disabled="currentPage === totalPages"
          class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: Number,
  totalPages: Number,
  totalItems: Number,
  itemsPerPage: Number,
  availablePageSizes: Array
})

defineEmits(['setPage', 'nextPage', 'prevPage', 'update:itemsPerPage'])

// Calcular itens visíveis na página atual
const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return Math.min(end, props.totalItems)
})

// Calcular páginas visíveis (máximo 5 páginas)
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  
  // Ajustar início se necessário
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>