<template>
  <div class="h-full w-full">
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
    <div class="overflow-auto rounded-[28px] border-2 border-[#244b77]/35 bg-gradient-to-br from-white via-[#fcfefc] to-[#f4fbf5] shadow-lg shadow-[#73c77d]/10" style="scrollbar-width: thin;">
    <table class="w-full table-fixed">
      <colgroup>
        <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
      </colgroup>
      <PrevisaoPagamentosTableHeader 
        :visible-columns="visibleColumns"
        :column-titles="columnTitles"
        :dragged-column="draggedColumn"
        :column-filters="columnFilters"
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
            class="px-4 py-3.5 text-sm text-slate-700 transition-colors duration-200 group-hover:text-[#214f24]"
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
            class="border-b border-[#244b77]/15 border-r border-[#244b77]/10 px-4 py-3.5 text-sm font-semibold last:border-r-0"
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
import PrevisaoPagamentosTableHeader from './PrevisaoPagamentosTableHeader.vue'
import PrevisaoPgtoColumn from './PrevisaoPgtoColumn.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { usePrevisaoColuna } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/usePrevisaoColuna'

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
const dateColumns = new Set(['dataVenda', 'previsaoPgto'])
const numericColumns = new Set(['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'numeroParcelas'])
const currencyColumns = new Set(['vendaBruta', 'vendaLiquida', 'despesaMdr'])
const columnFilters = reactive({})
const autorizadoraFiltro = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(30)
const paginaDestino = ref('1')
const pageSizeOptions = [10, 20, 30, 50, 100]

watch(() => props.visibleColumns, (cols) => {
  ;(cols || []).forEach((col) => {
    if (typeof columnFilters[col] === 'undefined') columnFilters[col] = ''
  })
}, { immediate: true, deep: true })

const normalizeText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  const normalized = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
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

const getRawValue = (row, column) => {
  const map = {
    empresa: ['empresa'],
    matriz: ['matriz'],
    adquirente: ['adquirente'],
    bandeira: ['bandeira'],
    dataVenda: ['dataVenda', 'data_venda'],
    previsaoPgto: ['previsaoPgto', 'previsao_pgto'],
    modalidade: ['modalidade'],
    nsu: ['nsu'],
    vendaBruta: ['vendaBruta', 'valor_bruto'],
    vendaLiquida: ['vendaLiquida', 'valor_liquido'],
    taxaMdr: ['taxaMdr', 'taxa_mdr'],
    despesaMdr: ['despesaMdr', 'despesa_mdr'],
    numeroParcelas: ['numeroParcelas', 'numero_parcelas']
  }
  const keys = map[column] || [column]
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

const autorizadorasDisponiveis = computed(() => {
  return Array.from(new Set((props.vendas || [])
    .map((v) => String(getRawValue(v, 'adquirente') || '').trim().toUpperCase())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
})

const activeFiltersCount = computed(() => {
  return (props.visibleColumns || []).reduce((acc, col) => acc + (String(columnFilters[col] || '').trim() ? 1 : 0), 0)
})

const filteredVendas = computed(() => {
  const rows = props.vendas || []
  return rows.filter((row) => {
    if (autorizadoraFiltro.value) {
      const adquirente = String(getRawValue(row, 'adquirente') || '').trim().toUpperCase()
      if (adquirente !== autorizadoraFiltro.value) return false
    }
    return (props.visibleColumns || []).every((col) => {
      const filterValue = String(columnFilters[col] || '').trim()
      if (!filterValue) return true
      const rawValue = getRawValue(row, col)
      if (dateColumns.has(col)) return toIsoDate(rawValue) === filterValue
      if (numericColumns.has(col)) {
        const rowNumber = parseNumeric(rawValue)
        const filterNumber = parseNumeric(filterValue)
        if (!Number.isFinite(rowNumber) || !Number.isFinite(filterNumber)) return false
        return rowNumber >= filterNumber
      }
      return normalizeText(rawValue).includes(normalizeText(filterValue))
    })
  })
})

const totalItems = computed(() => filteredVendas.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / Number(itemsPerPage.value || 30))))
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
  ;(props.visibleColumns || []).forEach((col) => { columnFilters[col] = '' })
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
  const baseClasses = 'previsao-cell-text text-sm'
  
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
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return 'text-right'
  }

  return ''
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
</style>
