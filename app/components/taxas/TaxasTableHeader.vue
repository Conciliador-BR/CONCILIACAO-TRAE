<template>
  <thead class="bg-blue-100">
    <tr>
      <th v-for="column in visibleColumns" 
          :key="column"
          class="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-r border-blue-200 last:border-r-0"
      >
        {{ columnTitles[column] }}
      </th>
      <th class="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
        Ações
      </th>
    </tr>
  </thead>
</template>

<script setup>
defineProps({
  visibleColumns: {
    type: Array,
    required: true
  },
  columnTitles: {
    type: Object,
    required: true
  }
})
</script>