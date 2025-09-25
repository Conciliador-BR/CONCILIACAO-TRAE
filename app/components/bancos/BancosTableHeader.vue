<template>
  <thead class="bg-gray-50">
    <tr>
      <th 
        v-for="(column, index) in visibleColumns" 
        :key="column"
        class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b cursor-pointer hover:bg-gray-100"
        draggable="true"
        @dragstart="$emit('drag-start', $event, column, index)"
        @dragover="$emit('drag-over', $event)"
        @drop="$emit('drag-drop', $event, index)"
        @dragend="$emit('drag-end')"
      >
        {{ columnTitles[column] }}
      </th>
    </tr>
  </thead>
</template>

<script setup>
defineProps({
  visibleColumns: Array,
  columnTitles: Object,
  draggedColumn: Object
})

defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])
</script>