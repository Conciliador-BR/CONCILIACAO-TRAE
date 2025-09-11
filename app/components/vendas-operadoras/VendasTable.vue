<template>
  <div>
    <!-- Controles de paginação no topo -->
    <div class="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">Linhas por página:</label>
        <select 
          v-model="itemsPerPage" 
          @change="updatePagination"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
      
      <div class="flex items-center space-x-2">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Anterior
        </button>
        
        <span class="text-sm text-gray-700">
          Página {{ currentPage }} de {{ totalPages }} ({{ totalItems }} registros)
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Próxima
        </button>
      </div>
    </div>

    <!-- Tabela com altura aumentada -->
    <div class="overflow-auto max-h-[2000px] max-w-full border border-gray-200 rounded-lg" style="scrollbar-width: thin;">
      <div class="min-w-full">
        <table class="w-full table-fixed" ref="table">
          <colgroup>
            <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
          </colgroup>
          <VendasTableHeader 
            :visible-columns="visibleColumns"
            :column-titles="columnTitles"
            :dragged-column="draggedColumn"
            @drag-start="handleDragStart"
            @drag-over="handleDragOver"
            @drag-drop="handleDragDrop"
            @drag-end="handleDragEnd"
            @start-resize="handleStartResize"
          />
          <tbody class="bg-white divide-y divide-gray-200">
            <VendasTableRow
              v-for="(venda, index) in paginatedVendas"
              :key="index"
              :venda="venda"
              :index="index"
              :visible-columns="visibleColumns"
            />
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VendasTableHeader from './VendasTableHeader.vue'
import VendasTableRow from './VendasTableRow.vue'

const props = defineProps({
  vendas: {
    type: Array,
    required: true
  },
  visibleColumns: {
    type: Array,
    required: true
  },
  columnTitles: {
    type: Object,
    required: true
  },
  responsiveColumnWidths: {
    type: Object,
    required: true
  },
  draggedColumn: {
    type: String,
    default: ''
  },
  columnOrder: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])

// Estados da paginação
const currentPage = ref(1)
const itemsPerPage = ref(50) // Padrão 50 linhas

// Computeds para paginação
const totalItems = computed(() => props.vendas.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.vendas.slice(start, end)
})

// Métodos de paginação
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const updatePagination = () => {
  currentPage.value = 1 // Reset para primeira página quando mudar itens por página
}

// Watch para resetar página quando vendas mudarem
watch(() => props.vendas.length, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
})

// Handlers para os eventos de drag and drop
const handleDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const handleDragOver = (event) => {
  emit('drag-over', event)
}

const handleDragDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const handleDragEnd = () => {
  emit('drag-end')
}

const handleStartResize = (event, column) => {
  emit('start-resize', event, column)
}
</script>

<style scoped>
/* Estilizar barras de rolagem */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>