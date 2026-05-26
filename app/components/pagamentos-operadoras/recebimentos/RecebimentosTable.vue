<template>
  <div>
    <div class="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">Linhas por página:</label>
        <select 
          v-model="itemsPerPage" 
          @change="updatePagination"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <label class="text-sm font-medium text-gray-700">Autorizadora:</label>
        <select
          v-model="autorizadoraFiltro"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas</option>
          <option v-for="op in autorizadorasDisponiveis" :key="op" :value="op">{{ op }}</option>
        </select>
      </div>
      
      <div class="flex items-center space-x-2">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        
        <span class="text-sm text-gray-700">
          Página {{ currentPage }} de {{ totalPages }} ({{ totalItems }} registros)
        </span>
        <span class="text-xs text-slate-600">
          Filtros ativos: {{ activeFiltersCount + (autorizadoraFiltro ? 1 : 0) }}
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>

    <div class="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm" style="scrollbar-width: thin;">
    <table class="min-w-full divide-y divide-gray-200 table-fixed">
      <thead class="bg-slate-100">
        <tr class="border-b border-slate-200">
          <th
            v-for="(column, index) in orderedColumns"
            :key="column"
            class="group relative cursor-pointer px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-100"
            :class="{ 'bg-blue-50': draggedColumn === column }"
            :style="{ width: responsiveColumnWidths[column] + 'px' }"
            draggable="true"
            @dragstart="$emit('drag-start', $event, column, index)"
            @dragover="$emit('drag-over', $event)"
            @drop="$emit('drag-drop', $event, index)"
            @dragend="$emit('drag-end', $event)"
            style="cursor: move;"
          >
            <div class="relative flex items-center gap-2">
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition-colors duration-200 group-hover:text-slate-900">
                {{ columnTitles[column] || column }}
              </div>
              <div class="opacity-0 transition-opacity duration-200 group-hover:opacity-50">
                <svg class="h-3.5 w-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                </svg>
              </div>
            </div>
            <div
              class="absolute bottom-0 right-0 top-0 z-10 w-2 cursor-col-resize opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-blue-100"
              @mousedown="$emit('start-resize', $event, column)"
            ></div>
          </th>
        </tr>
        <tr class="bg-white">
          <th :colspan="orderedColumns.length" class="p-0">
            <div class="h-1.5 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
          </th>
        </tr>
        <tr class="border-b border-slate-200 bg-white">
          <th
            v-for="column in orderedColumns"
            :key="`header-filter-${column}`"
            class="px-3 py-3"
          >
            <div class="flex items-center gap-2">
              <input
                v-if="isDateColumn(column)"
                v-model="columnFilters[column]"
                type="date"
                class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <input
                v-else-if="isNumericColumn(column)"
                v-model="columnFilters[column]"
                type="number"
                step="0.01"
                placeholder=">= valor"
                class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <input
                v-else
                v-model="columnFilters[column]"
                type="text"
                placeholder="Buscar..."
                class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <button
                v-if="column === orderedColumns[0]"
                type="button"
                class="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                @click="clearAllFilters"
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 bg-white">
        <tr v-for="(venda, index) in paginatedVendas" :key="venda.id || index" class="hover:bg-gray-50 transition-colors">
          <!-- usa orderedColumns -->
          <td v-for="column in orderedColumns"
              :key="column"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {{ formatCell(venda, column) }}
          </td>
          <!-- Removendo célula de Ações -->
        </tr>
        <tr v-if="filteredVendas.length === 0">
          <!-- ajusta colspan após remover 'Ações' -->
          <td :colspan="orderedColumns.length" class="px-6 py-8 text-center text-gray-500">
            Nenhum recebimento encontrado
          </td>
        </tr>
      </tbody>
      <tfoot class="border-t border-slate-200 bg-slate-50">
        <tr>
          <td
            v-for="column in orderedColumns"
            :key="`total-${column}`"
            class="border-r border-slate-200 px-5 py-3 whitespace-nowrap text-sm font-semibold last:border-r-0"
            :class="isNumericColumn(column) ? 'text-slate-900' : 'text-slate-500'"
          >
            <span v-if="column === orderedColumns[0]">Totais (filtrados)</span>
            <span v-else-if="isNumericColumn(column)">{{ formatTotalCell(column) }}</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tfoot>
    </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'

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
const numericColumns = new Set([
  'vendaBruta',
  'vendaLiquida',
  'taxaMdr',
  'despesaMdr',
  'numeroParcelas',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])

const columnFilters = reactive({})
const autorizadoraFiltro = ref('')
watch(orderedColumns, (cols) => {
  cols.forEach((col) => {
    if (typeof columnFilters[col] === 'undefined') columnFilters[col] = ''
  })
}, { immediate: true })

const autorizadorasDisponiveis = computed(() => {
  return Array.from(new Set((props.vendas || [])
    .map((v) => String(getRawValue(v, 'adquirente') || '').trim().toUpperCase())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
})

const isDateColumn = (column) => dateColumns.has(column)
const isNumericColumn = (column) => numericColumns.has(column)

const normalizeText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()

const getRawValue = (row, column) => {
  const primaryKey = supabaseFieldMap[column] || column
  const value = row?.[primaryKey]
  if (value !== undefined && value !== null && value !== '') return value
  if (column === 'numeroParcelas') {
    return row?.numero_parcelas ?? row?.numero_parceladas ?? 0
  }
  return value
}

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

const toIsoDate = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/')
    return `${y}-${m}-${d}`
  }
  const dateObj = new Date(str)
  if (isNaN(dateObj.getTime())) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const activeFiltersCount = computed(() => {
  return orderedColumns.value.reduce((acc, col) => acc + (String(columnFilters[col] || '').trim() ? 1 : 0), 0)
})

const filteredVendas = computed(() => {
  const rows = props.vendas || []
  if (!rows.length) return []
  return rows.filter((row) => {
    if (autorizadoraFiltro.value) {
      const adquirente = String(getRawValue(row, 'adquirente') || '').trim().toUpperCase()
      if (adquirente !== autorizadoraFiltro.value) return false
    }
    return orderedColumns.value.every((col) => {
      const filterValue = String(columnFilters[col] || '').trim()
      if (!filterValue) return true

      const rawValue = getRawValue(row, col)
      if (isDateColumn(col)) {
        return toIsoDate(rawValue) === filterValue
      }
      if (isNumericColumn(col)) {
        const rowNumber = parseNumeric(rawValue)
        const filterNumber = parseNumeric(filterValue)
        if (!Number.isFinite(rowNumber) || !Number.isFinite(filterNumber)) return false
        return rowNumber >= filterNumber
      }
      return normalizeText(rawValue).includes(normalizeText(filterValue))
    })
  })
})

const totalsByColumn = computed(() => {
  const totals = {}
  numericColumns.forEach((col) => { totals[col] = 0 })
  ;(filteredVendas.value || []).forEach((row) => {
    numericColumns.forEach((col) => {
      const n = parseNumeric(getRawValue(row, col))
      if (Number.isFinite(n)) totals[col] += n
    })
  })
  return totals
})

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

// Estados da paginação
const currentPage = ref(1)
const itemsPerPage = ref(50)

// Computeds para paginação
const totalItems = computed(() => filteredVendas.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))
const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredVendas.value.slice(start, end)
})

// Métodos de paginação
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}
const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}
const updatePagination = () => {
  currentPage.value = 1 // Reset para primeira página quando mudar itens por página
}

const clearAllFilters = () => {
  orderedColumns.value.forEach((col) => {
    columnFilters[col] = ''
  })
  autorizadoraFiltro.value = ''
  currentPage.value = 1
}

const formatTotalCell = (column) => {
  const total = Number(totalsByColumn.value?.[column] || 0)
  if (!Number.isFinite(total)) return '-'
  if (currencyColumns.has(column)) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
  }
  if (column === 'taxaMdr') {
    return `${total.toFixed(2)}%`
  }
  if (column === 'numeroParcelas') {
    return String(Math.round(total))
  }
  return total.toFixed(2)
}

// Reset quando os dados mudarem (mantém página válida)
watch(() => props.vendas.length, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
})
watch(filteredVendas, () => {
  currentPage.value = 1
})
</script>
