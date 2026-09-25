<template>
  <div class="h-full w-full min-w-0">
    <div class="mb-3 rounded-xl border border-[#d9e2ec] bg-white px-3 py-2 shadow-sm">
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

          <template v-for="page in visiblePages" :key="`previsao-page-${page}`">
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
    <div
      ref="tableWrapper"
      class="pagamentos-table-scroll w-full overflow-x-auto overflow-y-auto scroll-smooth rounded-lg border border-[#d9e2ec] bg-white shadow-sm"
      style="scrollbar-width: thin;"
    >
    <table class="w-full min-w-[1600px] table-fixed" :style="{ minWidth: `${tableMinWidth}px` }">
      <colgroup>
        <col v-for="column in visibleColumns" :key="column" :style="{ width: resolvedColumnWidths[column] + 'px' }">
      </colgroup>
      <PagamentosTableHeader 
        :visible-columns="visibleColumns"
        :column-titles="columnTitles"
        :dragged-column="draggedColumn"
        :column-filters="columnFilters"
        :filter-options="filterOptions"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drag-drop="handleDragDrop"
        @drag-end="handleDragEnd"
        @start-resize="handleStartResize"
        @clear-filters="clearAllFilters"
      />
      <tbody class="bg-white/95">
        <tr
          v-for="(venda, index) in paginatedVendas"
          :key="venda.id || index"
          class="group border-b border-[#244b77]/10 transition-all duration-200 odd:bg-white even:bg-[#f9fcf9] hover:bg-[#f3fbf4]"
        >
          <td
            v-for="column in visibleColumns"
            :key="column"
            class="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 group-hover:text-[#214f24]"
            :class="getCellTdClasses(column)"
          >
            <!-- Usar componente independente para coluna previsão -->
            <PrevisaoPgtoColumn 
              v-if="column === 'previsaoPgto'" 
              :venda="venda" 
              :debug="false"
            />
            <span v-else :class="getCellClasses(column)">
              {{ formatCellValue(column, venda[column]) }}
            </span>
          </td>
        </tr>
        <tr v-if="filteredVendas.length === 0">
          <td :colspan="visibleColumns.length" class="px-6 py-10 text-center">
            <div class="mx-auto max-w-md rounded-2xl border border-dashed border-[#73c77d]/30 bg-[#f7fcf8] px-4 py-6">
              <p class="previsao-strong-text text-sm font-semibold text-[#2f7d32]">Nenhuma previsão encontrada</p>
              <p class="mt-1 text-xs text-slate-500">Ajuste os filtros para visualizar os registros.</p>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot class="border-t border-[#244b77]/20 bg-gradient-to-r from-[#f7fcf8] to-white">
        <tr>
          <td
            v-for="column in visibleColumns"
            :key="`total-${column}`"
            class="border-b border-[#244b77]/15 border-r border-[#244b77]/10 px-3 py-2 whitespace-nowrap text-xs font-semibold last:border-r-0"
            :class="numericColumns.has(column) ? 'text-right text-[#2f7d32]' : 'text-slate-500'"
          >
            <span
              v-if="column === visibleColumns[0]"
              class="previsao-strong-text inline-flex items-center rounded-full bg-[#effbf1] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2f7d32]"
            >
              Totais filtrados
            </span>
            <span v-else-if="numericColumns.has(column)">{{ formatTotalCell(column) }}</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tfoot>
    </table>
    </div>
  </div>
</template>

<script setup>
import PrevisaoPgtoColumn from './PrevisaoPgtoColumn.vue'
import PagamentosTableHeader from '../PagamentosTableHeader.vue'
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { usePrevisaoColuna } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/usePrevisaoColuna'
import { useTableAdvancedFilters } from '~/composables/useTableAdvancedFilters'

const props = defineProps({
  vendas: Array,
  visibleColumns: Array,
  columnTitles: Object,
  responsiveColumnWidths: Object,
  draggedColumn: String,
  columnOrder: Array
})

const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])
const { inicializar } = usePrevisaoColuna()
const tableWrapper = ref(null)
const tableWrapperWidth = ref(0)
let resizeObserver = null

const autorizadoraFiltro = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(30)
const paginaDestino = ref('1')
const pageSizeOptions = [10, 20, 30, 50, 100]

const minimumColumnWidths = {
  empresa: 150,
  matriz: 100,
  adquirente: 110,
  dataVenda: 100,
  previsaoPgto: 120,
  modalidade: 115,
  bandeira: 100,
  nsu: 110,
  vendaBruta: 110,
  vendaLiquida: 110,
  taxaMdr: 90,
  despesaMdr: 110,
  numeroParcelas: 120
}

const getPreferredColumnWidth = (column) => Math.max(
  Number(props.responsiveColumnWidths?.[column] || 120),
  getMinimumColumnWidth(column)
)
const getMinimumColumnWidth = (column) => Number(minimumColumnWidths[column] || 84)

const totalPreferredWidth = computed(() => {
  return (props.visibleColumns || []).reduce((total, column) => total + getPreferredColumnWidth(column), 0)
})

const totalMinimumWidth = computed(() => {
  return (props.visibleColumns || []).reduce((total, column) => total + getMinimumColumnWidth(column), 0)
})

const resolvedColumnWidths = computed(() => {
  const columns = props.visibleColumns || []
  const availableWidth = Number(tableWrapperWidth.value || 0)

  if (!columns.length) return {}

  if (!availableWidth || availableWidth >= totalPreferredWidth.value) {
    return columns.reduce((acc, column) => {
      acc[column] = getPreferredColumnWidth(column)
      return acc
    }, {})
  }

  if (availableWidth <= totalMinimumWidth.value) {
    return columns.reduce((acc, column) => {
      acc[column] = getMinimumColumnWidth(column)
      return acc
    }, {})
  }

  const shrinkNeeded = totalPreferredWidth.value - availableWidth
  const shrinkCapacity = totalPreferredWidth.value - totalMinimumWidth.value
  const shrinkRatio = shrinkCapacity > 0 ? shrinkNeeded / shrinkCapacity : 0

  return columns.reduce((acc, column) => {
    const preferred = getPreferredColumnWidth(column)
    const minimum = getMinimumColumnWidth(column)
    acc[column] = Math.max(minimum, Math.round(preferred - ((preferred - minimum) * shrinkRatio)))
    return acc
  }, {})
})

const vendasRef = computed(() => props.vendas || [])
const visibleColumnsRef = computed(() => props.visibleColumns || [])

const {
  columnFilters,
  syncFilters,
  filterOptionsByColumn,
  matchesAllColumnFilters,
  clearAllFilters: resetColumnFilters,
  getRawValue,
  parseNumeric,
  dateColumns,
  numericColumns,
  currencyColumns
} = useTableAdvancedFilters(vendasRef, visibleColumnsRef)

watch(visibleColumnsRef, () => {
  syncFilters()
}, { immediate: true, deep: true })

const filterOptions = (column) => filterOptionsByColumn((row) => {
  if (autorizadoraFiltro.value) {
    const adquirente = String(getRawValue(row, 'adquirente') || '').trim().toUpperCase()
    if (adquirente !== autorizadoraFiltro.value) return false
  }
  return true
}, [column])[column] || []


const autorizadorasDisponiveis = computed(() => {
  return Array.from(new Set((props.vendas || [])
    .map((v) => String(getRawValue(v, 'adquirente') || '').trim().toUpperCase())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
})

const activeFiltersCount = computed(() => {
  return (props.visibleColumns || []).reduce((acc, col) => {
    const filter = columnFilters[col]
    if (!filter) return acc
    if (filter.mode === 'values' && filter.selectedValues && filter.selectedValues.length > 0) return acc + 1
    if (filter.conditionValue) return acc + 1
    return acc
  }, 0)
})

const filteredVendas = computed(() => {
  const rows = props.vendas || []
  return rows.filter((row) => {
    if (autorizadoraFiltro.value) {
      const adquirente = String(getRawValue(row, 'adquirente') || '').trim().toUpperCase()
      if (adquirente !== autorizadoraFiltro.value) return false
    }
    return matchesAllColumnFilters(row)
  })
})

const totalItems = computed(() => filteredVendas.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / Number(itemsPerPage.value || 30))))
const tableMinWidth = computed(() => {
  if (tableWrapperWidth.value > totalMinimumWidth.value) {
    return Math.max(1600, tableWrapperWidth.value)
  }

  return Math.max(1600, totalMinimumWidth.value)
})
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 4) return [1, 2, 3, 4, '...', total]
  if (current >= total - 3) return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
})
const paginatedVendas = computed(() => {
  const pageSize = Number(itemsPerPage.value || 30)
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredVendas.value.slice(start, end)
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

const clearAllFilters = () => {
  resetColumnFilters()
  autorizadoraFiltro.value = ''
  currentPage.value = 1
  paginaDestino.value = '1'
}

const updatePagination = () => {
  currentPage.value = 1
  paginaDestino.value = '1'
}

const setItemsPerPage = (size) => {
  itemsPerPage.value = Number(size || 30)
  updatePagination()
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
    paginaDestino.value = String(currentPage.value)
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
    paginaDestino.value = String(currentPage.value)
  }
}

const setPage = (page) => {
  const target = Number(page)
  if (!Number.isFinite(target)) return
  const paginaNormalizada = Math.min(Math.max(1, target), totalPages.value)
  currentPage.value = paginaNormalizada
  paginaDestino.value = String(paginaNormalizada)
}

const irParaPagina = () => {
  const pagina = Number(paginaDestino.value)
  if (!Number.isFinite(pagina)) return
  const paginaNormalizada = Math.min(Math.max(1, pagina), totalPages.value)
  currentPage.value = paginaNormalizada
  paginaDestino.value = String(paginaNormalizada)
}

const formatTotalCell = (column) => {
  const total = Number(totalsByColumn.value?.[column] || 0)
  if (!Number.isFinite(total)) return '-'
  if (currencyColumns.has(column)) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
  }
  if (column === 'taxaMdr') return `${total.toFixed(2)}%`
  if (column === 'numeroParcelas') return String(Math.round(total))
  return total.toFixed(2)
}

// Função para formatar valores das células (igual à página de vendas)
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['vendaBruta', 'vendaLiquida', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Formatação para taxa MDR (porcentagem)
  if (column === 'taxaMdr') {
    return `${value}%`
  }
  
  // Formatação para data (igual à página de vendas)
  if (column === 'dataVenda' && value) {
    const s = String(value).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      return s
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [ano, mes, dia] = s.split('-')
      return `${dia}/${mes}/${ano}`
    }
    try {
      const d = new Date(s)
      if (Number.isFinite(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, '0')
        const mes = String(d.getMonth() + 1).padStart(2, '0')
        const ano = d.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
    } catch {}
    return s
  }
  
  return value
}

// Função para classes CSS das células (igual à página de vendas)
const getCellClasses = (column) => {
  const baseClasses = 'previsao-cell-text whitespace-nowrap text-xs font-semibold'
  
  // Alinhamento à direita para valores numéricos
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return `${baseClasses} previsao-strong-text text-right font-medium text-[#2f7d32]`
  }

  if (['adquirente', 'bandeira', 'modalidade'].includes(column)) {
    return `${baseClasses} previsao-strong-text font-semibold text-[#295c2d]`
  }

  return `${baseClasses} text-slate-700`
}

const getCellTdClasses = (column) => {
  if (column === 'numeroParcelas') return 'min-w-[120px] text-right'

  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column)) {
    return 'min-w-[110px] text-right'
  }

  if (column === 'empresa') return 'min-w-[150px]'
  if (['dataVenda', 'dataPagamento', 'previsaoPgto'].includes(column)) return 'min-w-[100px]'
  return 'min-w-[100px]'
}

// Inicializar taxas ao montar o componente
onMounted(async () => {
  await inicializar()
})

watch(filteredVendas, () => {
  currentPage.value = 1
  paginaDestino.value = '1'
})

watch(() => props.vendas, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  paginaDestino.value = String(currentPage.value)
}, { deep: true })

const updateTableWrapperWidth = () => {
  if (!process.client) return
  tableWrapperWidth.value = Math.floor(tableWrapper.value?.clientWidth || 0)
}

onMounted(async () => {
  await nextTick()
  updateTableWrapperWidth()

  if (typeof ResizeObserver !== 'undefined' && tableWrapper.value) {
    resizeObserver = new ResizeObserver(() => updateTableWrapperWidth())
    resizeObserver.observe(tableWrapper.value)
    return
  }

  window.addEventListener('resize', updateTableWrapperWidth)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (process.client) {
    window.removeEventListener('resize', updateTableWrapperWidth)
  }
})

// Handlers para eventos de drag and drop
const handleDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const handleDragOver = (event) => {
  emit('drag-over', event)
}

const handleDragDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const handleDragEnd = () => {
  emit('drag-end')
}

const handleStartResize = (event, column) => {
  emit('start-resize', event, column)
}
</script>

<style scoped>
.previsao-cell-text {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.previsao-strong-text {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(47, 125, 50, 0.12);
}

.pagamentos-table-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pagamentos-table-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.pagamentos-table-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.pagamentos-table-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
