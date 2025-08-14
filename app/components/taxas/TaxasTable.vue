<template>
  <div class="overflow-auto max-h-96 max-w-full" style="scrollbar-width: thin;">
    <div class="min-w-full">
      <table class="w-full table-fixed" ref="table">
        <colgroup>
          <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
          <col :style="{ width: responsiveColumnWidths.acoes + 'px' }">
        </colgroup>
        <TaxasTableHeader 
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
          <TaxasTableRow
            v-for="(taxa, index) in taxas"
            :key="index"
            :taxa="taxa"
            :index="index"
            :visible-columns="visibleColumns"
            @update-taxa="$emit('update-taxa', $event.index, $event.column, $event.value)"
            @remover-taxa="$emit('remover-taxa', $event)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import TaxasTableHeader from './TaxasTableHeader.vue'
import TaxasTableRow from './TaxasTableRow.vue'

defineProps({
  taxas: {
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

const emit = defineEmits(['update-taxa', 'remover-taxa', 'drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])

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