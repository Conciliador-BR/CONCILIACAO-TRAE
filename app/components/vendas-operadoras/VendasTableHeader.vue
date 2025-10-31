<template>
  <thead class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-2xl">
    <tr class="border-b border-blue-700/50">
      <th v-for="(column, index) in visibleColumns" 
          :key="column" 
          class="group relative px-6 py-6 text-left cursor-pointer transition-all duration-300 hover:bg-white/5"
          :class="{ 'bg-slate-700/50': draggedColumn === column }"
          draggable="true"
          @dragstart="onDragStart($event, column, index)"
          @dragover="onDragOver($event)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd">
        
        <!-- Subtle background pattern -->
        <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <!-- Content -->
        <div class="relative">
          <!-- Column title -->
          <div class="text-sm font-bold text-white group-hover:text-blue-200 transition-colors duration-300 tracking-wide uppercase">
            {{ columnTitles[column] }}
          </div>
          
          <!-- Subtle underline -->
          <div class="mt-2 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <!-- Active state indicator -->
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-12 transition-all duration-300 rounded-t-full"></div>
        
        <!-- Side glow effect -->
        <div class="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <!-- Resize handle -->
        <div 
          class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
          @mousedown="startResize($event, column)"
          @click.stop
        ></div>
        
        <!-- Drag indicator -->
        <div class="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-300">
          <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
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