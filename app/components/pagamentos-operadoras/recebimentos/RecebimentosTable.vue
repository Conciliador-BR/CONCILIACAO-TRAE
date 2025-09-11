<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th v-for="column in visibleColumns" 
              :key="column"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {{ columnTitles[column] || column }}
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ações
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(venda, index) in vendas" :key="venda.id || index" class="hover:bg-gray-50">
          <td v-for="column in visibleColumns" 
              :key="column"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {{ formatValue(venda[column], column) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button 
              @click="$emit('remover-venda', index)"
              class="text-red-600 hover:text-red-900"
            >
              Remover
            </button>
          </td>
        </tr>
        <tr v-if="vendas.length === 0">
          <td :colspan="visibleColumns.length + 1" class="px-6 py-4 text-center text-gray-500">
            Nenhum recebimento encontrado
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  vendas: {
    type: Array,
    default: () => []
  },
  visibleColumns: {
    type: Array,
    default: () => []
  },
  columnTitles: {
    type: Object,
    default: () => ({})
  },
  responsiveColumnWidths: {
    type: Object,
    default: () => ({})
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

defineEmits(['remover-venda', 'drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])

const formatValue = (value, column) => {
  if (value === null || value === undefined) return '-'
  
  // Formatação específica por tipo de coluna
  if (column.includes('valor') || column.includes('Valor')) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  if (column.includes('data') || column.includes('Data')) {
    return new Date(value).toLocaleDateString('pt-BR')
  }
  
  return value
}
</script>