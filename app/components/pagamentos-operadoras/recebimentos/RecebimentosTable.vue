<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <!-- usa orderedColumns e remove 'Ações' -->
          <!-- add width responsivo e eventos de drag -->
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
          <!-- Removida a coluna Ações -->
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(venda, index) in vendas" :key="venda.id || index" class="hover:bg-gray-50 transition-colors">
          <!-- usa orderedColumns -->
          <td v-for="column in orderedColumns"
              :key="column"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {{ formatCell(venda, column) }}
          </td>
          <!-- Removendo célula de Ações -->
        </tr>
        <tr v-if="vendas.length === 0">
          <!-- ajusta colspan após remover 'Ações' -->
          <td :colspan="orderedColumns.length" class="px-6 py-8 text-center text-gray-500">
            Nenhum recebimento encontrado
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

// Mapeamento colunas → Supabase (inclui dataPagamento)
const supabaseFieldMap = {
  dataVenda: 'data_venda',
  dataPagamento: 'data_recebimento',
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
  empresa: 'empresa'
}

// Colunas de moeda
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
  if (!props.columnOrder || props.columnOrder.length === 0) return props.visibleColumns
  return props.columnOrder.filter(col => props.visibleColumns.includes(col))
})

// Colunas de data (já existentes)
const dateColumns = new Set(['dataVenda', 'dataPagamento'])

// Formatação segura de datas para evitar problemas de timezone
const safeFormatDate = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const str = String(value).trim()

  // DD/MM/YYYY → mantém
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str

  // YYYY-MM-DD → converte sem criar Date UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }

  // Fallback: tenta Date e formata localmente
  const dateObj = new Date(str)
  if (isNaN(dateObj.getTime())) return '-'
  const dia = String(dateObj.getDate()).padStart(2, '0')
  const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
  const ano = dateObj.getFullYear()
  return `${dia}/${mes}/${ano}`
}

// Formata a célula usando o mapeamento do Supabase
const formatCell = (venda, column) => {
  const key = supabaseFieldMap[column] || column
  const value = venda ? venda[key] : undefined
  if (value === null || value === undefined || value === '') return '-'

  if (dateColumns.has(column)) {
    return safeFormatDate(value)
  }

  if (currencyColumns.has(column)) {
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(num)) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
  }

  return value
}
</script>