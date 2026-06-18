<template>
  <div>
    <div class="mb-4 rounded-2xl border border-[#d9e2ec] bg-white px-4 py-3 shadow-sm">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <button
              v-for="size in pageSizeOptions"
              :key="size"
              type="button"
              @click="setItemsPerPage(size)"
              :class="[
                'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors',
                Number(itemsPerPage) === size
                  ? 'bg-[#244b77] text-white shadow-sm ring-2 ring-[#8bb5de]/70'
                  : 'text-[#486581] hover:bg-[#EAF3FF] hover:text-[#102A43]'
              ]"
            >
              {{ size }}
            </button>
          </div>

          <label class="text-sm font-medium text-[#486581]">Autorizadora:</label>
        
          <select
            v-model="autorizadoraFiltro"
            class="rounded-xl border border-[#d9e2ec] bg-white px-3 py-1.5 text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#8bb5de]"
          >
            <option value="">Todas</option>
            <option v-for="op in autorizadorasDisponiveis" :key="op" :value="op">{{ op }}</option>
          </select>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <span class="text-xs font-medium text-[#9fb3c8]">
            Página {{ currentPage }} de {{ totalPages }} ({{ totalItems }} itens)
          </span>

          <button 
            @click="previousPage" 
            :disabled="currentPage === 1"
            class="rounded-full px-2.5 py-1 text-xs font-medium text-[#486581] transition-colors hover:bg-[#EAF3FF] hover:text-[#102A43] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <template v-for="page in visiblePages" :key="`recebimentos-page-${page}`">
            <button
              v-if="page !== '...'"
              type="button"
              @click="setPage(page)"
              :class="[
                'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors',
                page === currentPage
                  ? 'bg-[#244b77] text-white shadow-sm ring-2 ring-[#8bb5de]/70'
                  : 'text-[#486581] hover:bg-[#EAF3FF] hover:text-[#102A43]'
              ]"
            >
              {{ page }}
            </button>
            <span v-else class="px-1 text-xs text-[#9fb3c8]">...</span>
          </template>

          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="rounded-full px-2.5 py-1 text-xs font-medium text-[#486581] transition-colors hover:bg-[#EAF3FF] hover:text-[#102A43] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>

          <span class="text-xs text-[#9fb3c8]">Filtros ativos: {{ activeFiltersCount + (autorizadoraFiltro ? 1 : 0) }}</span>

          <div class="ml-2 flex items-center gap-2">
            <span class="text-xs text-[#9fb3c8]">Ir para</span>
            <input
              v-model="paginaDestino"
              type="number"
              min="1"
              :max="Math.max(1, totalPages)"
              @keydown.enter="irParaPagina"
              class="w-16 rounded-full border border-[#d9e2ec] px-2 py-1 text-center text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#8bb5de]"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-auto rounded-[28px] border-2 border-[#244b77]/35 bg-gradient-to-br from-white via-[#fcfefc] to-[#f4fbf5] shadow-lg shadow-[#73c77d]/10" style="scrollbar-width: thin;">
    <table class="min-w-full table-fixed">
      <thead class="bg-gradient-to-br from-white via-[#fcfefc] to-[#f5fbf6]">
        <tr class="border-b border-[#244b77]/20">
          <th
            v-for="(column, index) in orderedColumns"
            :key="column"
            class="group relative cursor-pointer px-5 py-4 text-left transition-colors duration-200 hover:bg-[#f4fbf5]"
            :class="{ 'bg-[#effbf1]': draggedColumn === column }"
            :style="{ width: responsiveColumnWidths[column] + 'px' }"
            draggable="true"
            @dragstart="$emit('drag-start', $event, column, index)"
            @dragover="$emit('drag-over', $event)"
            @drop="$emit('drag-drop', $event, index)"
            @dragend="$emit('drag-end', $event)"
            style="cursor: move;"
          >
            <div class="relative flex items-center gap-2">
              <div class="recebimentos-header-title text-xs font-semibold uppercase tracking-[0.18em] text-[#244b77] transition-colors duration-200 group-hover:text-[#163a5a]">
                {{ columnTitles[column] || column }}
              </div>
              <div class="opacity-0 transition-opacity duration-200 group-hover:opacity-50">
                <svg class="h-3.5 w-3.5 text-[#73c77d]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                </svg>
              </div>
            </div>
            <div
              class="absolute bottom-0 right-0 top-0 z-10 w-2 cursor-col-resize opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[#effbf1]"
              @mousedown="$emit('start-resize', $event, column)"
            ></div>
          </th>
        </tr>
        <tr class="bg-white/95">
          <th :colspan="orderedColumns.length" class="p-0">
            <div class="h-1.5 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
          </th>
        </tr>
        <tr class="border-b border-[#244b77]/15 bg-white/90">
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
                class="filter-input-base"
              />
              <input
                v-else-if="isNumericColumn(column)"
                v-model="columnFilters[column]"
                type="number"
                step="0.01"
                placeholder=">= valor"
                class="filter-input-base"
              />
              <input
                v-else
                v-model="columnFilters[column]"
                type="text"
                placeholder="Buscar..."
                class="filter-input-base"
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
      <tbody class="bg-white/95">
        <tr
          v-for="(venda, index) in paginatedVendas"
          :key="venda.id || index"
          class="group border-b border-[#244b77]/10 transition-all duration-200 odd:bg-white even:bg-[#f9fcf9] hover:bg-[#f3fbf4]"
        >
          <!-- usa orderedColumns -->
          <td v-for="column in orderedColumns"
              :key="column"
              class="px-4 py-3.5 whitespace-nowrap text-sm text-slate-700 transition-colors duration-200 group-hover:text-[#214f24]"
              :class="getCellTdClasses(column)"
          >
            <span :class="getCellClasses(column)">
              {{ formatCell(venda, column) }}
            </span>
          </td>
          <!-- Removendo célula de Ações -->
        </tr>
        <tr v-if="filteredVendas.length === 0">
          <td :colspan="orderedColumns.length" class="px-6 py-10 text-center">
            <div class="mx-auto max-w-md rounded-2xl border border-dashed border-[#73c77d]/30 bg-[#f7fcf8] px-4 py-6">
              <p class="table-strong-text text-sm font-semibold text-[#2f7d32]">Nenhum recebimento encontrado</p>
              <p class="mt-1 text-xs text-slate-500">Ajuste os filtros para visualizar os registros.</p>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot class="border-t border-[#244b77]/20 bg-gradient-to-r from-[#f7fcf8] to-white">
        <tr>
          <td
            v-for="column in orderedColumns"
            :key="`total-${column}`"
            class="border-b border-[#244b77]/15 border-r border-[#244b77]/10 px-4 py-3.5 whitespace-nowrap text-sm font-semibold last:border-r-0"
            :class="isNumericColumn(column) ? 'text-right text-[#2f7d32]' : 'text-slate-500'"
          >
            <span
              v-if="column === orderedColumns[0]"
              class="table-strong-text inline-flex items-center rounded-full bg-[#effbf1] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2f7d32]"
            >
              Totais filtrados
            </span>
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

const getCellClasses = (column) => {
  const baseClasses = 'table-cell-text text-sm'

  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return `${baseClasses} table-strong-text text-right font-medium text-[#2f7d32]`
  }

  if (['adquirente', 'bandeira', 'modalidade'].includes(column)) {
    return `${baseClasses} table-strong-text font-semibold text-[#295c2d]`
  }

  return `${baseClasses} text-slate-700`
}

const getCellTdClasses = (column) => {
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return 'text-right'
  }

  return ''
}

// Estados da paginação
const currentPage = ref(1)
const itemsPerPage = ref(50)
const paginaDestino = ref('1')
const pageSizeOptions = [10, 20, 30, 50, 100]

// Computeds para paginação
const totalItems = computed(() => filteredVendas.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let page = 1; page <= total; page += 1) pages.push(page)
    return pages
  }

  if (current <= 4) return [1, 2, 3, 4, '...', total]
  if (current >= total - 3) return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
})
const paginatedVendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredVendas.value.slice(start, end)
})

// Métodos de paginação
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    paginaDestino.value = String(currentPage.value)
  }
}
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    paginaDestino.value = String(currentPage.value)
  }
}
const updatePagination = () => {
  currentPage.value = 1 // Reset para primeira página quando mudar itens por página
  paginaDestino.value = '1'
}

const setItemsPerPage = (size) => {
  itemsPerPage.value = Number(size || 50)
  updatePagination()
}

const setPage = (page) => {
  const target = Number(page)
  if (!Number.isFinite(target)) return
  currentPage.value = Math.min(Math.max(1, target), totalPages.value)
  paginaDestino.value = String(currentPage.value)
}

const irParaPagina = () => {
  const pagina = Number(paginaDestino.value)
  if (!Number.isFinite(pagina)) return
  const paginaNormalizada = Math.min(Math.max(1, pagina), totalPages.value)
  currentPage.value = paginaNormalizada
  paginaDestino.value = String(paginaNormalizada)
}

const clearAllFilters = () => {
  orderedColumns.value.forEach((col) => {
    columnFilters[col] = ''
  })
  autorizadoraFiltro.value = ''
  currentPage.value = 1
  paginaDestino.value = '1'
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
  paginaDestino.value = String(currentPage.value)
})
watch(filteredVendas, () => {
  currentPage.value = 1
  paginaDestino.value = '1'
})
</script>

<style scoped>
.recebimentos-header-title {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(36, 75, 119, 0.14);
}

.filter-input-base {
  height: 2.5rem;
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.filter-input-base::placeholder {
  color: #94a3b8;
  font-weight: 600;
}

.filter-input-base:focus {
  border-color: #cbd5e1;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.18);
}

.filter-input-base[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.filter-input-base[type='number']::-webkit-outer-spin-button,
.filter-input-base[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.table-cell-text {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.table-strong-text {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(47, 125, 50, 0.12);
}
</style>
