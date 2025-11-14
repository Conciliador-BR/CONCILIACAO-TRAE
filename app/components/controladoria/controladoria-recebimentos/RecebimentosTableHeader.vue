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
        <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative">
          <div class="text-sm font-bold text-white group-hover:text-blue-200 transition-colors duration-300 tracking-wide uppercase">
            {{ columnTitles[column] }}
          </div>
          <div class="mt-2 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
             @mousedown="startResize($event, column)"
             @click.stop></div>
      </th>
    </tr>
  </thead>
</template>

<script setup>
const props = defineProps({
  visibleColumns: { type: Array, required: true },
  columnTitles: { type: Object, required: true },
  draggedColumn: { type: String, default: '' }
})

const emit = defineEmits(['drag-start','drag-over','drag-drop','drag-end','start-resize'])

const onDragStart = (event, column, index) => { emit('drag-start', event, column, index) }
const onDragOver = (event) => { emit('drag-over', event) }
const onDrop = (event, targetIndex) => { emit('drag-drop', event, targetIndex) }
const onDragEnd = () => { emit('drag-end') }
const startResize = (event, column) => { emit('start-resize', event, column) }
</script>