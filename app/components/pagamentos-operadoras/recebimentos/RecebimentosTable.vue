<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th v-for="(column, index) in orderedColumns" 
              :key="column"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group"
              :style="{ width: responsiveColumnWidths[column] + 'px' }"
              draggable="true"
              @dragstart="$emit('drag-start', $event, column, index)"
              @dragover="$emit('drag-over', $event)"
              @drop="$emit('drag-drop', $event, index)"
              @dragend="$emit('drag-end', $event)"
              style="cursor: move;"
          >
            {{ columnTitles[column] || column }}
            <div class="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize"
                 @mousedown="$emit('start-resize', $event, column)">
            </div>
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ações
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(venda, index) in vendas" :key="venda.id || index" class="hover:bg-gray-50 transition-colors">
          <td v-for="column in orderedColumns" 
              :key="column"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {{ formatCell(venda, column) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button 
              @click="$emit('remover-venda', index)"
              class="inline-flex items-center px-3 py-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Remover
            </button>
          </td>
        </tr>
        <tr v-if="vendas.length === 0">
          <td :colspan="orderedColumns.length + 1" class="px-6 py-8 text-center text-gray-500">
            <div class="flex flex-col items-center">
              <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path>
              </svg>
              <p class="text-gray-600 font-medium">Nenhum recebimento encontrado</p>
              <p class="text-gray-500 text-sm mt-1">Tente ajustar seus filtros ou atualizar os dados</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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

// Mapeamento das colunas para os campos do Supabase
const supabaseFieldMap = {
  dataVenda: 'data_venda',
  vendaBruta: 'valor_bruto',
  vendaLiquida: 'valor_liquido',
  taxaMdr: 'taxa_mdr',
  despesaMdr: 'despesa_mdr',
  numeroParcelas: 'numero_parceladas',
  valorAntecipado: 'valor_antecipacao',
  despesasAntecipacao: 'despesa_antecipacao',
  valorLiquidoAntec: 'valor_liquido_antecipacao',
  modalidade: 'modalidade',
  nsu: 'nsu',
  bandeira: 'bandeira',
  empresa: 'empresa',
  matriz: 'matriz',
  adquirente: 'adquirente'
}

// Colunas que devem ser formatadas como moeda
const currencyColumns = new Set([
  'vendaBruta',
  'vendaLiquida',
  'despesaMdr',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])

// Computed para ordenar as colunas de acordo com columnOrder
const orderedColumns = computed(() => {
  if (!props.columnOrder || props.columnOrder.length === 0) {
    return props.visibleColumns
  }
  return props.columnOrder.filter(col => props.visibleColumns.includes(col))
})

// Formata a célula usando o mapeamento do Supabase
const formatCell = (venda, column) => {
  const key = supabaseFieldMap[column] || column
  const value = venda ? venda[key] : undefined
  if (value === null || value === undefined || value === '') return '-'

  if (column === 'dataVenda') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR')
  }

  if (currencyColumns.has(column)) {
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(num)) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  return value
}
</script>