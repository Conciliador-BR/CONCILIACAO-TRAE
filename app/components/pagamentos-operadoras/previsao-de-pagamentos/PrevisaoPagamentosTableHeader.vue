<template>
  <thead class="bg-gradient-to-r from-gray-50 to-white">
    <tr class="border-b border-gray-200">
      <th v-for="(column, index) in visibleColumns" 
          :key="column" 
          class="group relative px-6 py-4 text-left cursor-pointer transition-all duration-300 hover:bg-gray-50"
          :class="{ 'bg-gray-100': draggedColumn === column }"
          draggable="true"
          @dragstart="onDragStart($event, column, index)"
          @dragover="onDragOver($event)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd">
        <div class="absolute inset-0 bg-gradient-to-b from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative">
          <div class="text-xs sm:text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors duration-300 tracking-wide uppercase">
            {{ columnTitles[column] }}
          </div>
          <div class="mt-2 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-gray-300 to-gray-200 group-hover:w-12 transition-all duration-300 rounded-t-full"></div>
        <div class="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div 
          class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
          @mousedown="startResize($event, column)"
          @click.stop
        ></div>
        
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