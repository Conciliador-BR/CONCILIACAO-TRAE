<template>
  <div class="overflow-auto max-h-[600px] max-w-full border border-gray-200 rounded-lg">
    <table class="w-full table-fixed">
      <thead class="bg-gray-50 sticky top-0">
        <tr>
          <th v-for="column in visibleColumns" :key="column" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
            {{ columnTitles[column] || column }}
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Ações</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(venda, index) in vendas" :key="venda.id || index" class="hover:bg-gray-50">
          <td v-for="column in visibleColumns" :key="column" class="px-4 py-3 text-sm text-gray-900 border-b">
            {{ venda[column] || '-' }}
          </td>
          <td class="px-4 py-3 text-sm border-b">
            <button 
              @click="$emit('remover-venda', venda.id)"
              class="text-red-600 hover:text-red-800"
            >
              Remover
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  vendas: Array,
  visibleColumns: Array,
  columnTitles: Object,
  responsiveColumnWidths: Object,
  draggedColumn: Object,
  columnOrder: Array
})

defineEmits(['remover-venda', 'drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])
</script>