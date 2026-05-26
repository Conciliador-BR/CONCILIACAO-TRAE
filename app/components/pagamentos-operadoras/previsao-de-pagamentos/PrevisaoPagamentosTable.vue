<template>
  <div class="h-full w-full">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">Autorizadora:</label>
        <select
          v-model="autorizadoraFiltro"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas</option>
          <option v-for="op in autorizadorasDisponiveis" :key="op" :value="op">{{ op }}</option>
        </select>
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition-colors hover:bg-slate-100"
          @click="clearAllFilters"
        >
          Limpar filtros
        </button>
      </div>
      <span class="text-xs text-slate-600">Filtros ativos: {{ activeFiltersCount + (autorizadoraFiltro ? 1 : 0) }}</span>
    </div>
    <div class="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm" style="scrollbar-width: thin;">
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
      <tbody class="divide-y divide-slate-100 bg-white">
        <tr v-for="(venda, index) in filteredVendas" :key="venda.id || index" class="transition-colors hover:bg-gray-50">
          <td v-for="column in visibleColumns" :key="column" class="border-b border-slate-100 px-4 py-3 text-sm text-gray-900">
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
          <td :colspan="visibleColumns.length" class="px-6 py-8 text-center text-gray-500">
            Nenhuma previsão encontrada
          </td>
        </tr>
      </tbody>
      <tfoot class="border-t border-slate-200 bg-slate-50">
        <tr>
          <td
            v-for="column in visibleColumns"
            :key="`total-${column}`"
            class="border-b border-slate-200 border-r border-slate-200 px-4 py-3 text-sm font-semibold last:border-r-0"
            :class="numericColumns.has(column) ? 'text-right text-slate-900' : 'text-slate-500'"
          >
            <span v-if="column === visibleColumns[0]">Totais (filtrados)</span>
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
  const baseClasses = 'text-sm'
  
  // Alinhamento à direita para valores numéricos
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' text-right font-medium'
  }
  
  return baseClasses
}

// Inicializar taxas ao montar o componente
onMounted(async () => {
  await inicializar()
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
