<template>
  <thead class="bg-blue-100">
    <tr>
      <th v-for="(column, index) in visibleColumns" 
          :key="column" 
          class="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200 relative group cursor-move"
          :class="{ 'bg-blue-200': draggedColumn === column }"
          draggable="true"
          @dragstart="onDragStart($event, column, index)"
          @dragover="onDragOver($event)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd">
        {{ columnTitles[column] }}
        <div 
          class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          @mousedown="startResize($event, column)"
          @click.stop
        ></div>
        <!-- Indicador de arrastar -->
        <div class="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
          <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
          </svg>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup>
const props = defineProps({
  visibleColumns: {
    type: Array,
    required: true
  },
  columnTitles: {
    type: Object,
    required: true
  },
  draggedColumn: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'drag-start', 
  'drag-over', 
  'drag-drop', 
  'drag-end',
  'start-resize'
])

// Eventos de drag and drop
const onDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const onDragOver = (event) => {
  emit('drag-over', event)
}

const onDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const onDragEnd = () => {
  emit('drag-end')
}

// Evento de redimensionamento
const startResize = (event, column) => {
  emit('start-resize', event, column)
}
</script>